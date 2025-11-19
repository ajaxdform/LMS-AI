package com.devlcm.lcm.interceptor;

import com.devlcm.lcm.annotation.RateLimit;
import com.devlcm.lcm.exception.RateLimitExceededException;
import com.devlcm.lcm.service.RateLimitService;
import com.devlcm.lcm.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Interceptor to enforce rate limiting on API endpoints.
 * Checks for @RateLimit annotation on controller methods and classes.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitInterceptor implements HandlerInterceptor {
    
    private final RateLimitService rateLimitService;
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }
        
        // Check for @RateLimit annotation on method first, then on class
        RateLimit rateLimit = handlerMethod.getMethodAnnotation(RateLimit.class);
        if (rateLimit == null) {
            rateLimit = handlerMethod.getBeanType().getAnnotation(RateLimit.class);
        }
        
        // If no @RateLimit annotation found, allow the request
        if (rateLimit == null) {
            return true;
        }
        
        // Determine the key for rate limiting based on scope
        String key = getRateLimitKey(request, rateLimit.scope());
        
        // Try to consume a token from the bucket
        boolean allowed = rateLimitService.tryConsume(key, rateLimit.limit(), rateLimit.duration());
        
        if (!allowed) {
            long retryAfter = rateLimitService.getSecondsUntilReset(key, rateLimit.limit(), rateLimit.duration());
            log.warn("Rate limit exceeded for key: {} (scope: {}). Retry after {} seconds", 
                key, rateLimit.scope(), retryAfter);
            
            throw new RateLimitExceededException(
                String.format("Rate limit exceeded. Maximum %d requests per %d seconds allowed. Try again in %d seconds.",
                    rateLimit.limit(), rateLimit.duration(), retryAfter),
                retryAfter
            );
        }
        
        return true;
    }
    
    /**
     * Get the rate limiting key based on the scope.
     *
     * @param request HTTP request
     * @param scope Rate limit scope (PER_USER or PER_IP)
     * @return Unique key for rate limiting
     */
    private String getRateLimitKey(HttpServletRequest request, RateLimit.Scope scope) {
        if (scope == RateLimit.Scope.PER_USER) {
            try {
                String firebaseUid = AuthUtil.getCurrentFirebaseUid();
                return "user:" + firebaseUid;
            } catch (Exception e) {
                // If user is not authenticated, fall back to IP-based rate limiting
                log.debug("User not authenticated, falling back to IP-based rate limiting");
                return "ip:" + getClientIpAddress(request);
            }
        } else {
            return "ip:" + getClientIpAddress(request);
        }
    }
    
    /**
     * Extract the client's IP address from the request.
     * Handles X-Forwarded-For header for proxied requests.
     *
     * @param request HTTP request
     * @return Client IP address
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // X-Forwarded-For can contain multiple IPs, take the first one
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}

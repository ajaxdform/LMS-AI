package com.devlcm.lcm.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Filter to add request ID to all requests for better tracing and debugging.
 * Request ID is added to MDC for logging and as HTTP header in response.
 */
@Component
@Order(1)
public class RequestIdFilter extends OncePerRequestFilter {

    private static final String REQUEST_ID_HEADER = "X-Request-ID";
    private static final String MDC_REQUEST_ID_KEY = "requestId";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        
        // Get request ID from header or generate new one
        String requestId = request.getHeader(REQUEST_ID_HEADER);
        if (requestId == null || requestId.isEmpty()) {
            requestId = UUID.randomUUID().toString();
        }
        
        // Add to MDC for logging
        MDC.put(MDC_REQUEST_ID_KEY, requestId);
        
        // Add to response header
        response.setHeader(REQUEST_ID_HEADER, requestId);
        
        try {
            filterChain.doFilter(request, response);
        } finally {
            // Clear MDC after request
            MDC.clear();
        }
    }
}

package com.devlcm.lcm.config;

import com.devlcm.lcm.interceptor.RateLimitInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC configuration to register custom interceptors.
 */
@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {
    
    private final RateLimitInterceptor rateLimitInterceptor;
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(rateLimitInterceptor)
            .addPathPatterns("/api/v1/**")  // Apply to all API endpoints
            .excludePathPatterns(
                "/api/v1/swagger-ui/**",
                "/api/v1/v3/api-docs/**",
                "/api/v1/actuator/**"
            );
    }
}

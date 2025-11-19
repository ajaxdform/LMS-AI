package com.devlcm.lcm.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to enable rate limiting on controller methods.
 * Can be applied at method or class level.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimit {
    
    /**
     * Maximum number of requests allowed within the time window.
     * Default: 100 requests
     */
    int limit() default 100;
    
    /**
     * Time window in seconds for the rate limit.
     * Default: 60 seconds (1 minute)
     */
    int duration() default 60;
    
    /**
     * Rate limit scope: PER_USER or PER_IP
     * PER_USER: Rate limit per authenticated user (uses Firebase UID)
     * PER_IP: Rate limit per IP address
     * Default: PER_USER
     */
    Scope scope() default Scope.PER_USER;
    
    enum Scope {
        PER_USER,
        PER_IP
    }
}

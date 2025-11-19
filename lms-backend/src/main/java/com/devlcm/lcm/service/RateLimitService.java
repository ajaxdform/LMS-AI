package com.devlcm.lcm.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service to manage rate limiting using Bucket4j.
 * Tracks rate limits per user or per IP address.
 */
@Slf4j
@Service
public class RateLimitService {
    
    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();
    
    /**
     * Resolve a bucket for the given key with specified limits.
     * Creates a new bucket if one doesn't exist.
     *
     * @param key Unique identifier (user ID or IP address)
     * @param limit Maximum number of requests allowed
     * @param duration Time window in seconds
     * @return Bucket for rate limiting
     */
    public Bucket resolveBucket(String key, int limit, int duration) {
        return cache.computeIfAbsent(key, k -> createNewBucket(limit, duration));
    }
    
    /**
     * Create a new bucket with the specified capacity and refill rate.
     *
     * @param capacity Maximum number of tokens (requests)
     * @param duration Time window for refill in seconds
     * @return New Bucket instance
     */
    private Bucket createNewBucket(int capacity, int duration) {
        Bandwidth bandwidth = Bandwidth.builder()
            .capacity(capacity)
            .refillGreedy(capacity, Duration.ofSeconds(duration))
            .build();
        return Bucket.builder()
            .addLimit(bandwidth)
            .build();
    }
    /**
     * Try to consume a token from the bucket for the given key.
     *
     * @param key Unique identifier (user ID or IP address)
     * @param limit Maximum number of requests allowed
     * @param duration Time window in seconds
     * @return true if token was consumed (request allowed), false if rate limit exceeded
     */
    public boolean tryConsume(String key, int limit, int duration) {
        Bucket bucket = resolveBucket(key, limit, duration);
        boolean consumed = bucket.tryConsume(1);
        
        if (!consumed) {
            log.warn("Rate limit exceeded for key: {}", key);
        }
        
        return consumed;
    }
    
    /**
     * Get the number of seconds until the rate limit resets for a given key.
     *
     * @param key Unique identifier (user ID or IP address)
     * @param limit Maximum number of requests allowed
     * @param duration Time window in seconds
     * @return Seconds until reset
     */
    public long getSecondsUntilReset(String key, int limit, int duration) {
        Bucket bucket = resolveBucket(key, limit, duration);
        long nanosToWait = bucket.estimateAbilityToConsume(1).getNanosToWaitForRefill();
        return Duration.ofNanos(nanosToWait).getSeconds();
    }
    
    /**
     * Clear the rate limit cache for a specific key.
     * Useful for testing or manual reset.
     *
     * @param key Unique identifier to clear
     */
    public void clearCache(String key) {
        cache.remove(key);
        log.info("Cleared rate limit cache for key: {}", key);
    }
    
    /**
     * Clear all rate limit caches.
     */
    public void clearAllCaches() {
        cache.clear();
        log.info("Cleared all rate limit caches");
    }
}

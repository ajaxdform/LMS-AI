package com.devlcm.lcm.controller;

import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.devlcm.lcm.dto.ApiResponse;
import com.devlcm.lcm.entity.User;
import com.devlcm.lcm.entity.UserRole;
import com.devlcm.lcm.service.UserService;
import com.devlcm.lcm.util.AuthUtil;
import com.github.benmanes.caffeine.cache.stats.CacheStats;

import lombok.RequiredArgsConstructor;

import java.util.HashMap;
import java.util.Map;
import java.util.Collection;

/**
 * Controller for cache management and monitoring
 * Only accessible by ADMIN users
 */
@RestController
@RequestMapping("/api/v1/admin/cache")
@RequiredArgsConstructor
public class CacheController {

    private final CacheManager cacheManager;
    private final UserService userService;
    
    /**
     * Verify that the current user is an admin.
     * Checks both Firebase token claim and database role.
     */
    private void verifyAdminAccess() {
        String currentUid = AuthUtil.getCurrentFirebaseUid();
        
        // Check token claim first
        if (AuthUtil.hasRole("ADMIN")) {
            return;
        }
        
        // Fallback to database check
        User currentUser = userService.getUserByFirebaseUid(currentUid)
            .orElseThrow(() -> new com.devlcm.lcm.exception.UserNotFoundException(
                "Current user not found"));
        
        if (currentUser.getRole() != UserRole.ADMIN) {
            throw new com.devlcm.lcm.exception.UnauthorizedAccessException(
                "Admin access required");
        }
    }

    /**
     * Get statistics for all caches
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, CacheStatsDTO>>> getCacheStats() {
        verifyAdminAccess();
        Map<String, CacheStatsDTO> stats = new HashMap<>();
        
        Collection<String> cacheNames = cacheManager.getCacheNames();
        for (String cacheName : cacheNames) {
            Cache cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                Object nativeCache = cache.getNativeCache();
                if (nativeCache instanceof com.github.benmanes.caffeine.cache.Cache) {
                    @SuppressWarnings("unchecked")
                    com.github.benmanes.caffeine.cache.Cache<Object, Object> caffeineCache = 
                        (com.github.benmanes.caffeine.cache.Cache<Object, Object>) nativeCache;
                    
                    CacheStats cacheStats = caffeineCache.stats();
                    stats.put(cacheName, new CacheStatsDTO(
                        caffeineCache.estimatedSize(),
                        cacheStats.hitCount(),
                        cacheStats.missCount(),
                        cacheStats.hitRate(),
                        cacheStats.evictionCount(),
                        cacheStats.loadSuccessCount(),
                        cacheStats.loadFailureCount()
                    ));
                }
            }
        }
        
        return ResponseEntity.ok(ApiResponse.success(stats, "Cache statistics retrieved successfully"));
    }

    /**
     * Get statistics for a specific cache
     */
    @GetMapping("/stats/{cacheName}")
    public ResponseEntity<ApiResponse<CacheStatsDTO>> getCacheStatsByName(@PathVariable String cacheName) {
        verifyAdminAccess();
        Cache cache = cacheManager.getCache(cacheName);
        
        if (cache == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Cache not found: " + cacheName));
        }
        
        Object nativeCache = cache.getNativeCache();
        if (nativeCache instanceof com.github.benmanes.caffeine.cache.Cache) {
            @SuppressWarnings("unchecked")
            com.github.benmanes.caffeine.cache.Cache<Object, Object> caffeineCache = 
                (com.github.benmanes.caffeine.cache.Cache<Object, Object>) nativeCache;
            
            CacheStats stats = caffeineCache.stats();
            CacheStatsDTO dto = new CacheStatsDTO(
                caffeineCache.estimatedSize(),
                stats.hitCount(),
                stats.missCount(),
                stats.hitRate(),
                stats.evictionCount(),
                stats.loadSuccessCount(),
                stats.loadFailureCount()
            );
            
            return ResponseEntity.ok(ApiResponse.success(dto, "Cache statistics retrieved successfully"));
        }
        
        return ResponseEntity.badRequest()
            .body(ApiResponse.error("Cache statistics not available for: " + cacheName));
    }

    /**
     * Clear all caches
     */
    @DeleteMapping("/clear")
    public ResponseEntity<ApiResponse<Void>> clearAllCaches() {
        verifyAdminAccess();
        Collection<String> cacheNames = cacheManager.getCacheNames();
        for (String cacheName : cacheNames) {
            Cache cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                cache.clear();
            }
        }
        return ResponseEntity.ok(ApiResponse.success(null, "All caches cleared successfully"));
    }

    /**
     * Clear a specific cache
     */
    @DeleteMapping("/clear/{cacheName}")
    public ResponseEntity<ApiResponse<Void>> clearCache(@PathVariable String cacheName) {
        verifyAdminAccess();
        Cache cache = cacheManager.getCache(cacheName);
        
        if (cache == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Cache not found: " + cacheName));
        }
        
        cache.clear();
        return ResponseEntity.ok(ApiResponse.success(null, "Cache cleared successfully: " + cacheName));
    }

    /**
     * Get list of all cache names
     */
    @GetMapping("/names")
    public ResponseEntity<ApiResponse<Collection<String>>> getCacheNames() {
        verifyAdminAccess();
        Collection<String> cacheNames = cacheManager.getCacheNames();
        return ResponseEntity.ok(ApiResponse.success(cacheNames, "Cache names retrieved successfully"));
    }

    /**
     * DTO for cache statistics
     */
    public record CacheStatsDTO(
        long size,
        long hitCount,
        long missCount,
        double hitRate,
        long evictionCount,
        long loadSuccessCount,
        long loadFailureCount
    ) {}
}

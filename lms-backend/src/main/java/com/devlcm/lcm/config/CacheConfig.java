package com.devlcm.lcm.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Cache configuration for the application using Caffeine cache.
 * Provides high-performance in-memory caching for frequently accessed data.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    // Cache names as constants for type safety
    public static final String COURSES_CACHE = "courses";
    public static final String COURSE_BY_ID_CACHE = "courseById";
    public static final String CHAPTERS_CACHE = "chapters";
    public static final String CHAPTER_BY_ID_CACHE = "chapterById";
    public static final String TOPICS_CACHE = "topics";
    public static final String TOPIC_BY_ID_CACHE = "topicById";
    public static final String QUIZZES_CACHE = "quizzes";
    public static final String QUIZ_BY_ID_CACHE = "quizById";
    public static final String USER_PROGRESS_CACHE = "userProgress";
    public static final String DASHBOARD_STATS_CACHE = "dashboardStats";
    public static final String USER_STATS_CACHE = "userStats";
    public static final String COURSE_STATS_CACHE = "courseStats";

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
                COURSES_CACHE,
                COURSE_BY_ID_CACHE,
                CHAPTERS_CACHE,
                CHAPTER_BY_ID_CACHE,
                TOPICS_CACHE,
                TOPIC_BY_ID_CACHE,
                QUIZZES_CACHE,
                QUIZ_BY_ID_CACHE,
                USER_PROGRESS_CACHE,
                DASHBOARD_STATS_CACHE,
                USER_STATS_CACHE,
                COURSE_STATS_CACHE
        );
        
        cacheManager.setCaffeine(caffeineCacheBuilder());
        return cacheManager;
    }

    /**
     * Configure Caffeine cache with optimal settings:
     * - Maximum 10,000 entries per cache
     * - Expire after write: 10 minutes
     * - Expire after access: 5 minutes
     * - Record cache statistics for monitoring
     */
    private Caffeine<Object, Object> caffeineCacheBuilder() {
        return Caffeine.newBuilder()
                .maximumSize(10_000)
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .expireAfterAccess(5, TimeUnit.MINUTES)
                .recordStats(); // Enable statistics for cache monitoring
    }
}

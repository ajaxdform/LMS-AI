# Rate Limiting Implementation Guide

## Overview

The LMS Backend now includes a comprehensive rate limiting system to prevent API abuse and ensure fair usage across all users. The system uses **Bucket4j** library with the token bucket algorithm.

## Features

- ✅ **Flexible Configuration**: Customize limits per endpoint or controller
- ✅ **Per-User or Per-IP**: Rate limit by authenticated user (Firebase UID) or IP address
- ✅ **Automatic HTTP 429 Responses**: Proper "Too Many Requests" error handling
- ✅ **Retry-After Headers**: Clients know when to retry
- ✅ **In-Memory Tracking**: Fast and efficient using ConcurrentHashMap
- ✅ **Easy to Use**: Simple annotation-based configuration

## Components

### 1. `@RateLimit` Annotation
Apply rate limiting to controller methods or entire controllers.

**Location**: `com.devlcm.lcm.annotation.RateLimit`

**Parameters**:
- `limit` (int): Maximum number of requests allowed (default: 100)
- `duration` (int): Time window in seconds (default: 60)
- `scope` (Scope enum): PER_USER or PER_IP (default: PER_USER)

### 2. RateLimitService
Manages rate limiting buckets and token consumption.

**Location**: `com.devlcm.lcm.service.RateLimitService`

**Key Methods**:
- `tryConsume(key, limit, duration)`: Try to consume a token
- `getSecondsUntilReset(key, limit, duration)`: Get retry time
- `clearCache(key)`: Clear cache for specific key
- `clearAllCaches()`: Clear all caches

### 3. RateLimitInterceptor
Intercepts requests and enforces rate limits before reaching controllers.

**Location**: `com.devlcm.lcm.interceptor.RateLimitInterceptor`

### 4. RateLimitExceededException
Exception thrown when rate limit is exceeded.

**Location**: `com.devlcm.lcm.exception.RateLimitExceededException`

### 5. GlobalExceptionHandler
Handles rate limit exceptions and returns HTTP 429 responses.

**Location**: `com.devlcm.lcm.exception.GlobalExceptionHandler`

## Usage Examples

### Example 1: Apply to Entire Controller (Class-Level)

```java
@RestController
@RequestMapping("/api/v1/courses")
@RateLimit(limit = 100, duration = 60) // 100 requests per minute per user
public class CourseController {
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<CourseDTO>>> getAllCourses() {
        // All methods in this controller are rate-limited
    }
}
```

### Example 2: Apply to Specific Method

```java
@RestController
@RequestMapping("/api/v1/quizzes")
public class QuizzController {
    
    @PostMapping("/{quizzId}/submit")
    @RateLimit(limit = 10, duration = 60) // 10 quiz submissions per minute
    public ResponseEntity<ApiResponse<QuizzResult>> submitQuiz(
            @PathVariable String quizzId,
            @RequestBody QuizzSubmissionDTO submission) {
        // Only this endpoint is rate-limited
    }
}
```

### Example 3: IP-Based Rate Limiting

```java
@RestController
@RequestMapping("/api/v1/public")
@RateLimit(limit = 50, duration = 60, scope = RateLimit.Scope.PER_IP)
public class PublicController {
    // Rate limit applies per IP address (for unauthenticated endpoints)
}
```

### Example 4: Different Limits for Different Methods

```java
@RestController
@RequestMapping("/api/v1/enrollments")
@RateLimit(limit = 50, duration = 60) // Default: 50 per minute
public class EnrollmentController {
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<Course>>> getEnrollments() {
        // Uses default: 50 requests per minute
    }
    
    @PostMapping("/{courseId}/enroll")
    @RateLimit(limit = 5, duration = 60) // Stricter: 5 per minute
    public ResponseEntity<ApiResponse<Void>> enrollInCourse(@PathVariable String courseId) {
        // More restrictive for enrollment actions
    }
}
```

## Current Rate Limits

The following controllers have rate limiting enabled:

| Controller | Limit | Duration | Scope | Reasoning |
|------------|-------|----------|-------|-----------|
| CourseController | 100 | 60s | PER_USER | General browsing, moderate traffic expected |
| EnrollmentController | 50 | 60s | PER_USER | Less frequent actions, prevent abuse |
| QuizzController | 30 | 60s | PER_USER | Prevent quiz cheating/automation |

## API Response

### Success Response (Normal Request)
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": { ... },
  "timestamp": "2025-11-12T10:30:00"
}
```

### Rate Limit Exceeded Response (HTTP 429)
```json
{
  "success": false,
  "errorCode": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded. Maximum 100 requests per 60 seconds allowed. Try again in 45 seconds.",
  "timestamp": "2025-11-12T10:30:00",
  "requestId": "abc123"
}
```

**Response Headers**:
- `X-RateLimit-Retry-After-Seconds`: Time in seconds until rate limit resets
- `Retry-After`: Same value (standard HTTP header)

## Frontend Handling

### Axios Interceptor Example

```javascript
// src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
});

// Response interceptor to handle rate limiting
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['x-ratelimit-retry-after-seconds'];
      const message = error.response.data.message;
      
      // Show user-friendly message
      alert(`Rate limit exceeded. Please try again in ${retryAfter} seconds.`);
      
      // Optional: Auto-retry after delay
      // return new Promise(resolve => {
      //   setTimeout(() => resolve(api.request(error.config)), retryAfter * 1000);
      // });
    }
    return Promise.reject(error);
  }
);

export default api;
```

### React Component Example

```javascript
const handleSubmit = async () => {
  try {
    const response = await api.post('/enrollments/courses/123/enroll');
    console.log('Enrolled successfully');
  } catch (error) {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['x-ratelimit-retry-after-seconds'];
      setError(`Too many requests. Please wait ${retryAfter} seconds and try again.`);
    } else {
      setError('An error occurred');
    }
  }
};
```

## Configuration

### Add Rate Limiting to New Controllers

1. Import the annotation:
```java
import com.devlcm.lcm.annotation.RateLimit;
```

2. Add to controller class or method:
```java
@RateLimit(limit = 100, duration = 60)
```

3. Customize parameters as needed

### Adjust Existing Limits

Simply change the annotation parameters:
```java
@RateLimit(limit = 200, duration = 60) // Increase to 200 per minute
```

### Disable Rate Limiting for Testing

**Option 1**: Remove the annotation temporarily
**Option 2**: Set very high limits
```java
@RateLimit(limit = 999999, duration = 1)
```

## Advanced Usage

### Clear Rate Limit Cache (Admin Endpoint)

You can create an admin endpoint to clear rate limit caches:

```java
@RestController
@RequestMapping("/api/v1/admin/rate-limits")
public class RateLimitAdminController {
    
    @Autowired
    private RateLimitService rateLimitService;
    
    @DeleteMapping("/cache/{key}")
    public ResponseEntity<ApiResponse<Void>> clearCache(@PathVariable String key) {
        rateLimitService.clearCache(key);
        return ResponseEntity.ok(ApiResponse.success(null, "Cache cleared"));
    }
    
    @DeleteMapping("/cache/all")
    public ResponseEntity<ApiResponse<Void>> clearAllCaches() {
        rateLimitService.clearAllCaches();
        return ResponseEntity.ok(ApiResponse.success(null, "All caches cleared"));
    }
}
```

### Custom Rate Limiting Logic

If you need custom logic, inject `RateLimitService` directly:

```java
@Service
public class CustomService {
    
    @Autowired
    private RateLimitService rateLimitService;
    
    public void performAction(String userId) {
        // Custom rate limit: 5 per hour
        if (!rateLimitService.tryConsume("custom:" + userId, 5, 3600)) {
            throw new RateLimitExceededException("Custom rate limit exceeded", 3600);
        }
        
        // Proceed with action
    }
}
```

## Testing Rate Limits

### Manual Testing with cURL

```bash
# Send multiple requests quickly
for i in {1..101}; do
  curl -H "Authorization: Bearer YOUR_TOKEN" \
       http://localhost:8080/api/v1/courses
done

# The 101st request should return HTTP 429
```

### Postman Testing

1. Create a collection with your endpoint
2. Use Postman Runner to send multiple requests
3. Set iterations to exceed the rate limit (e.g., 110 for a 100 limit)
4. Verify that requests after the limit return 429

### Unit Test Example

```java
@Test
void testRateLimit() throws Exception {
    // Send 100 requests (within limit)
    for (int i = 0; i < 100; i++) {
        mockMvc.perform(get("/api/v1/courses")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk());
    }
    
    // 101st request should be rate limited
    mockMvc.perform(get("/api/v1/courses")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isTooManyRequests())
        .andExpect(jsonPath("$.errorCode").value("RATE_LIMIT_EXCEEDED"));
}
```

## Best Practices

1. **Set Reasonable Limits**: Don't make limits too strict or too loose
   - Read operations: 100-200 per minute
   - Write operations: 30-50 per minute
   - Sensitive operations (enrollment, quiz): 5-10 per minute

2. **Use PER_USER for Authenticated Endpoints**: More accurate tracking
3. **Use PER_IP for Public Endpoints**: Prevent anonymous abuse
4. **Log Rate Limit Events**: Already implemented in `RateLimitService`
5. **Test Thoroughly**: Verify limits work as expected
6. **Document for API Consumers**: Inform users about rate limits

## Monitoring

### Log Analysis

Rate limit events are logged with WARN level:
```
WARN  RateLimitService - Rate limit exceeded for key: user:abc123
```

### Recommendations for Production

1. **Add Metrics**: Track rate limit hits using Micrometer/Prometheus
2. **Use Redis**: For distributed systems, replace ConcurrentHashMap with Redis
3. **Add Rate Limit Headers**: Include X-RateLimit-Remaining, X-RateLimit-Reset headers
4. **Implement Whitelist**: Allow certain users/IPs to bypass rate limits

## Troubleshooting

### Issue: Rate limit applies even though I'm within limits
**Solution**: Clear the cache using `rateLimitService.clearCache(key)`

### Issue: Different users are sharing the same rate limit
**Solution**: Verify `scope = RateLimit.Scope.PER_USER` is set and authentication is working

### Issue: Rate limit persists across server restarts
**Solution**: This is expected with in-memory cache. Use Redis for persistence if needed

### Issue: Getting 429 on every request
**Solution**: Check if the rate limit is too strict or if there's a bug in key generation

## Migration Notes

### Existing Controllers Without Rate Limiting

Add the annotation gradually:
1. Start with loose limits to observe traffic patterns
2. Adjust based on actual usage
3. Tighten limits for sensitive operations

### Backward Compatibility

The rate limiting system is **backward compatible**. Controllers without the `@RateLimit` annotation will work normally without any rate limiting applied.

## Dependencies

Added to `pom.xml`:
```xml
<dependency>
    <groupId>com.bucket4j</groupId>
    <artifactId>bucket4j-core</artifactId>
    <version>8.10.1</version>
</dependency>
```

## Security Considerations

1. **DDoS Protection**: Rate limiting provides basic DDoS protection
2. **Brute Force Prevention**: Helps prevent brute force attacks on login/enrollment
3. **Resource Management**: Prevents any single user from consuming excessive resources
4. **Fair Usage**: Ensures fair API access for all users

## Future Enhancements

- [ ] Add Redis support for distributed rate limiting
- [ ] Implement rate limit headers (X-RateLimit-Remaining, etc.)
- [ ] Add admin dashboard for monitoring rate limits
- [ ] Implement dynamic rate limits based on user tier
- [ ] Add rate limit metrics to Grafana/Prometheus
- [ ] Whitelist/blacklist functionality
- [ ] Custom error messages per endpoint

---

**Last Updated**: November 12, 2025
**Version**: 1.0
**Status**: ✅ Implemented and Active

# API Improvements - Implementation Guide

## Quick Wins (Implement First)

### 1. Create Standardized Response Wrapper

**File:** `src/main/java/com/devlcm/lcm/dto/ApiResponse.java`

```java
package com.devlcm.lcm.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private String errorCode;
    private String requestId;
    private LocalDateTime timestamp;

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
            .success(true)
            .data(data)
            .timestamp(LocalDateTime.now())
            .build();
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
            .success(true)
            .message(message)
            .data(data)
            .timestamp(LocalDateTime.now())
            .build();
    }

    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
            .success(false)
            .message(message)
            .timestamp(LocalDateTime.now())
            .build();
    }

    public static <T> ApiResponse<T> error(String errorCode, String message, String requestId) {
        return ApiResponse.<T>builder()
            .success(false)
            .errorCode(errorCode)
            .message(message)
            .requestId(requestId)
            .timestamp(LocalDateTime.now())
            .build();
    }
}
```

---

### 2. Add Request ID Filter

**File:** `src/main/java/com/devlcm/lcm/filter/RequestIdFilter.java`

```java
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

@Component
@Order(1)
public class RequestIdFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        
        String requestId = request.getHeader("X-Request-ID");
        if (requestId == null || requestId.isEmpty()) {
            requestId = UUID.randomUUID().toString();
        }
        
        MDC.put("requestId", requestId);
        response.setHeader("X-Request-ID", requestId);
        
        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.clear();
        }
    }
}
```

---

### 3. Enhanced GlobalExceptionHandler

**Update:** `src/main/java/com/devlcm/lcm/exception/GlobalExceptionHandler.java`

```java
// Add to existing class
import org.slf4j.MDC;
import com.devlcm.lcm.dto.ApiResponse;

@ExceptionHandler(CourseNotFoundException.class)
public ResponseEntity<ApiResponse<Void>> handleCourseNotFoundException(
        CourseNotFoundException ex) {
    String requestId = MDC.get("requestId");
    log.warn("Course not found: {} [RequestId: {}]", ex.getMessage(), requestId);
    
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(ApiResponse.error(
            "COURSE_NOT_FOUND",
            ex.getMessage(),
            requestId
        ));
}

// Apply same pattern to all exception handlers
```

---

### 4. Fix PublicController Validation

**Update:** `src/main/java/com/devlcm/lcm/controller/PublicController.java`

```java
@PostMapping(path = "/signup")
@Operation(summary = "Register new user")
@ApiResponses(value = {
    @ApiResponse(responseCode = "201", description = "User created"),
    @ApiResponse(responseCode = "400", description = "Invalid input"),
    @ApiResponse(responseCode = "409", description = "User exists")
})
public ResponseEntity<ApiResponse<UserDTO>> signup(
        @Valid @RequestBody UserDTO userDTO) {
    
    UserRecord userRecord = FirebaseAuth.getInstance().createUser(
        new UserRecord.CreateRequest()
            .setEmail(userDTO.getEmail())
            .setPassword(userDTO.getPassword())
    );
    
    User userEntity = allMapper.toUserEntity(userDTO);
    User createdUser = userService.createUser(userEntity, userRecord.getUid());
    
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiResponse.success(
            allMapper.toUserDTO(createdUser),
            "User created successfully"
        ));
}
```

---

### 5. Add API Versioning

**Update all controllers:**
```java
// Change from:
@RequestMapping("/courses")

// To:
@RequestMapping("/api/v1/courses")
```

---

### 6. Add Security Headers

**Update:** `src/main/java/com/devlcm/lcm/config/SecurityConfig.java`

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .csrf(csrf -> csrf.disable())
        .headers(headers -> headers
            .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'"))
            .httpStrictTransportSecurity(hsts -> hsts
                .maxAgeInSeconds(31536000)
                .includeSubdomains(true))
            .frameOptions(FrameOptionsConfig::deny)
            .xssProtection(xss -> xss.block())
            .contentTypeOptions(ContentTypeOptionsConfig::deny)
        )
        // ... rest of config
}
```

---

### 7. Add Input Validation to All Endpoints

**Example for CourseController:**
```java
@GetMapping("/{id}")
public ResponseEntity<ApiResponse<CourseDTO>> getCourseById(
        @PathVariable @NotBlank String id) {
    // ...
}

@GetMapping("/search")
public ResponseEntity<ApiResponse<List<CourseDTO>>> searchCourses(
        @RequestParam @NotBlank @Size(min=2, max=100) String q) {
    // ...
}
```

---

### 8. Add Logging Aspect

**File:** `src/main/java/com/devlcm/lcm/aspect/ApiLoggingAspect.java`

```java
package com.devlcm.lcm.aspect;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.util.StopWatch;

@Aspect
@Component
@Slf4j
public class ApiLoggingAspect {

    @Around("@within(org.springframework.web.bind.annotation.RestController)")
    public Object logApiCall(ProceedingJoinPoint joinPoint) throws Throwable {
        StopWatch stopWatch = new StopWatch();
        stopWatch.start();
        
        String methodName = joinPoint.getSignature().toShortString();
        Object[] args = joinPoint.getArgs();
        
        log.info("API Call: {} with args: {}", methodName, args);
        
        try {
            Object result = joinPoint.proceed();
            stopWatch.stop();
            log.info("API Call completed: {} in {}ms", methodName, stopWatch.getTotalTimeMillis());
            return result;
        } catch (Exception e) {
            stopWatch.stop();
            log.error("API Call failed: {} in {}ms", methodName, stopWatch.getTotalTimeMillis(), e);
            throw e;
        }
    }
}
```

**Add dependency to pom.xml:**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-aop</artifactId>
</dependency>
```

---

## Validation Checklist

### Endpoints Missing Validation

- [ ] `PublicController.signup()` - Add `@Valid`
- [ ] `CourseController.searchCourses()` - Validate query param
- [ ] `EnrollmentController` - Validate path variables
- [ ] `QuizzController` - Validate all inputs
- [ ] `UserProgressController` - Validate all params

### Endpoints Returning Wrong Types

- [ ] `CourseController.searchCourses()` - Returns `List<Course>` instead of `List<CourseDTO>`
- [ ] `CourseController.getCoursesBySubject()` - Returns `List<Course>` instead of `List<CourseDTO>`
- [ ] `EnrollmentController.getMyCourses()` - Returns `List<Course>` instead of `List<CourseDTO>`

### Error Handling Issues

- [ ] Remove try-catch from `PublicController`
- [ ] Remove try-catch from `UserController`
- [ ] Standardize all error responses

---

## Testing Improvements

### Add Integration Tests

**File:** `src/test/java/com/devlcm/lcm/controller/CourseControllerTest.java`

```java
@SpringBootTest
@AutoConfigureMockMvc
class CourseControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    void testGetCourseById_Success() throws Exception {
        mockMvc.perform(get("/api/v1/courses/{id}", "course-id")
                .header("Authorization", "Bearer token"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.id").exists());
    }
    
    @Test
    void testGetCourseById_NotFound() throws Exception {
        mockMvc.perform(get("/api/v1/courses/{id}", "invalid-id")
                .header("Authorization", "Bearer token"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.success").value(false));
    }
}
```

---

## Monitoring & Health Checks

### Add Actuator

**pom.xml:**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

**application.properties:**
```properties
management.endpoints.web.exposure.include=health,info,metrics
management.endpoint.health.show-details=when-authorized
```

---

## Summary

**Immediate Actions (This Week):**
1. Create `ApiResponse` wrapper
2. Add `RequestIdFilter`
3. Fix `PublicController` validation
4. Update `GlobalExceptionHandler`

**Next Week:**
5. Add API versioning
6. Add security headers
7. Fix all validation issues
8. Standardize all responses

**This Month:**
9. Add logging aspect
10. Add health checks
11. Write integration tests
12. Add rate limiting


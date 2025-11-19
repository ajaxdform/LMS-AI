package com.devlcm.lcm.exception;

import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.context.request.WebRequest;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;

import com.devlcm.lcm.dto.ApiResponse;

import java.util.HashMap;
import java.util.Map;

import lombok.extern.slf4j.Slf4j;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleUserNotFoundException(UserNotFoundException ex) {
        String requestId = MDC.get("requestId");
        log.warn("User not found: {} [RequestId: {}]", ex.getMessage(), requestId);

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.error(
                "USER_NOT_FOUND",
                ex.getMessage(),
                requestId
            ));
    }

    @ExceptionHandler(CourseNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleCourseNotFoundException(CourseNotFoundException ex) {
        String requestId = MDC.get("requestId");
        log.warn("Course not found: {} [RequestId: {}]", ex.getMessage(), requestId);

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.error(
                "COURSE_NOT_FOUND",
                ex.getMessage(),
                requestId
            ));
    }

    @ExceptionHandler(ChapterNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleChapterNotFoundException(ChapterNotFoundException ex) {
        String requestId = MDC.get("requestId");
        log.warn("Chapter not found: {} [RequestId: {}]", ex.getMessage(), requestId);

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.error(
                "CHAPTER_NOT_FOUND",
                ex.getMessage(),
                requestId
            ));
    }

    @ExceptionHandler(TopicNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleTopicNotFoundException(TopicNotFoundException ex) {
        String requestId = MDC.get("requestId");
        log.warn("Topic not found: {} [RequestId: {}]", ex.getMessage(), requestId);

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.error(
                "TOPIC_NOT_FOUND",
                ex.getMessage(),
                requestId
            ));
    }

    @ExceptionHandler(QuizNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleQuizNotFoundException(QuizNotFoundException ex) {
        String requestId = MDC.get("requestId");
        log.warn("Quiz not found: {} [RequestId: {}]", ex.getMessage(), requestId);

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.error(
                "QUIZ_NOT_FOUND",
                ex.getMessage(),
                requestId
            ));
    }

    @ExceptionHandler(EnrollmentException.class)
    public ResponseEntity<ApiResponse<Void>> handleEnrollmentException(EnrollmentException ex) {
        String requestId = MDC.get("requestId");
        log.warn("Enrollment error: {} [RequestId: {}]", ex.getMessage(), requestId);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.error(
                "ENROLLMENT_ERROR",
                ex.getMessage(),
                requestId
            ));
    }

    @ExceptionHandler(UnauthorizedAccessException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnauthorizedAccessException(UnauthorizedAccessException ex) {
        String requestId = MDC.get("requestId");
        log.warn("Unauthorized access: {} [RequestId: {}]", ex.getMessage(), requestId);

        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(ApiResponse.error(
                "UNAUTHORIZED_ACCESS",
                ex.getMessage(),
                requestId
            ));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Void>> handleRuntimeException(RuntimeException ex, WebRequest request) {
        String requestId = MDC.get("requestId");
        log.error("Runtime exception: {} [RequestId: {}]", ex.getMessage(), requestId, ex);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.error(
                "RUNTIME_ERROR",
                ex.getMessage(),
                requestId
            ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationException(MethodArgumentNotValidException ex) {
        String requestId = MDC.get("requestId");
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
            errors.put(error.getField(), error.getDefaultMessage())
        );
        log.warn("Validation error: {} [RequestId: {}]", errors, requestId);
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.<Map<String, String>>builder()
                .success(false)
                .errorCode("VALIDATION_ERROR")
                .message("Validation failed")
                .data(errors)
                .requestId(requestId)
                .timestamp(java.time.LocalDateTime.now())
                .build());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception ex, WebRequest request) {
        String requestId = MDC.get("requestId");
        log.error("Unexpected error: {} [RequestId: {}]", ex.getMessage(), requestId, ex);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error(
                "INTERNAL_SERVER_ERROR",
                "An unexpected error occurred. Please try again later.",
                requestId
            ));
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(NoHandlerFoundException ex, WebRequest request) {
        String requestId = MDC.get("requestId");
        String requestURL = ex.getRequestURL();
        log.warn("Resource not found: {} [RequestId: {}]", requestURL, requestId);

        // Check if this looks like a frontend route
        if (requestURL != null && (requestURL.contains("/dashboard") || 
                                    requestURL.contains("/courses") || 
                                    requestURL.contains("/login") || 
                                    requestURL.contains("/signup"))) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(
                    "FRONTEND_ROUTE_ERROR",
                    "This is a frontend route. Please access the application at http://localhost:5173" + requestURL,
                    requestId
                ));
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.error(
                "RESOURCE_NOT_FOUND",
                "API endpoint not found: " + requestURL,
                requestId
            ));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String requestId = MDC.get("requestId");
        log.warn("Invalid parameter type: {} [RequestId: {}]", ex.getName(), requestId);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.error(
                "INVALID_PARAMETER_TYPE",
                "Invalid parameter type: " + ex.getName(),
                requestId
            ));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ApiResponse<Void>> handleNotReadable(HttpMessageNotReadableException ex) {
        String requestId = MDC.get("requestId");
        log.warn("Malformed JSON request: {} [RequestId: {}]", ex.getMessage(), requestId);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.error(
                "MALFORMED_JSON",
                "Malformed JSON request. Please check your request body.",
                requestId
            ));
    }

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ApiResponse<Void>> handleRateLimitExceeded(RateLimitExceededException ex) {
        String requestId = MDC.get("requestId");
        log.warn("Rate limit exceeded: {} [RequestId: {}]", ex.getMessage(), requestId);

        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
            .header("X-RateLimit-Retry-After-Seconds", String.valueOf(ex.getRetryAfterSeconds()))
            .header("Retry-After", String.valueOf(ex.getRetryAfterSeconds()))
            .body(ApiResponse.error(
                "RATE_LIMIT_EXCEEDED",
                ex.getMessage(),
                requestId
            ));
    }
}

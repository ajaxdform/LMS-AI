package com.devlcm.lcm.controller;

import com.devlcm.lcm.annotation.RateLimit;
import com.devlcm.lcm.dto.*;
import com.devlcm.lcm.entity.UserProgress;
import com.devlcm.lcm.entity.UserRole;
import com.devlcm.lcm.service.AdminService;
import com.devlcm.lcm.service.AdminService.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * Admin Controller - Microservice-like independent controller
 * Handles all administrative operations (CRUD for courses, chapters, topics, quizzes, users)
 * 
 * All endpoints require ADMIN role
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Validated
@Slf4j
@RateLimit(limit = 200, duration = 60) // Admins get higher rate limits
public class AdminController {
    
    private final AdminService adminService;
    
    // ==================== DASHBOARD & STATISTICS ====================
    
    /**
     * Get admin dashboard statistics
     */
    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<AdminDashboardStats>> getDashboardStats() {
        log.info("Admin: Fetching dashboard statistics");
        AdminDashboardStats stats = adminService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success(stats, "Dashboard statistics retrieved successfully"));
    }
    
    // ==================== USER MANAGEMENT ====================
    
    /**
     * Get all users with pagination
     */
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<UserDTO>>> getAllUsers(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        log.info("Admin: Fetching all users");
        Page<UserDTO> users = adminService.getAllUsers(pageable);
        return ResponseEntity.ok(ApiResponse.success(users, "Users retrieved successfully"));
    }
    
    /**
     * Get user by ID
     */
    @GetMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<UserDTO>> getUserById(@PathVariable @NotBlank String userId) {
        log.info("Admin: Fetching user with ID: {}", userId);
        UserDTO user = adminService.getUserById(userId);
        return ResponseEntity.ok(ApiResponse.success(user, "User retrieved successfully"));
    }
    
    /**
     * Update user role
     */
    @PutMapping("/users/{userId}/role")
    public ResponseEntity<ApiResponse<UserDTO>> updateUserRole(
            @PathVariable @NotBlank String userId,
            @RequestParam UserRole role) {
        log.info("Admin: Updating user {} role to {}", userId, role);
        UserDTO updated = adminService.updateUserRole(userId, role);
        return ResponseEntity.ok(ApiResponse.success(updated, "User role updated successfully"));
    }
    
    /**
     * Delete user
     */
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable @NotBlank String userId) {
        log.info("Admin: Deleting user with ID: {}", userId);
        adminService.deleteUser(userId);
        return ResponseEntity.ok(ApiResponse.success(null, "User deleted successfully"));
    }
    
    /**
     * Get user statistics
     */
    @GetMapping("/users/stats")
    public ResponseEntity<ApiResponse<AdminUserStats>> getUserStats() {
        log.info("Admin: Fetching user statistics");
        AdminUserStats stats = adminService.getUserStatistics();
        return ResponseEntity.ok(ApiResponse.success(stats, "User statistics retrieved successfully"));
    }
    
    // ==================== COURSE MANAGEMENT ====================
    
    /**
     * Create a new course
     */
    @PostMapping("/courses")
    public ResponseEntity<ApiResponse<CourseDTO>> createCourse(@Valid @RequestBody CourseDTO courseDTO) {
        log.info("Admin: Creating new course");
        CourseDTO created = adminService.createCourse(courseDTO);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(created, "Course created successfully"));
    }
    
    /**
     * Update existing course
     */
    @PutMapping("/courses/{courseId}")
    public ResponseEntity<ApiResponse<CourseDTO>> updateCourse(
            @PathVariable @NotBlank String courseId,
            @Valid @RequestBody CourseDTO courseDTO) {
        log.info("Admin: Updating course with ID: {}", courseId);
        CourseDTO updated = adminService.updateCourse(courseId, courseDTO);
        return ResponseEntity.ok(ApiResponse.success(updated, "Course updated successfully"));
    }
    
    /**
     * Delete course
     */
    @DeleteMapping("/courses/{courseId}")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(@PathVariable @NotBlank String courseId) {
        log.info("Admin: Deleting course with ID: {}", courseId);
        adminService.deleteCourse(courseId);
        return ResponseEntity.ok(ApiResponse.success(null, "Course deleted successfully"));
    }
    
    /**
     * Get course statistics
     */
    @GetMapping("/courses/stats")
    public ResponseEntity<ApiResponse<AdminCourseStats>> getCourseStats() {
        log.info("Admin: Fetching course statistics");
        AdminCourseStats stats = adminService.getCourseStatistics();
        return ResponseEntity.ok(ApiResponse.success(stats, "Course statistics retrieved successfully"));
    }
    
    // ==================== CHAPTER MANAGEMENT ====================
    
    /**
     * Create a new chapter
     */
    @PostMapping("/courses/{courseId}/chapters")
    public ResponseEntity<ApiResponse<ChapterDTO>> createChapter(
            @PathVariable @NotBlank String courseId,
            @Valid @RequestBody ChapterDTO chapterDTO) {
        log.info("Admin: Creating new chapter for course {}", courseId);
        ChapterDTO created = adminService.createChapter(courseId, chapterDTO);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(created, "Chapter created successfully"));
    }
    
    /**
     * Update existing chapter
     */
    @PutMapping("/chapters/{chapterId}")
    public ResponseEntity<ApiResponse<ChapterDTO>> updateChapter(
            @PathVariable @NotBlank String chapterId,
            @Valid @RequestBody ChapterDTO chapterDTO) {
        log.info("Admin: Updating chapter with ID: {}", chapterId);
        ChapterDTO updated = adminService.updateChapter(chapterId, chapterDTO);
        return ResponseEntity.ok(ApiResponse.success(updated, "Chapter updated successfully"));
    }
    
    /**
     * Delete chapter
     */
    @DeleteMapping("/chapters/{chapterId}")
    public ResponseEntity<ApiResponse<Void>> deleteChapter(@PathVariable @NotBlank String chapterId) {
        log.info("Admin: Deleting chapter with ID: {}", chapterId);
        adminService.deleteChapter(chapterId);
        return ResponseEntity.ok(ApiResponse.success(null, "Chapter deleted successfully"));
    }
    
    // ==================== TOPIC MANAGEMENT ====================
    
    /**
     * Create a new topic
     */
    @PostMapping("/chapters/{chapterId}/topics")
    public ResponseEntity<ApiResponse<TopicDTO>> createTopic(
            @PathVariable @NotBlank String chapterId,
            @Valid @RequestBody TopicDTO topicDTO) {
        log.info("Admin: Creating new topic for chapter {}", chapterId);
        TopicDTO created = adminService.createTopic(chapterId, topicDTO);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(created, "Topic created successfully"));
    }
    
    /**
     * Update existing topic
     */
    @PutMapping("/topics/{topicId}")
    public ResponseEntity<ApiResponse<TopicDTO>> updateTopic(
            @PathVariable @NotBlank String topicId,
            @Valid @RequestBody TopicDTO topicDTO) {
        log.info("Admin: Updating topic with ID: {}", topicId);
        TopicDTO updated = adminService.updateTopic(topicId, topicDTO);
        return ResponseEntity.ok(ApiResponse.success(updated, "Topic updated successfully"));
    }
    
    /**
     * Delete topic
     */
    @DeleteMapping("/topics/{topicId}")
    public ResponseEntity<ApiResponse<Void>> deleteTopic(@PathVariable @NotBlank String topicId) {
        log.info("Admin: Deleting topic with ID: {}", topicId);
        adminService.deleteTopic(topicId);
        return ResponseEntity.ok(ApiResponse.success(null, "Topic deleted successfully"));
    }
    
    // ==================== QUIZ MANAGEMENT ====================
    
    /**
     * Create a new quiz for a chapter
     */
    @PostMapping("/chapters/{chapterId}/quizzes")
    public ResponseEntity<ApiResponse<QuizzDTO>> createQuiz(
            @PathVariable @NotBlank String chapterId,
            @Valid @RequestBody QuizzDTO quizzDTO) {
        log.info("Admin: Creating new quiz for chapter {}", chapterId);
        QuizzDTO created = adminService.createQuiz(chapterId, quizzDTO);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(created, "Quiz created successfully"));
    }
    
    /**
     * Update existing quiz
     */
    @PutMapping("/quizzes/{quizId}")
    public ResponseEntity<ApiResponse<QuizzDTO>> updateQuiz(
            @PathVariable @NotBlank String quizId,
            @Valid @RequestBody QuizzDTO quizzDTO) {
        log.info("Admin: Updating quiz with ID: {}", quizId);
        QuizzDTO updated = adminService.updateQuiz(quizId, quizzDTO);
        return ResponseEntity.ok(ApiResponse.success(updated, "Quiz updated successfully"));
    }
    
    /**
     * Delete quiz
     */
    @DeleteMapping("/quizzes/{quizId}")
    public ResponseEntity<ApiResponse<Void>> deleteQuiz(@PathVariable @NotBlank String quizId) {
        log.info("Admin: Deleting quiz with ID: {}", quizId);
        adminService.deleteQuiz(quizId);
        return ResponseEntity.ok(ApiResponse.success(null, "Quiz deleted successfully"));
    }
    
    // ==================== USER PROGRESS MONITORING ====================
    
    /**
     * Get all user progress for monitoring
     */
    @GetMapping("/progress")
    public ResponseEntity<ApiResponse<Page<UserProgress>>> getAllUserProgress(
            @PageableDefault(size = 20) Pageable pageable) {
        log.info("Admin: Fetching all user progress");
        Page<UserProgress> progress = adminService.getAllUserProgress(pageable);
        return ResponseEntity.ok(ApiResponse.success(progress, "User progress retrieved successfully"));
    }
}

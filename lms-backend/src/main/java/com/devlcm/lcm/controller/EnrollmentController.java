package com.devlcm.lcm.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.devlcm.lcm.annotation.RateLimit;
import com.devlcm.lcm.dto.ApiResponse;
import com.devlcm.lcm.dto.CourseDTO;
import com.devlcm.lcm.entity.Course;
import com.devlcm.lcm.mapper.AllMapper;
import com.devlcm.lcm.service.UserService;
import com.devlcm.lcm.util.AuthUtil;

import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/enrollments")
@RequiredArgsConstructor
@Validated
@RateLimit(limit = 50, duration = 60) // 50 requests per minute per user
public class EnrollmentController {

    private final UserService userService;
    private final AllMapper allMapper;
    
    /**
     * Enroll the current user in a course.
     * Uses Firebase UID from authentication context.
     * @param courseId the course ID
     * @return success message
     */
    @PostMapping("/courses/{courseId}/enroll")
    public ResponseEntity<ApiResponse<Void>> enrollInCourse(
            @PathVariable @NotBlank String courseId) {
        String firebaseUid = AuthUtil.getCurrentFirebaseUid();
        userService.enrollInCourse(firebaseUid, courseId);
        return ResponseEntity.ok(ApiResponse.success(null, "User enrolled in course successfully"));
    }

    /**
     * Enroll a user in a course (for admin or specific user operations).
     * @param firebaseUid the Firebase UID
     * @param courseId the course ID
     * @return success message
     */
    @PostMapping("/{firebaseUid}/courses/{courseId}/enroll")
    public ResponseEntity<ApiResponse<Void>> enrollUserInCourse(
            @PathVariable @NotBlank String firebaseUid, 
            @PathVariable @NotBlank String courseId) {
        AuthUtil.verifyUserAccess(firebaseUid);
        userService.enrollInCourse(firebaseUid, courseId);
        return ResponseEntity.ok(ApiResponse.success(null, "User enrolled in course successfully"));
    }

    /**
     * Unenroll the current user from a course.
     * Uses Firebase UID from authentication context.
     * @param courseId the course ID
     * @return success message
     */
    @DeleteMapping("/courses/{courseId}/enroll")
    public ResponseEntity<ApiResponse<Void>> unenrollFromCourse(
            @PathVariable @NotBlank String courseId) {
        String firebaseUid = AuthUtil.getCurrentFirebaseUid();
        userService.unenrollCourse(firebaseUid, courseId);
        return ResponseEntity.ok(ApiResponse.success(null, "User unenrolled from course successfully"));
    }

    /**
     * Unenroll a user from a course (for admin or specific user operations).
     * @param firebaseUid the Firebase UID
     * @param courseId the course ID
     * @return success message
     */
    @DeleteMapping("/{firebaseUid}/courses/{courseId}/enroll")
    public ResponseEntity<ApiResponse<Void>> unenrollUserFromCourse(
            @PathVariable @NotBlank String firebaseUid, 
            @PathVariable @NotBlank String courseId) {
        AuthUtil.verifyUserAccess(firebaseUid);
        userService.unenrollCourse(firebaseUid, courseId);
        return ResponseEntity.ok(ApiResponse.success(null, "User unenrolled from course successfully"));
    }

    /**
     * Get all courses the current user is enrolled in (no pagination).
     * Uses Firebase UID from authentication context.
     * @return list of enrolled courses
     */
    @GetMapping("/courses")
    public ResponseEntity<ApiResponse<List<CourseDTO>>> getMyCourses() {
        String firebaseUid = AuthUtil.getCurrentFirebaseUid();
        List<Course> courses = userService.getEnrolledCourses(firebaseUid);
        List<CourseDTO> courseDTOs = courses.stream()
            .map(allMapper::toCourseDTO)
            .toList();
        return ResponseEntity.ok(ApiResponse.success(courseDTOs));
    }

    /**
     * Get all courses the current user is enrolled in with pagination.
     * Uses Firebase UID from authentication context.
     * @param pageable pagination parameters
     * @return page of enrolled courses
     */
    @GetMapping("/courses/paginated")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<CourseDTO>>> getMyCoursesPaginated(
            @org.springframework.data.web.PageableDefault(size = 10, sort = "title") org.springframework.data.domain.Pageable pageable) {
        String firebaseUid = AuthUtil.getCurrentFirebaseUid();
        org.springframework.data.domain.Page<CourseDTO> courses = userService.getEnrolledCourses(firebaseUid, pageable)
            .map(allMapper::toCourseDTO);
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    /**
     * Get all courses a user is enrolled in (for admin or specific user operations, no pagination).
     * @param firebaseUid the Firebase UID
     * @return list of enrolled courses
     */
    @GetMapping("/{firebaseUid}/courses")
    public ResponseEntity<ApiResponse<List<CourseDTO>>> getUserCourses(
            @PathVariable @NotBlank String firebaseUid) {
        AuthUtil.verifyUserAccess(firebaseUid);
        List<Course> courses = userService.getEnrolledCourses(firebaseUid);
        List<CourseDTO> courseDTOs = courses.stream()
            .map(allMapper::toCourseDTO)
            .toList();
        return ResponseEntity.ok(ApiResponse.success(courseDTOs));
    }

    /**
     * Get all courses a user is enrolled in with pagination (for admin or specific user operations).
     * @param firebaseUid the Firebase UID
     * @param pageable pagination parameters
     * @return page of enrolled courses
     */
    @GetMapping("/{firebaseUid}/courses/paginated")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<CourseDTO>>> getUserCoursesPaginated(
            @PathVariable @NotBlank String firebaseUid,
            @org.springframework.data.web.PageableDefault(size = 10, sort = "title") org.springframework.data.domain.Pageable pageable) {
        AuthUtil.verifyUserAccess(firebaseUid);
        org.springframework.data.domain.Page<CourseDTO> courses = userService.getEnrolledCourses(firebaseUid, pageable)
            .map(allMapper::toCourseDTO);
        return ResponseEntity.ok(ApiResponse.success(courses));
    }
}

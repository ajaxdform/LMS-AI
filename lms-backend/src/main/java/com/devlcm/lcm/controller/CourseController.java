package com.devlcm.lcm.controller;

/**
 * REST controller for managing courses in the LMS.
 */

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.devlcm.lcm.annotation.RateLimit;
import com.devlcm.lcm.dto.ApiResponse;
import com.devlcm.lcm.dto.CourseDTO;
import com.devlcm.lcm.entity.Course;
import com.devlcm.lcm.mapper.AllMapper;
import com.devlcm.lcm.service.CourseService;

import org.springframework.validation.annotation.Validated;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
@Validated
@RateLimit(limit = 100, duration = 60) // 100 requests per minute per user
public class CourseController {

    private final CourseService courseService;
    private final com.devlcm.lcm.service.ChapterService chapterService;
    private final com.devlcm.lcm.service.ValidationService validationService;
    private final AllMapper allMapper;

    /**
     * Get all courses with pagination.
     * 
     * @param pageable pagination parameters
     * @return page of courses
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<CourseDTO>>> getAllCourses(
            @PageableDefault(size = 20, sort = "title") Pageable pageable) {
        Page<CourseDTO> courses = courseService.getAllCourses(pageable)
                .map(allMapper::toCourseDTO);
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    /**
     * Get all courses (backward compatibility - no pagination).
     * 
     * @return list of courses
     */
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<CourseDTO>>> getAllCoursesList() {
        List<CourseDTO> courses = courseService.getAllCourses()
                .stream()
                .map(allMapper::toCourseDTO)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    /**
     * Get a course by its ID.
     * 
     * @param id the course ID
     * @return the course or 404 if not found
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseDTO>> getCourseById(
            @PathVariable @jakarta.validation.constraints.NotBlank String id) {
        CourseDTO course = courseService.getCourseById(id)
                .map(allMapper::toCourseDTO)
                .orElseThrow(
                        () -> new com.devlcm.lcm.exception.CourseNotFoundException("Course not found with ID: " + id));
        return ResponseEntity.ok(ApiResponse.success(course));
    }

    /**
     * Get courses by subject (no pagination).
     * 
     * @param subject the subject name
     * @return list of courses for the subject
     */
    @GetMapping("/subject/{subject}")
    public ResponseEntity<ApiResponse<List<CourseDTO>>> getCoursesBySubject(
            @PathVariable @jakarta.validation.constraints.NotBlank String subject) {
        List<CourseDTO> courses = courseService.getCourseBySubject(subject)
                .stream()
                .map(allMapper::toCourseDTO)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    /**
     * Get courses by subject with pagination.
     * 
     * @param subject  the subject name
     * @param pageable pagination parameters
     * @return page of courses for the subject
     */
    @GetMapping("/subject/{subject}/paginated")
    public ResponseEntity<ApiResponse<Page<CourseDTO>>> getCoursesBySubjectPaginated(
            @PathVariable @jakarta.validation.constraints.NotBlank String subject,
            @PageableDefault(size = 20, sort = "title") Pageable pageable) {
        Page<CourseDTO> courses = courseService.getCourseBySubject(subject, pageable)
                .map(allMapper::toCourseDTO);
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    /**
     * Search courses by keyword (no pagination).
     * 
     * @param keyword the search keyword
     * @return list of matching courses
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<CourseDTO>>> searchCourses(
            @RequestParam("q") @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(min = 2, max = 100) String keyword) {
        List<CourseDTO> courses = courseService.searchCourses(keyword)
                .stream()
                .map(allMapper::toCourseDTO)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    /**
     * Search courses by keyword with pagination.
     * 
     * @param keyword  the search keyword
     * @param pageable pagination parameters
     * @return page of matching courses
     */
    @GetMapping("/search/paginated")
    public ResponseEntity<ApiResponse<Page<CourseDTO>>> searchCoursesPaginated(
            @RequestParam("q") @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(min = 2, max = 100) String keyword,
            @PageableDefault(size = 20, sort = "title") Pageable pageable) {
        Page<CourseDTO> courses = courseService.searchCourses(keyword, pageable)
                .map(allMapper::toCourseDTO);
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    /**
     * Create a new course.
     * 
     * @param courseDTO the course to create
     * @return the created course
     */
    @PostMapping
    public ResponseEntity<ApiResponse<CourseDTO>> createCourse(@Valid @RequestBody CourseDTO courseDTO) {
        // Validate and sanitize input
        validationService.validateCourseInput(courseDTO.getTitle(), courseDTO.getDescription());
        
        Course course = courseService.createCourse(allMapper.toCourseEntity(courseDTO));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        allMapper.toCourseDTO(course),
                        "Course created successfully"));
    }

    /**
     * Update an existing course.
     * 
     * @param id        the course ID
     * @param courseDTO the updated course data
     * @return the updated course
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseDTO>> updateCourse(
            @PathVariable @NotBlank String id,
            @Valid @RequestBody CourseDTO courseDTO) {
        // Validate and sanitize input
        validationService.validateCourseInput(courseDTO.getTitle(), courseDTO.getDescription());
        
        Course updatedCourse = courseService.updateCourse(id, allMapper.toCourseEntity(courseDTO));
        return ResponseEntity.ok(ApiResponse.success(
                allMapper.toCourseDTO(updatedCourse),
                "Course updated successfully"));
    }

    /**
     * Delete a course by ID.
     * 
     * @param id the course ID
     * @return success message
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(@PathVariable @NotBlank String id) {
        courseService.deleteCourse(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Course deleted successfully"));
    }

    /**
     * Get all chapters for a course.
     * 
     * @param courseId the course ID
     * @return list of chapters
     */
    @GetMapping("/{courseId}/chapters")
    public ResponseEntity<ApiResponse<List<com.devlcm.lcm.dto.ChapterDTO>>> getChaptersForCourse(
            @PathVariable @NotBlank String courseId) {
        List<com.devlcm.lcm.entity.Chapter> chapters = chapterService.getChaptersForCourse(courseId);
        List<com.devlcm.lcm.dto.ChapterDTO> chapterDTOs = chapters.stream()
                .map(allMapper::toChapterDTO)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(chapterDTOs));
    }
}

package com.devlcm.lcm.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.devlcm.lcm.dto.ApiResponse;
import com.devlcm.lcm.entity.UserProgress;
import com.devlcm.lcm.repository.CourseRepository;
import com.devlcm.lcm.service.UserProgressService;

import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/user-progress")
@RequiredArgsConstructor
@Validated
public class UserProgressController {
    
    private final UserProgressService userProgressService;
    private final CourseRepository courseRepository;

    @PostMapping("/chapter/completed")
    public ResponseEntity<ApiResponse<UserProgress>> markChapterAsCompleted(
            @RequestParam @NotBlank String userId,
            @RequestParam @NotBlank String courseId,
            @RequestParam @NotBlank String chapterId) {

        UserProgress updatedProgress = userProgressService.markedChapterCompleted(userId, courseId, chapterId);
        return ResponseEntity.ok(ApiResponse.success(updatedProgress, "Chapter marked as completed"));
    }

    @PostMapping("/quizz/record")
    public ResponseEntity<ApiResponse<UserProgress>> recordQuizzScore(
            @RequestParam @NotBlank String userId,
            @RequestParam @NotBlank String courseId,
            @RequestParam @NotBlank String quizzId,
            @RequestParam int score) {

        UserProgress updated = userProgressService.recoredQuizzScore(userId, courseId, quizzId, score);
        return ResponseEntity.ok(ApiResponse.success(updated, "Quiz score recorded"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<UserProgress>> getUserProgress(
            @RequestParam @NotBlank String userId,
            @RequestParam @NotBlank String courseId) {

        UserProgress progress = userProgressService.getUserProgress(userId, courseId)
            .orElseGet(() -> {
                // Return empty progress if not found (don't throw error)
                UserProgress emptyProgress = new UserProgress();
                emptyProgress.setUserId(userId);
                emptyProgress.setCourseId(courseId);
                return emptyProgress;
            });
        return ResponseEntity.ok(ApiResponse.success(progress));
    }

    @GetMapping("/all/{userId}")
    public ResponseEntity<ApiResponse<List<UserProgress>>> getAllProgressForUser(
            @PathVariable @NotBlank String userId) {
        List<UserProgress> progressList = userProgressService.getAllProgressForUser(userId);
        return ResponseEntity.ok(ApiResponse.success(progressList));
    }

    @GetMapping("/all/{userId}/paginated")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<UserProgress>>> getAllProgressForUserPaginated(
            @PathVariable @NotBlank String userId,
            @org.springframework.data.web.PageableDefault(size = 10, sort = "lastUpdated") org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<UserProgress> progressPage = userProgressService.getAllProgressForUser(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(progressPage));
    }

    @GetMapping("/percentage/{userId}/{courseId}")
    public ResponseEntity<ApiResponse<Double>> getCourseProgressPercentage(
            @PathVariable @NotBlank String userId,
            @PathVariable @NotBlank String courseId) {

        int totalChapters = courseRepository.findById(courseId)
                .map(course -> course.getChapterIds() != null ? course.getChapterIds().size() : 0)
                .orElse(0);

        double percentage = userProgressService.getCourseProgressPercentage(userId, courseId, totalChapters);
        return ResponseEntity.ok(ApiResponse.success(percentage));
    }

}

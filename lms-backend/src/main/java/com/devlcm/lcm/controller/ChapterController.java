package com.devlcm.lcm.controller;

import com.devlcm.lcm.dto.ApiResponse;
import com.devlcm.lcm.dto.ChapterDTO;
import com.devlcm.lcm.entity.Chapter;
import com.devlcm.lcm.mapper.AllMapper;
import com.devlcm.lcm.service.ChapterService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/v1/chapters")
@RequiredArgsConstructor
@Validated
public class ChapterController {

    private final ChapterService chapterService;
    private final com.devlcm.lcm.service.TopicService topicService;
    private final com.devlcm.lcm.service.QuizzService quizzService;
    private final AllMapper allMapper;

    @PostMapping("/{courseId}")
    public ResponseEntity<ApiResponse<ChapterDTO>> createChapter(
            @PathVariable @NotBlank String courseId, 
            @Valid @RequestBody ChapterDTO chapterDTO) {
        Chapter createdChapter = chapterService.createChapterForCourse(courseId, allMapper.toChapterEntity(chapterDTO));
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(
                allMapper.toChapterDTO(createdChapter),
                "Chapter created successfully"
            ));
    }

    /**
     * Get all chapters for a course by courseId (no pagination).
     * @param courseId the course ID
     * @return list of chapters
     */
    @GetMapping("/{courseId}/chapters")
    public ResponseEntity<ApiResponse<List<ChapterDTO>>> getChaptersForCourse(
            @PathVariable @NotBlank String courseId) {
        List<Chapter> chapters = chapterService.getChaptersForCourse(courseId);
        List<ChapterDTO> chapterDTOs = chapters.stream()
            .map(allMapper::toChapterDTO)
            .toList();
        return ResponseEntity.ok(ApiResponse.success(chapterDTOs));
    }

    /**
     * Get all chapters for a course with pagination.
     * @param courseId the course ID
     * @param pageable pagination parameters
     * @return page of chapters
     */
    @GetMapping("/{courseId}/chapters/paginated")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<ChapterDTO>>> getChaptersForCoursePaginated(
            @PathVariable @NotBlank String courseId,
            @org.springframework.data.web.PageableDefault(size = 10, sort = "id") org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<ChapterDTO> chapters = chapterService.getChaptersForCourse(courseId, pageable)
            .map(allMapper::toChapterDTO);
        return ResponseEntity.ok(ApiResponse.success(chapters));
    }

    @PutMapping("/{id}/chapters")
    public ResponseEntity<ApiResponse<ChapterDTO>> updateChapter(
            @PathVariable @NotBlank String id, 
            @Valid @RequestBody ChapterDTO updatedChapterDTO) {
        Chapter updatedChapter = allMapper.toChapterEntity(updatedChapterDTO);
        return ResponseEntity.ok(ApiResponse.success(
            allMapper.toChapterDTO(chapterService.updateChapter(id, updatedChapter)),
            "Chapter updated successfully"
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteChapter(@PathVariable @NotBlank String id) {
        chapterService.deleteChapter(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Chapter deleted successfully"));
    }

    /**
     * Get a single chapter by ID.
     * @param id the chapter ID
     * @return the chapter
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ChapterDTO>> getChapterById(
            @PathVariable @NotBlank String id) {
        Chapter chapter = chapterService.getChapterById(id)
            .orElseThrow(() -> new com.devlcm.lcm.exception.ChapterNotFoundException("Chapter not found with ID: " + id));
        return ResponseEntity.ok(ApiResponse.success(allMapper.toChapterDTO(chapter)));
    }

    /**
     * Get all topics for a chapter.
     * @param chapterId the chapter ID
     * @return list of topics
     */
    @GetMapping("/{chapterId}/topics")
    public ResponseEntity<ApiResponse<List<com.devlcm.lcm.dto.TopicDTO>>> getTopicsForChapter(
            @PathVariable @NotBlank String chapterId) {
        List<com.devlcm.lcm.entity.Topic> topics = topicService.getTopicsForChapter(chapterId);
        List<com.devlcm.lcm.dto.TopicDTO> topicDTOs = topics.stream()
            .map(allMapper::toTopicDTO)
            .toList();
        return ResponseEntity.ok(ApiResponse.success(topicDTOs));
    }

    /**
     * Get quiz for a chapter.
     * @param chapterId the chapter ID
     * @return quiz or null if not found
     */
    @GetMapping("/{chapterId}/quizzes")
    public ResponseEntity<ApiResponse<com.devlcm.lcm.dto.QuizzDTO>> getQuizForChapter(
            @PathVariable @NotBlank String chapterId) {
        com.devlcm.lcm.dto.QuizzDTO quiz = quizzService.getQuizzByChapterId(chapterId)
            .map(allMapper::toQuizzDTO)
            .orElse(null);
        return ResponseEntity.ok(ApiResponse.success(quiz));
    }

}

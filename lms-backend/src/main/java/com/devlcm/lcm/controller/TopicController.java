package com.devlcm.lcm.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.devlcm.lcm.dto.ApiResponse;
import com.devlcm.lcm.dto.TopicDTO;
import com.devlcm.lcm.dto.TopicPreviewDTO;
import com.devlcm.lcm.entity.Topic;
import com.devlcm.lcm.mapper.AllMapper;
import com.devlcm.lcm.service.TopicService;

import org.springframework.validation.annotation.Validated;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/topics")
@RequiredArgsConstructor
@Validated
public class TopicController {
    private final TopicService topicService;
    private final AllMapper allMapper;

    @PostMapping("/{chapterId}/topics")
    public ResponseEntity<ApiResponse<TopicDTO>> createTopic(
            @PathVariable @NotBlank String chapterId, 
            @Valid @RequestBody TopicDTO topicDTO) {
        Topic savedTopic = topicService.createTopicForChapter(chapterId, allMapper.toTopicEntity(topicDTO));
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(
                allMapper.toTopicDTO(savedTopic),
                "Topic created successfully"
            ));
    }

    /**
     * Get all topics for a chapter by chapterId (no pagination).
     * Returns preview (without content) for unauthenticated users.
     * @param chapterId the chapter ID
     * @return list of topics (full or preview based on authentication)
     */
    @GetMapping("/{chapterId}/topics")
    public ResponseEntity<ApiResponse<?>> getTopicsForChapter(
            @PathVariable @NotBlank String chapterId) {
        List<Topic> topics = topicService.getTopicsForChapter(chapterId);
        
        // Check if user is authenticated
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAuthenticated = auth != null && auth.isAuthenticated() 
            && !"anonymousUser".equals(auth.getPrincipal());
        
        if (isAuthenticated) {
            // Return full content for authenticated users
            List<TopicDTO> topicDTOs = topics.stream()
                .map(allMapper::toTopicDTO)
                .toList();
            return ResponseEntity.ok(ApiResponse.success(topicDTOs));
        } else {
            // Return preview (no content) for unauthenticated users
            List<TopicPreviewDTO> previewDTOs = topics.stream()
                .map(allMapper::toTopicDTO)
                .map(TopicPreviewDTO::new)
                .toList();
            return ResponseEntity.ok(ApiResponse.success(previewDTOs));
        }
    }

    /**
     * Get all topics for a chapter with pagination.
     * Returns preview (without content) for unauthenticated users.
     * @param chapterId the chapter ID
     * @param pageable pagination parameters
     * @return page of topics (full or preview based on authentication)
     */
    @GetMapping("/{chapterId}/topics/paginated")
    public ResponseEntity<ApiResponse<?>> getTopicsForChapterPaginated(
            @PathVariable @NotBlank String chapterId,
            @org.springframework.data.web.PageableDefault(size = 10, sort = "id") org.springframework.data.domain.Pageable pageable) {
        
        // Check if user is authenticated
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAuthenticated = auth != null && auth.isAuthenticated() 
            && !"anonymousUser".equals(auth.getPrincipal());
        
        if (isAuthenticated) {
            // Return full content for authenticated users
            org.springframework.data.domain.Page<TopicDTO> topics = topicService.getTopicsForChapter(chapterId, pageable)
                .map(allMapper::toTopicDTO);
            return ResponseEntity.ok(ApiResponse.success(topics));
        } else {
            // Return preview (no content) for unauthenticated users
            org.springframework.data.domain.Page<TopicPreviewDTO> topics = topicService.getTopicsForChapter(chapterId, pageable)
                .map(allMapper::toTopicDTO)
                .map(TopicPreviewDTO::new);
            return ResponseEntity.ok(ApiResponse.success(topics));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> getTopicById(
            @PathVariable @NotBlank String id) {
        TopicDTO topic = topicService.getTopicById(id)
            .map(allMapper::toTopicDTO)
            .orElseThrow(() -> new com.devlcm.lcm.exception.TopicNotFoundException("Topic not found with ID: " + id));
        
        // Check if user is authenticated
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAuthenticated = auth != null && auth.isAuthenticated() 
            && !"anonymousUser".equals(auth.getPrincipal());
        
        if (isAuthenticated) {
            // Return full content for authenticated users
            return ResponseEntity.ok(ApiResponse.success(topic));
        } else {
            // Return preview (no content) for unauthenticated users
            return ResponseEntity.ok(ApiResponse.success(new TopicPreviewDTO(topic)));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TopicDTO>> updateTopic(
            @PathVariable @NotBlank String id, 
            @Valid @RequestBody TopicDTO updatedTopicDTO) {
        Topic updatedTopic = allMapper.toTopicEntity(updatedTopicDTO);
        return ResponseEntity.ok(ApiResponse.success(
            allMapper.toTopicDTO(topicService.updateTopic(id, updatedTopic)),
            "Topic updated successfully"
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTopic(@PathVariable @NotBlank String id) {
        topicService.deleteTopic(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Topic deleted successfully"));
    }

    // Note: Quizzes are now at chapter level, not topic level
    // Use GET /chapters/{chapterId}/quizzes instead
}

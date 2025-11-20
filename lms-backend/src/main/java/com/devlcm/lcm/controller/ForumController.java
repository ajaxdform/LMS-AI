package com.devlcm.lcm.controller;

import com.devlcm.lcm.dto.*;
import com.devlcm.lcm.entity.ForumAttachment;
import com.devlcm.lcm.entity.ForumCategory;
import com.devlcm.lcm.entity.UserRole;
import com.devlcm.lcm.service.FileStorageService;
import com.devlcm.lcm.service.ForumService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.List;

/**
 * Forum Controller - REST API endpoints for forum discussions
 * Base URL: /api/v1/forum
 */
@RestController
@RequestMapping("/api/v1/forum")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Forum", description = "Forum discussion APIs")
public class ForumController {
    
    private final ForumService forumService;
    private final FileStorageService fileStorageService;
    
    // ==================== FILE UPLOAD ENDPOINTS ====================
    
    /**
     * Upload forum attachments
     */
    @PostMapping("/upload")
    @Operation(summary = "Upload forum post attachments")
    public ResponseEntity<ApiResponse<List<ForumAttachment>>> uploadFiles(
            @RequestParam("files") MultipartFile[] files,
            Authentication authentication) {
        log.info("Uploading {} files for forum post", files.length);
        List<ForumAttachment> attachments = fileStorageService.uploadFiles(files);
        return ResponseEntity.ok(ApiResponse.success(attachments, "Files uploaded successfully"));
    }
    
    /**
     * Download/view forum attachment
     */
    @GetMapping("/files/{filename}")
    @Operation(summary = "Get forum attachment file")
    public ResponseEntity<Resource> getFile(@PathVariable String filename) {
        try {
            Path filePath = fileStorageService.getFile(filename);
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                           "attachment; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error retrieving file: {}", filename, e);
            return ResponseEntity.notFound().build();
        }
    }
    
    // ==================== FORUM POST ENDPOINTS ====================
    
    /**
     * Create a new forum post
     */
    @PostMapping("/posts")
    @Operation(summary = "Create a new forum post")
    public ResponseEntity<ApiResponse<ForumPostDTO>> createPost(
            @Valid @RequestBody CreateForumPostRequest request,
            Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        ForumPostDTO post = forumService.createPost(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(post, "Post created successfully"));
    }
    
    /**
     * Get all posts with pagination and sorting
     */
    @GetMapping("/posts")
    @Operation(summary = "Get all forum posts")
    public ResponseEntity<ApiResponse<Page<ForumPostDTO>>> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "lastActivityAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction,
            Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        Page<ForumPostDTO> posts = forumService.getAllPosts(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(posts, "Posts retrieved successfully"));
    }
    
    /**
     * Get post by ID
     */
    @GetMapping("/posts/{postId}")
    @Operation(summary = "Get forum post by ID")
    public ResponseEntity<ApiResponse<ForumPostDTO>> getPostById(
            @PathVariable String postId,
            Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        ForumPostDTO post = forumService.getPostById(postId, userId);
        return ResponseEntity.ok(ApiResponse.success(post, "Post retrieved successfully"));
    }
    
    /**
     * Get posts by course
     */
    @GetMapping("/posts/course/{courseId}")
    @Operation(summary = "Get forum posts for a course")
    public ResponseEntity<ApiResponse<Page<ForumPostDTO>>> getPostsByCourse(
            @PathVariable String courseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "lastActivityAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction,
            Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        Page<ForumPostDTO> posts = forumService.getPostsByCourse(courseId, userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(posts, "Course posts retrieved successfully"));
    }
    
    /**
     * Get posts by chapter
     */
    @GetMapping("/posts/chapter/{chapterId}")
    @Operation(summary = "Get forum posts for a chapter")
    public ResponseEntity<ApiResponse<Page<ForumPostDTO>>> getPostsByChapter(
            @PathVariable String chapterId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "lastActivityAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction,
            Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        Page<ForumPostDTO> posts = forumService.getPostsByChapter(chapterId, userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(posts, "Chapter posts retrieved successfully"));
    }
    
    /**
     * Get posts by category
     */
    @GetMapping("/posts/category/{category}")
    @Operation(summary = "Get forum posts by category")
    public ResponseEntity<ApiResponse<Page<ForumPostDTO>>> getPostsByCategory(
            @PathVariable ForumCategory category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "lastActivityAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction,
            Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        Page<ForumPostDTO> posts = forumService.getPostsByCategory(category, userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(posts, "Category posts retrieved successfully"));
    }
    
    /**
     * Search posts by keyword
     */
    @GetMapping("/posts/search")
    @Operation(summary = "Search forum posts")
    public ResponseEntity<ApiResponse<Page<ForumPostDTO>>> searchPosts(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "lastActivityAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction,
            Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        Page<ForumPostDTO> posts = forumService.searchPosts(keyword, userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(posts, "Search completed successfully"));
    }
    
    /**
     * Update a forum post
     */
    @PutMapping("/posts/{postId}")
    @Operation(summary = "Update a forum post")
    public ResponseEntity<ApiResponse<ForumPostDTO>> updatePost(
            @PathVariable String postId,
            @Valid @RequestBody CreateForumPostRequest request,
            Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        boolean isAdmin = authentication.getAuthorities().stream()
            .anyMatch(auth -> auth.getAuthority().equals("ROLE_" + UserRole.ADMIN));
        
        ForumPostDTO post = forumService.updatePost(postId, request, userId, isAdmin);
        return ResponseEntity.ok(ApiResponse.success(post, "Post updated successfully"));
    }
    
    /**
     * Delete a forum post
     */
    @DeleteMapping("/posts/{postId}")
    @Operation(summary = "Delete a forum post")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @PathVariable String postId,
            Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        boolean isAdmin = authentication.getAuthorities().stream()
            .anyMatch(auth -> auth.getAuthority().equals("ROLE_" + UserRole.ADMIN));
        
        forumService.deletePost(postId, userId, isAdmin);
        return ResponseEntity.ok(ApiResponse.success(null, "Post deleted successfully"));
    }
    
    /**
     * Vote on a post
     */
    @PostMapping("/posts/{postId}/vote")
    @Operation(summary = "Vote on a forum post")
    public ResponseEntity<ApiResponse<ForumPostDTO>> voteOnPost(
            @PathVariable String postId,
            @Valid @RequestBody VoteRequest voteRequest,
            Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        ForumPostDTO post = forumService.voteOnPost(postId, voteRequest, userId);
        return ResponseEntity.ok(ApiResponse.success(post, "Vote recorded successfully"));
    }
    
    // ==================== FORUM REPLY ENDPOINTS ====================
    
    /**
     * Create a reply to a post
     */
    @PostMapping("/replies")
    @Operation(summary = "Create a reply to a forum post")
    public ResponseEntity<ApiResponse<ForumReplyDTO>> createReply(
            @Valid @RequestBody CreateForumReplyRequest request,
            Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        ForumReplyDTO reply = forumService.createReply(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(reply, "Reply created successfully"));
    }
    
    /**
     * Get all replies for a post
     */
    @GetMapping("/replies/post/{postId}")
    @Operation(summary = "Get all replies for a post")
    public ResponseEntity<ApiResponse<Page<ForumReplyDTO>>> getRepliesForPost(
            @PathVariable String postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "ASC") Sort.Direction direction,
            Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        Page<ForumReplyDTO> replies = forumService.getRepliesForPost(postId, userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(replies, "Replies retrieved successfully"));
    }
    
    /**
     * Update a reply
     */
    @PutMapping("/replies/{replyId}")
    @Operation(summary = "Update a forum reply")
    public ResponseEntity<ApiResponse<ForumReplyDTO>> updateReply(
            @PathVariable String replyId,
            @RequestBody String content,
            Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        boolean isAdmin = authentication.getAuthorities().stream()
            .anyMatch(auth -> auth.getAuthority().equals("ROLE_" + UserRole.ADMIN));
        
        ForumReplyDTO reply = forumService.updateReply(replyId, content, userId, isAdmin);
        return ResponseEntity.ok(ApiResponse.success(reply, "Reply updated successfully"));
    }
    
    /**
     * Delete a reply
     */
    @DeleteMapping("/replies/{replyId}")
    @Operation(summary = "Delete a forum reply")
    public ResponseEntity<ApiResponse<Void>> deleteReply(
            @PathVariable String replyId,
            Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        boolean isAdmin = authentication.getAuthorities().stream()
            .anyMatch(auth -> auth.getAuthority().equals("ROLE_" + UserRole.ADMIN));
        
        forumService.deleteReply(replyId, userId, isAdmin);
        return ResponseEntity.ok(ApiResponse.success(null, "Reply deleted successfully"));
    }
    
    /**
     * Vote on a reply
     */
    @PostMapping("/replies/{replyId}/vote")
    @Operation(summary = "Vote on a forum reply")
    public ResponseEntity<ApiResponse<ForumReplyDTO>> voteOnReply(
            @PathVariable String replyId,
            @Valid @RequestBody VoteRequest voteRequest,
            Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        ForumReplyDTO reply = forumService.voteOnReply(replyId, voteRequest, userId);
        return ResponseEntity.ok(ApiResponse.success(reply, "Vote recorded successfully"));
    }
    
    /**
     * Mark reply as accepted answer
     */
    @PostMapping("/replies/{replyId}/accept")
    @Operation(summary = "Mark reply as accepted answer")
    public ResponseEntity<ApiResponse<ForumReplyDTO>> markAsAcceptedAnswer(
            @PathVariable String replyId,
            Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        boolean isAdmin = authentication.getAuthorities().stream()
            .anyMatch(auth -> auth.getAuthority().equals("ROLE_" + UserRole.ADMIN));
        
        ForumReplyDTO reply = forumService.markAsAcceptedAnswer(replyId, userId, isAdmin);
        return ResponseEntity.ok(ApiResponse.success(reply, "Reply marked as accepted answer"));
    }
    
    // ==================== MODERATION ENDPOINTS (ADMIN) ====================
    
    /**
     * Pin/Unpin a post (admin only)
     */
    @PostMapping("/posts/{postId}/pin")
    @Operation(summary = "Pin/Unpin a forum post (admin only)")
    public ResponseEntity<ApiResponse<ForumPostDTO>> togglePinPost(
            @PathVariable String postId,
            Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        ForumPostDTO post = forumService.togglePinPost(postId, userId);
        return ResponseEntity.ok(ApiResponse.success(post, "Post pin status toggled successfully"));
    }
    
    /**
     * Lock/Unlock a post (admin only)
     */
    @PostMapping("/posts/{postId}/lock")
    @Operation(summary = "Lock/Unlock a forum post (admin only)")
    public ResponseEntity<ApiResponse<ForumPostDTO>> toggleLockPost(
            @PathVariable String postId,
            Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        ForumPostDTO post = forumService.toggleLockPost(postId, userId);
        return ResponseEntity.ok(ApiResponse.success(post, "Post lock status toggled successfully"));
    }
    
    // ==================== USER STATS ====================
    
    /**
     * Get user forum statistics
     */
    @GetMapping("/stats/{userId}")
    @Operation(summary = "Get user forum statistics")
    public ResponseEntity<ApiResponse<UserForumStatsDTO>> getUserForumStats(
            @PathVariable String userId) {
        UserForumStatsDTO stats = forumService.getUserForumStats(userId);
        return ResponseEntity.ok(ApiResponse.success(stats, "User stats retrieved successfully"));
    }
}

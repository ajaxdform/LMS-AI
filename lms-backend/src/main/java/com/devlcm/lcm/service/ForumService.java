package com.devlcm.lcm.service;

import com.devlcm.lcm.dto.*;
import com.devlcm.lcm.entity.*;
import com.devlcm.lcm.exception.CourseNotFoundException;
import com.devlcm.lcm.exception.UserNotFoundException;
import com.devlcm.lcm.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Forum Service - Handles all forum operations
 * Supports discussions at course, chapter, and general levels
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ForumService {
    
    private final ForumPostRepository forumPostRepository;
    private final ForumReplyRepository forumReplyRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final ChapterRepository chapterRepository;
    
    // ==================== HELPER METHODS ====================
    
    /**
     * Get MongoDB user ID from Firebase UID
     */
    private String getUserIdFromFirebaseUid(String firebaseUid) {
        return userRepository.findByFirebaseUid(firebaseUid)
            .map(User::getId)
            .orElseThrow(() -> new UserNotFoundException("User not found with Firebase UID: " + firebaseUid));
    }
    
    // ==================== FORUM POST OPERATIONS ====================
    
    /**
     * Create a new forum post
     */
    @Transactional
    public ForumPostDTO createPost(CreateForumPostRequest request, String firebaseUid) {
        log.info("Creating forum post by user {}: {}", firebaseUid, request.getTitle());
        
        // Get user info by Firebase UID
        User user = userRepository.findByFirebaseUid(firebaseUid)
            .orElseThrow(() -> new UserNotFoundException("User not found with Firebase UID: " + firebaseUid));
        
        // Validate course and chapter if provided
        if (request.getCourseId() != null && !courseRepository.existsById(request.getCourseId())) {
            throw new CourseNotFoundException("Course not found with ID: " + request.getCourseId());
        }
        if (request.getChapterId() != null && !chapterRepository.existsById(request.getChapterId())) {
            throw new RuntimeException("Chapter not found with ID: " + request.getChapterId());
        }
        
        // Create post
        ForumPost post = new ForumPost();
        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setAuthorId(user.getId());  // Use MongoDB user ID
        post.setAuthorUsername(user.getUsername());
        post.setCourseId(request.getCourseId());
        post.setChapterId(request.getChapterId());
        post.setCategory(request.getCategory());
        post.setTags(request.getTags());
        post.setAttachments(request.getAttachments());  // Copy attachments from request
        
        ForumPost saved = forumPostRepository.save(post);
        log.info("Forum post created with ID: {}", saved.getId());
        
        return toDTO(saved, user.getId());
    }
    
    /**
     * Get all posts with pagination and sorting
     */
    public Page<ForumPostDTO> getAllPosts(String firebaseUid, Pageable pageable) {
        String userId = getUserIdFromFirebaseUid(firebaseUid);
        Page<ForumPost> posts = forumPostRepository.findAll(pageable);
        return posts.map(post -> toDTO(post, userId));
    }
    
    /**
     * Get posts by course
     */
    public Page<ForumPostDTO> getPostsByCourse(String courseId, String firebaseUid, Pageable pageable) {
        String userId = getUserIdFromFirebaseUid(firebaseUid);
        Page<ForumPost> posts = forumPostRepository.findByCourseId(courseId, pageable);
        return posts.map(post -> toDTO(post, userId));
    }
    
    /**
     * Get posts by chapter
     */
    public Page<ForumPostDTO> getPostsByChapter(String chapterId, String firebaseUid, Pageable pageable) {
        String userId = getUserIdFromFirebaseUid(firebaseUid);
        Page<ForumPost> posts = forumPostRepository.findByChapterId(chapterId, pageable);
        return posts.map(post -> toDTO(post, userId));
    }
    
    /**
     * Get posts by category
     */
    public Page<ForumPostDTO> getPostsByCategory(ForumCategory category, String firebaseUid, Pageable pageable) {
        String userId = getUserIdFromFirebaseUid(firebaseUid);
        Page<ForumPost> posts = forumPostRepository.findByCategory(category, pageable);
        return posts.map(post -> toDTO(post, userId));
    }
    
    /**
     * Search posts by keyword
     */
    public Page<ForumPostDTO> searchPosts(String keyword, String firebaseUid, Pageable pageable) {
        String userId = getUserIdFromFirebaseUid(firebaseUid);
        Page<ForumPost> posts = forumPostRepository.searchByTitleOrContent(keyword, pageable);
        return posts.map(post -> toDTO(post, userId));
    }
    
    /**
     * Get post by ID (increments view count)
     */
    @Transactional
    public ForumPostDTO getPostById(String postId, String firebaseUid) {
        String userId = getUserIdFromFirebaseUid(firebaseUid);
        ForumPost post = forumPostRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found with ID: " + postId));
        
        // Increment view count
        post.incrementViews();
        forumPostRepository.save(post);
        
        return toDTO(post, userId);
    }
    
    /**
     * Update a forum post (only by author or admin)
     */
    @Transactional
    public ForumPostDTO updatePost(String postId, CreateForumPostRequest request, String firebaseUid, boolean isAdmin) {
        String userId = getUserIdFromFirebaseUid(firebaseUid);
        ForumPost post = forumPostRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found with ID: " + postId));
        
        // Check permission
        if (!post.getAuthorId().equals(userId) && !isAdmin) {
            throw new RuntimeException("You don't have permission to edit this post");
        }
        
        // Update fields
        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setCategory(request.getCategory());
        post.setTags(request.getTags());
        post.setUpdatedAt(LocalDateTime.now());
        
        ForumPost updated = forumPostRepository.save(post);
        log.info("Post {} updated by user {}", postId, userId);
        
        return toDTO(updated, userId);
    }
    
    /**
     * Delete a forum post (only by author or admin)
     */
    @Transactional
    public void deletePost(String postId, String firebaseUid, boolean isAdmin) {
        String userId = getUserIdFromFirebaseUid(firebaseUid);
        ForumPost post = forumPostRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found with ID: " + postId));
        
        // Check permission
        if (!post.getAuthorId().equals(userId) && !isAdmin) {
            throw new RuntimeException("You don't have permission to delete this post");
        }
        
        // Delete all replies
        forumReplyRepository.deleteByPostId(postId);
        
        // Delete post
        forumPostRepository.deleteById(postId);
        log.info("Post {} deleted by user {}", postId, userId);
    }
    
    /**
     * Vote on a post
     */
    @Transactional
    public ForumPostDTO voteOnPost(String postId, VoteRequest voteRequest, String firebaseUid) {
        String userId = getUserIdFromFirebaseUid(firebaseUid);
        ForumPost post = forumPostRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found with ID: " + postId));
        
        VoteType voteType = VoteType.valueOf(voteRequest.getVoteType());
        post.vote(userId, voteType);
        
        ForumPost updated = forumPostRepository.save(post);
        log.info("User {} voted {} on post {}", userId, voteType, postId);
        
        return toDTO(updated, userId);
    }
    
    // ==================== FORUM REPLY OPERATIONS ====================
    
    /**
     * Create a reply to a post
     */
    @Transactional
    public ForumReplyDTO createReply(CreateForumReplyRequest request, String firebaseUid) {
        log.info("Creating reply by user {} to post {}", firebaseUid, request.getPostId());
        
        // Check if post exists
        ForumPost post = forumPostRepository.findById(request.getPostId())
            .orElseThrow(() -> new RuntimeException("Post not found with ID: " + request.getPostId()));
        
        // Check if post is locked
        if (post.isLocked()) {
            throw new RuntimeException("This post is locked and cannot accept new replies");
        }
        
        // Get user info
        User user = userRepository.findByFirebaseUid(firebaseUid)
            .orElseThrow(() -> new UserNotFoundException("User not found with Firebase UID: " + firebaseUid));
        
        // Create reply
        ForumReply reply = new ForumReply();
        reply.setContent(request.getContent());
        reply.setAuthorId(user.getId());
        reply.setAuthorUsername(user.getUsername());
        reply.setPostId(request.getPostId());
        
        ForumReply saved = forumReplyRepository.save(reply);
        
        // Update post reply count and activity
        post.incrementReplyCount();
        forumPostRepository.save(post);
        
        log.info("Reply created with ID: {}", saved.getId());
        return toReplyDTO(saved, user.getId());
    }
    
    /**
     * Get all replies for a post
     */
    public Page<ForumReplyDTO> getRepliesForPost(String postId, String firebaseUid, Pageable pageable) {
        String userId = getUserIdFromFirebaseUid(firebaseUid);
        Page<ForumReply> replies = forumReplyRepository.findByPostId(postId, pageable);
        return replies.map(reply -> toReplyDTO(reply, userId));
    }
    
    /**
     * Update a reply (only by author or admin)
     */
    @Transactional
    public ForumReplyDTO updateReply(String replyId, String content, String firebaseUid, boolean isAdmin) {
        String userId = getUserIdFromFirebaseUid(firebaseUid);
        ForumReply reply = forumReplyRepository.findById(replyId)
            .orElseThrow(() -> new RuntimeException("Reply not found with ID: " + replyId));
        
        // Check permission
        if (!reply.getAuthorId().equals(userId) && !isAdmin) {
            throw new RuntimeException("You don't have permission to edit this reply");
        }
        
        reply.setContent(content);
        reply.setUpdatedAt(LocalDateTime.now());
        
        ForumReply updated = forumReplyRepository.save(reply);
        log.info("Reply {} updated by user {}", replyId, userId);
        
        return toReplyDTO(updated, userId);
    }
    
    /**
     * Delete a reply (only by author or admin)
     */
    @Transactional
    public void deleteReply(String replyId, String firebaseUid, boolean isAdmin) {
        String userId = getUserIdFromFirebaseUid(firebaseUid);
        ForumReply reply = forumReplyRepository.findById(replyId)
            .orElseThrow(() -> new RuntimeException("Reply not found with ID: " + replyId));
        
        // Check permission
        if (!reply.getAuthorId().equals(userId) && !isAdmin) {
            throw new RuntimeException("You don't have permission to delete this reply");
        }
        
        // Update post reply count
        ForumPost post = forumPostRepository.findById(reply.getPostId())
            .orElseThrow(() -> new RuntimeException("Post not found"));
        post.decrementReplyCount();
        forumPostRepository.save(post);
        
        // Delete reply
        forumReplyRepository.deleteById(replyId);
        log.info("Reply {} deleted by user {}", replyId, userId);
    }
    
    /**
     * Vote on a reply
     */
    @Transactional
    public ForumReplyDTO voteOnReply(String replyId, VoteRequest voteRequest, String firebaseUid) {
        String userId = getUserIdFromFirebaseUid(firebaseUid);
        ForumReply reply = forumReplyRepository.findById(replyId)
            .orElseThrow(() -> new RuntimeException("Reply not found with ID: " + replyId));
        
        VoteType voteType = VoteType.valueOf(voteRequest.getVoteType());
        reply.vote(userId, voteType);
        
        ForumReply updated = forumReplyRepository.save(reply);
        log.info("User {} voted {} on reply {}", userId, voteType, replyId);
        
        return toReplyDTO(updated, userId);
    }
    
    /**
     * Mark reply as accepted answer (only by post author or admin)
     */
    @Transactional
    public ForumReplyDTO markAsAcceptedAnswer(String replyId, String firebaseUid, boolean isAdmin) {
        String userId = getUserIdFromFirebaseUid(firebaseUid);
        ForumReply reply = forumReplyRepository.findById(replyId)
            .orElseThrow(() -> new RuntimeException("Reply not found with ID: " + replyId));
        
        ForumPost post = forumPostRepository.findById(reply.getPostId())
            .orElseThrow(() -> new RuntimeException("Post not found"));
        
        // Check permission (only post author or admin)
        if (!post.getAuthorId().equals(userId) && !isAdmin) {
            throw new RuntimeException("Only the post author or admin can mark an answer as accepted");
        }
        
        // Remove accepted answer from other replies
        forumReplyRepository.findByPostIdAndIsAcceptedAnswerTrue(reply.getPostId())
            .ifPresent(existingAnswer -> {
                existingAnswer.setAcceptedAnswer(false);
                forumReplyRepository.save(existingAnswer);
            });
        
        // Mark this reply as accepted
        reply.setAcceptedAnswer(true);
        ForumReply updated = forumReplyRepository.save(reply);
        
        // Mark post as resolved
        post.setResolved(true);
        forumPostRepository.save(post);
        
        log.info("Reply {} marked as accepted answer", replyId);
        return toReplyDTO(updated, userId);
    }
    
    // ==================== MODERATION OPERATIONS (ADMIN) ====================
    
    /**
     * Pin/Unpin a post (admin only)
     */
    @Transactional
    public ForumPostDTO togglePinPost(String postId, String firebaseUid) {
        String userId = getUserIdFromFirebaseUid(firebaseUid);
        ForumPost post = forumPostRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found with ID: " + postId));
        
        post.setPinned(!post.isPinned());
        ForumPost updated = forumPostRepository.save(post);
        
        log.info("Post {} pin status toggled to {} by admin {}", postId, post.isPinned(), userId);
        return toDTO(updated, userId);
    }
    
    /**
     * Lock/Unlock a post (admin only)
     */
    @Transactional
    public ForumPostDTO toggleLockPost(String postId, String firebaseUid) {
        String userId = getUserIdFromFirebaseUid(firebaseUid);
        ForumPost post = forumPostRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found with ID: " + postId));
        
        post.setLocked(!post.isLocked());
        ForumPost updated = forumPostRepository.save(post);
        
        log.info("Post {} lock status toggled to {} by admin {}", postId, post.isLocked(), userId);
        return toDTO(updated, userId);
    }
    
    /**
     * Get user's forum statistics (expects Firebase UID)
     */
    public UserForumStatsDTO getUserForumStats(String firebaseUid) {
        String userId = getUserIdFromFirebaseUid(firebaseUid);
        long postCount = forumPostRepository.countByAuthorId(userId);
        long replyCount = forumReplyRepository.countByAuthorId(userId);
        
        UserForumStatsDTO stats = new UserForumStatsDTO();
        stats.setUserId(userId);
        stats.setPostCount(postCount);
        stats.setReplyCount(replyCount);
        stats.setTotalContributions(postCount + replyCount);
        
        return stats;
    }
    
    /**
     * Convert ForumPost entity to DTO with user-specific data
     */
    private ForumPostDTO toDTO(ForumPost post, String userId) {
        ForumPostDTO dto = new ForumPostDTO();
        dto.setId(post.getId());
        dto.setTitle(post.getTitle());
        dto.setContent(post.getContent());
        dto.setAuthorId(post.getAuthorId());
        dto.setAuthorUsername(post.getAuthorUsername());
        dto.setCourseId(post.getCourseId());
        dto.setChapterId(post.getChapterId());
        dto.setCategory(post.getCategory());
        dto.setTags(post.getTags());
        dto.setAttachments(post.getAttachments());  // Include attachments in DTO
        dto.setViewCount(post.getViewCount());
        dto.setUpvotes(post.getUpvotes());
        dto.setDownvotes(post.getDownvotes());
        dto.setNetVotes(post.getNetVotes());
        dto.setReplyCount(post.getReplyCount());
        dto.setPinned(post.isPinned());
        dto.setLocked(post.isLocked());
        dto.setResolved(post.isResolved());
        dto.setCreatedAt(post.getCreatedAt());
        dto.setUpdatedAt(post.getUpdatedAt());
        dto.setLastActivityAt(post.getLastActivityAt());
        
        // Set user's vote status
        if (post.getUpvotedBy().contains(userId)) {
            dto.setUserVoteStatus("UPVOTED");
        } else if (post.getDownvotedBy().contains(userId)) {
            dto.setUserVoteStatus("DOWNVOTED");
        } else {
            dto.setUserVoteStatus("NONE");
        }
        
        // Get course and chapter names if available
        if (post.getCourseId() != null) {
            courseRepository.findById(post.getCourseId())
                .ifPresent(course -> dto.setCourseName(course.getTitle()));
        }
        if (post.getChapterId() != null) {
            chapterRepository.findById(post.getChapterId())
                .ifPresent(chapter -> dto.setChapterName(chapter.getTitle()));
        }
        
        return dto;
    }
    
    /**
     * Convert ForumReply entity to DTO with user-specific data
     */
    private ForumReplyDTO toReplyDTO(ForumReply reply, String userId) {
        ForumReplyDTO dto = new ForumReplyDTO();
        dto.setId(reply.getId());
        dto.setContent(reply.getContent());
        dto.setAuthorId(reply.getAuthorId());
        dto.setAuthorUsername(reply.getAuthorUsername());
        dto.setPostId(reply.getPostId());
        dto.setUpvotes(reply.getUpvotes());
        dto.setDownvotes(reply.getDownvotes());
        dto.setNetVotes(reply.getNetVotes());
        dto.setAcceptedAnswer(reply.isAcceptedAnswer());
        dto.setCreatedAt(reply.getCreatedAt());
        dto.setUpdatedAt(reply.getUpdatedAt());
        
        // Set user's vote status
        if (reply.getUpvotedBy().contains(userId)) {
            dto.setUserVoteStatus("UPVOTED");
        } else if (reply.getDownvotedBy().contains(userId)) {
            dto.setUserVoteStatus("DOWNVOTED");
        } else {
            dto.setUserVoteStatus("NONE");
        }
        
        return dto;
    }
}

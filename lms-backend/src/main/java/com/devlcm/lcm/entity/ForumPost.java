package com.devlcm.lcm.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Forum Post entity for course/chapter/general discussions
 * Supports voting, pinning, locking, and categorization
 */
@Document(collection = "forum_posts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ForumPost {
    
    @Id
    private String id = UUID.randomUUID().toString();
    
    // Post content
    private String title;
    private String content;
    
    // Author information
    @Indexed
    private String authorId;
    private String authorUsername;
    
    // Context (course/chapter specific or general)
    @Indexed
    private String courseId;  // null for general discussions
    @Indexed
    private String chapterId; // null if not chapter-specific
    
    // Category/Tags
    private ForumCategory category = ForumCategory.GENERAL;
    private List<String> tags = new ArrayList<>();
    
    // Attachments
    private List<ForumAttachment> attachments = new ArrayList<>();
    
    // Engagement metrics
    private int viewCount = 0;
    private int upvotes = 0;
    private int downvotes = 0;
    private Set<String> upvotedBy = new HashSet<>();
    private Set<String> downvotedBy = new HashSet<>();
    
    // Reply count (denormalized for performance)
    private int replyCount = 0;
    
    // Moderation
    private boolean isPinned = false;
    private boolean isLocked = false;
    private boolean isResolved = false;
    
    // Timestamps
    @Indexed
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    private LocalDateTime lastActivityAt = LocalDateTime.now();
    
    /**
     * Vote on the post (upvote/downvote)
     */
    public void vote(String userId, VoteType voteType) {
        // Remove previous votes
        if (upvotedBy.remove(userId)) {
            upvotes--;
        }
        if (downvotedBy.remove(userId)) {
            downvotes--;
        }
        
        // Add new vote
        if (voteType == VoteType.UPVOTE) {
            upvotedBy.add(userId);
            upvotes++;
        } else if (voteType == VoteType.DOWNVOTE) {
            downvotedBy.add(userId);
            downvotes++;
        }
        
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * Get net votes (upvotes - downvotes)
     */
    public int getNetVotes() {
        return upvotes - downvotes;
    }
    
    /**
     * Increment view count
     */
    public void incrementViews() {
        this.viewCount++;
    }
    
    /**
     * Update last activity timestamp
     */
    public void updateActivity() {
        this.lastActivityAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * Increment reply count
     */
    public void incrementReplyCount() {
        this.replyCount++;
        updateActivity();
    }
    
    /**
     * Decrement reply count
     */
    public void decrementReplyCount() {
        if (this.replyCount > 0) {
            this.replyCount--;
            updateActivity();
        }
    }
}

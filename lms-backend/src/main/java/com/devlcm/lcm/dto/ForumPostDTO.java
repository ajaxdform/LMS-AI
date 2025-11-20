package com.devlcm.lcm.dto;

import com.devlcm.lcm.entity.ForumAttachment;
import com.devlcm.lcm.entity.ForumCategory;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ForumPostDTO {
    private String id;
    
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "Content is required")
    private String content;
    
    // Author info
    private String authorId;
    private String authorUsername;
    
    // Context
    private String courseId;
    private String courseName;  // Denormalized for UI
    private String chapterId;
    private String chapterName; // Denormalized for UI
    
    // Category and tags
    private ForumCategory category;
    private List<String> tags = new ArrayList<>();
    
    // Attachments
    private List<ForumAttachment> attachments = new ArrayList<>();
    
    // Metrics
    private int viewCount;
    private int upvotes;
    private int downvotes;
    private int netVotes;  // Calculated: upvotes - downvotes
    private int replyCount;
    
    // User's vote status (for displaying to current user)
    private String userVoteStatus; // "UPVOTED", "DOWNVOTED", "NONE"
    
    // Status flags
    private boolean isPinned;
    private boolean isLocked;
    private boolean isResolved;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastActivityAt;
}

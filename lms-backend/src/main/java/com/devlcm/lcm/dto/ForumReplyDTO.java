package com.devlcm.lcm.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ForumReplyDTO {
    private String id;
    
    @NotBlank(message = "Content is required")
    private String content;
    
    // Author info
    private String authorId;
    private String authorUsername;
    
    // Parent post
    private String postId;
    
    // Metrics
    private int upvotes;
    private int downvotes;
    private int netVotes;  // Calculated: upvotes - downvotes
    
    // User's vote status
    private String userVoteStatus; // "UPVOTED", "DOWNVOTED", "NONE"
    
    // Solution flag
    private boolean isAcceptedAnswer;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

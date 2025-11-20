package com.devlcm.lcm.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Forum Reply entity for replies to forum posts
 * Supports voting and marking as solution
 */
@Document(collection = "forum_replies")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ForumReply {
    
    @Id
    private String id = UUID.randomUUID().toString();
    
    // Reply content
    private String content;
    
    // Author information
    @Indexed
    private String authorId;
    private String authorUsername;
    
    // Parent post reference
    @Indexed
    private String postId;
    
    // Engagement metrics
    private int upvotes = 0;
    private int downvotes = 0;
    private Set<String> upvotedBy = new HashSet<>();
    private Set<String> downvotedBy = new HashSet<>();
    
    // Mark as solution (for question posts)
    private boolean isAcceptedAnswer = false;
    
    // Timestamps
    @Indexed
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    /**
     * Vote on the reply (upvote/downvote)
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
}

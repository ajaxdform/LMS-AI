package com.devlcm.lcm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for voting on posts/replies
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VoteRequest {
    
    @NotBlank(message = "Vote type is required")
    @Pattern(regexp = "UPVOTE|DOWNVOTE|REMOVE", message = "Vote type must be UPVOTE, DOWNVOTE, or REMOVE")
    private String voteType;  // "UPVOTE", "DOWNVOTE", "REMOVE"
}

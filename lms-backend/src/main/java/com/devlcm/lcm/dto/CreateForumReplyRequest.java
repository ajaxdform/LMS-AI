package com.devlcm.lcm.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a reply to a forum post
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateForumReplyRequest {
    
    @NotBlank(message = "Content is required")
    private String content;
    
    @NotBlank(message = "Post ID is required")
    private String postId;
}

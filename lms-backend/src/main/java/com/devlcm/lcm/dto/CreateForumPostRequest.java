package com.devlcm.lcm.dto;

import com.devlcm.lcm.entity.ForumAttachment;
import com.devlcm.lcm.entity.ForumCategory;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Request DTO for creating a new forum post
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateForumPostRequest {
    
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "Content is required")
    private String content;
    
    // Optional context (null for general discussions)
    private String courseId;
    private String chapterId;
    
    // Category
    private ForumCategory category = ForumCategory.GENERAL;
    
    // Optional tags
    private List<String> tags = new ArrayList<>();
    
    // Optional attachments (file URLs will be populated after upload)
    private List<ForumAttachment> attachments = new ArrayList<>();
}

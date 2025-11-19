package com.devlcm.lcm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Preview DTO for unauthenticated users - excludes content
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TopicPreviewDTO {
    private String id;
    private String title;
    private String chapterId;
    
    public TopicPreviewDTO(TopicDTO topicDTO) {
        this.id = topicDTO.getId();
        this.title = topicDTO.getTitle();
        this.chapterId = topicDTO.getChapterId();
    }
}

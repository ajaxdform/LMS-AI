package com.devlcm.lcm.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TopicDTO {
    private String id;

    @NotBlank(message = "Topic title is mandatory")
    private String title;

    private String content;

    private String chapterId;
}

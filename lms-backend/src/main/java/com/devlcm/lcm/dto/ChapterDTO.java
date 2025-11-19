package com.devlcm.lcm.dto;

import java.util.ArrayList;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChapterDTO {
    private String id;

    @NotBlank(message = "Chapter title is mandatory")
    private String title;

    private String description;

    private String courseId;

    private List<String> topicsIds = new ArrayList<>();
}

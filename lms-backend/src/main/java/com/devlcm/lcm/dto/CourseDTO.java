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
public class CourseDTO {
    private String id;

    @NotBlank(message = "Course title is mandatory")
    private String title;

    private String description;

    private String subject;

    private List<String> chapterIds = new ArrayList<>();
}

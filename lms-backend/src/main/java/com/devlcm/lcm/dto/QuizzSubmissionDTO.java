package com.devlcm.lcm.dto;

import java.util.Map;

import lombok.Data;

@Data
public class QuizzSubmissionDTO {
    private String userId;

    private String courseId;

    private String chapterId;

    private Map<String, String> answers;
}

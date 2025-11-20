package com.devlcm.lcm.dto;

import java.util.List;
import java.util.Map;

import lombok.Data;

@Data
public class QuizzSubmissionDTO {
    private String userId;

    private String courseId;

    private String chapterId;

    // For single choice and true/false: Map<questionId, answer>
    private Map<String, String> answers;

    // For multiple choice: Map<questionId, List<selectedIndices>>
    private Map<String, List<Integer>> multipleChoiceAnswers;

    // For code evaluation: Map<questionId, code>
    private Map<String, String> codeAnswers;
}

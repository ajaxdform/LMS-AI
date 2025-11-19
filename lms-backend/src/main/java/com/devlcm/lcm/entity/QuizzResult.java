package com.devlcm.lcm.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "quizz_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizzResult {
    @Id
    private String id;

    private String userId;

    private String chapterId;

    private int score;

    private int totalQuestions;

    private boolean passed;

    private LocalDateTime submittedAt = LocalDateTime.now();
}

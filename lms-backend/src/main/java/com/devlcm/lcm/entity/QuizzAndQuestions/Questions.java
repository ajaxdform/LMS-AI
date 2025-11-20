package com.devlcm.lcm.entity.QuizzAndQuestions;

import java.util.List;

import org.springframework.data.annotation.Id;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Questions {
    @Id
    private String id;

    private String question;

    // Question type: SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, CODE_EVALUATION
    private QuestionType type = QuestionType.SINGLE_CHOICE;

    private List<String> options;

    // For single choice questions
    private Integer correctOptionIndex;

    // For multiple choice questions (indices of correct options)
    private List<Integer> correctOptionIndices;

    // For true/false questions
    private Boolean correctAnswer;

    // For code evaluation questions
    private String testCases; // JSON string containing test cases
    private String expectedOutput;
    private String sampleCode; // Sample/starter code
    private String programmingLanguage; // java, python, javascript, etc.

    // Points awarded for this question
    private Integer points = 1;

    // Explanation shown after answering
    private String explanation;

    public enum QuestionType {
        SINGLE_CHOICE,      // Traditional multiple choice with one answer
        MULTIPLE_CHOICE,    // Multiple correct answers
        TRUE_FALSE,         // True or False question
        CODE_EVALUATION     // Code writing and evaluation
    }
}

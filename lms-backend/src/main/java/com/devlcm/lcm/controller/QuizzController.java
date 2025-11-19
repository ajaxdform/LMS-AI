package com.devlcm.lcm.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.devlcm.lcm.annotation.RateLimit;
import com.devlcm.lcm.dto.ApiResponse;
import com.devlcm.lcm.dto.QuizzDTO;
import com.devlcm.lcm.dto.QuizzSubmissionDTO;
import com.devlcm.lcm.entity.QuizzResult;
import com.devlcm.lcm.entity.QuizzAndQuestions.Questions;
import com.devlcm.lcm.entity.QuizzAndQuestions.Quizz;
import com.devlcm.lcm.mapper.AllMapper;
import com.devlcm.lcm.service.QuizzService;

import org.springframework.validation.annotation.Validated;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/quizzes")
@RequiredArgsConstructor
@Validated
@RateLimit(limit = 30, duration = 60) // 30 requests per minute per user (stricter for quiz submissions)
public class QuizzController {
    private final QuizzService quizzService;
    private final AllMapper allMapper;

    @PostMapping("/{chapterId}")
    public ResponseEntity<ApiResponse<QuizzDTO>> createQuizz(
            @PathVariable @NotBlank String chapterId, 
            @Valid @RequestBody QuizzDTO quizzDTO) {
        Quizz created = quizzService.createQuiz(chapterId, allMapper.toQuizzEntity(quizzDTO));
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(
                allMapper.toQuizzDTO(created),
                "Quiz created successfully"
            ));
    }

    @GetMapping("/chapterId/{chapterId}")
    public ResponseEntity<ApiResponse<QuizzDTO>> getQuizzByChapterId(
            @PathVariable @NotBlank String chapterId) {
        QuizzDTO quizz = quizzService.getQuizzByChapterId(chapterId)
            .map(allMapper::toQuizzDTO)
            .orElseThrow(() -> new com.devlcm.lcm.exception.QuizNotFoundException("Quiz not found for chapter ID: " + chapterId));
        return ResponseEntity.ok(ApiResponse.success(quizz));
    }

    @PostMapping("/{quizzId}/questions") 
    public ResponseEntity<ApiResponse<QuizzDTO>> addQuestion(
            @PathVariable @NotBlank String quizzId, 
            @Valid @RequestBody Questions questions) {
        Quizz updated = quizzService.addQuestionsToQuizz(quizzId, questions);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(
                allMapper.toQuizzDTO(updated),
                "Question added successfully"
            ));
    }

    @PostMapping("/{quizzId}/submit")
    public ResponseEntity<ApiResponse<QuizzResult>> submitQuizz(
            @PathVariable("quizzId") @NotBlank String quizzId,
            @Valid @RequestBody QuizzSubmissionDTO submission) {
        QuizzResult result = quizzService.submitQuizz(quizzId, submission);
        return ResponseEntity.ok(ApiResponse.success(result, "Quiz submitted successfully"));
    }
}

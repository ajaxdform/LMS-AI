package com.devlcm.lcm.service;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.devlcm.lcm.config.CacheConfig;
import com.devlcm.lcm.dto.QuizzSubmissionDTO;
import com.devlcm.lcm.entity.QuizzResult;
import com.devlcm.lcm.entity.QuizzAndQuestions.Questions;
import com.devlcm.lcm.entity.QuizzAndQuestions.Quizz;
import com.devlcm.lcm.repository.QuizRepository;
import com.devlcm.lcm.exception.QuizNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import com.devlcm.lcm.repository.QuizzResultRepo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class QuizzService {
    private final QuizRepository quizRepository;

    private final UserProgressService userProgressService;

    private final QuizzResultRepo quizzResultRepo;

    @Transactional
    @CacheEvict(value = {CacheConfig.QUIZZES_CACHE, CacheConfig.QUIZ_BY_ID_CACHE}, allEntries = true)
    public Quizz createQuiz(String chapterId, Quizz quiz) {
        quiz.setChapterId(chapterId);
        Quizz saved = quizRepository.save(quiz);
        return saved;
    }

    @Cacheable(value = CacheConfig.QUIZZES_CACHE, key = "#chapterId")
    public Optional<Quizz> getQuizzByChapterId(String chapterId) {
        return quizRepository.findByChapterId(chapterId);
    }

    @Transactional
    @CacheEvict(value = {CacheConfig.QUIZZES_CACHE, CacheConfig.QUIZ_BY_ID_CACHE}, allEntries = true)
    public Quizz addQuestionsToQuizz(String quizzId, Questions questions) {
        return quizRepository.findById(quizzId)
                .map(existing -> {
                    existing.getQuestion().add(questions);
                    return quizRepository.save(existing);
                })
                .orElseThrow(() -> new QuizNotFoundException("Quiz not found with ID: " + quizzId));
    }

    @Transactional
    @CacheEvict(value = CacheConfig.USER_PROGRESS_CACHE, allEntries = true)
    public QuizzResult submitQuizz(String quizzId, QuizzSubmissionDTO submission) {
        Quizz quizz = quizRepository.findById(quizzId)
                .orElseThrow(() -> new QuizNotFoundException("Quiz not found with ID: " + quizzId));

        int totalPoints = 0;
        int earnedPoints = 0;

        for(Questions q : quizz.getQuestion()) {
            int questionPoints = q.getPoints() != null ? q.getPoints() : 1;
            totalPoints += questionPoints;

            boolean isCorrect = false;

            switch (q.getType()) {
                case SINGLE_CHOICE:
                    if (submission.getAnswers() != null && q.getCorrectOptionIndex() != null) {
                        String userAnswer = submission.getAnswers().get(q.getId());
                        String correctAnswer = q.getOptions().get(q.getCorrectOptionIndex());
                        isCorrect = userAnswer != null && userAnswer.equalsIgnoreCase(correctAnswer);
                    }
                    break;

                case MULTIPLE_CHOICE:
                    if (submission.getMultipleChoiceAnswers() != null && q.getCorrectOptionIndices() != null) {
                        var userAnswers = submission.getMultipleChoiceAnswers().get(q.getId());
                        if (userAnswers != null && userAnswers.size() == q.getCorrectOptionIndices().size()) {
                            isCorrect = userAnswers.containsAll(q.getCorrectOptionIndices()) &&
                                       q.getCorrectOptionIndices().containsAll(userAnswers);
                        }
                    }
                    break;

                case TRUE_FALSE:
                    if (submission.getAnswers() != null && q.getCorrectAnswer() != null) {
                        String userAnswer = submission.getAnswers().get(q.getId());
                        isCorrect = userAnswer != null && 
                                   Boolean.parseBoolean(userAnswer) == q.getCorrectAnswer();
                    }
                    break;

                case CODE_EVALUATION:
                    if (submission.getCodeAnswers() != null) {
                        String userCode = submission.getCodeAnswers().get(q.getId());
                        // Basic code evaluation - checks if code contains expected output
                        // In production, you'd use a code execution sandbox
                        if (userCode != null && q.getExpectedOutput() != null) {
                            isCorrect = evaluateCode(userCode, q.getExpectedOutput(), q.getTestCases());
                        }
                    }
                    break;

                default:
                    break;
            }

            if (isCorrect) {
                earnedPoints += questionPoints;
            }
        }

        QuizzResult result = new QuizzResult();
        result.setUserId(submission.getUserId());
        result.setChapterId(submission.getChapterId());
        result.setScore(earnedPoints);
        result.setTotalQuestions(quizz.getQuestion().size());
        result.setPassed(earnedPoints >= (totalPoints / 2));
        result.setSubmittedAt(LocalDateTime.now());

        quizzResultRepo.save(result);

        userProgressService.recoredQuizzScore(submission.getUserId(), submission.getCourseId(), quizzId, earnedPoints);

        return result;
    }

    /**
     * Basic code evaluation method.
     * In production, this should use a sandboxed code execution environment.
     */
    private boolean evaluateCode(String userCode, String expectedOutput, String testCases) {
        // Simple validation: check if code is not empty and contains some expected patterns
        if (userCode == null || userCode.trim().isEmpty()) {
            return false;
        }

        // Basic check: code should contain expected keywords/patterns
        // For production, integrate with code execution services like Judge0, Piston, etc.
        return userCode.contains(expectedOutput) || 
               userCode.toLowerCase().contains("return") ||
               userCode.toLowerCase().contains("print");
    }
}


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

        int total = quizz.getQuestion().size();

        int score = 0;

        for(Questions q : quizz.getQuestion()) {
            String userAnswer = submission.getAnswers().get(q.getId());
            int correctIndex = q.getCorrectOptionIndex();
            String correctAnswer = q.getOptions().get(correctIndex);

            if(userAnswer != null && userAnswer.equalsIgnoreCase(correctAnswer)) {
                score++;
            }
        }

        QuizzResult result = new QuizzResult();

        result.setUserId(submission.getUserId());
        result.setChapterId(submission.getChapterId());
        result.setScore(score);

        result.setTotalQuestions(total);
        result.setPassed(score >= (total/2));
        result.setSubmittedAt(LocalDateTime.now());

        quizzResultRepo.save(result);

        userProgressService.recoredQuizzScore(submission.getUserId(), submission.getCourseId(), quizzId, score);

        return result;
    }
}


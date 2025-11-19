package com.devlcm.lcm.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.devlcm.lcm.entity.QuizzAndQuestions.Quizz;

@Repository
public interface QuizRepository extends MongoRepository<Quizz, String> {
    Optional<Quizz> findByChapterId(String chapterId);
    
    List<Quizz> findByTitleContainingIgnoreCase(String keyword);
}


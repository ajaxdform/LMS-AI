package com.devlcm.lcm.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.devlcm.lcm.entity.QuizzResult;

@Repository
public interface QuizzResultRepo extends MongoRepository<QuizzResult, String> {
    List<QuizzResult> findByUserId(String userId);
}

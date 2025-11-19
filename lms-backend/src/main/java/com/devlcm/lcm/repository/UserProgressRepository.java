package com.devlcm.lcm.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.devlcm.lcm.entity.UserProgress;

@Repository
public interface UserProgressRepository extends MongoRepository<UserProgress, String> {
    Optional<UserProgress> findByUserIdAndCourseId(String userId, String courseId);
    List<UserProgress> findByUserId(String userId);
    Page<UserProgress> findByUserId(String userId, Pageable pageable);
    
    // Admin methods
    void deleteByUserId(String userId);
}

package com.devlcm.lcm.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.devlcm.lcm.entity.Course;

@Repository
public interface CourseRepository extends MongoRepository<Course, String> {

    Optional<Course> findByTitle(String title);

    List<Course> findBysubjectIgnoreCase(String subject);
    Page<Course> findBysubjectIgnoreCase(String subject, Pageable pageable);

    List<Course> findByTitleContainingIgnoreCase(String keyword);
    Page<Course> findByTitleContainingIgnoreCase(String keyword, Pageable pageable);
} 
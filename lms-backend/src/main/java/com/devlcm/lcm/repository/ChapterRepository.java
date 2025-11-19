package com.devlcm.lcm.repository;

import com.devlcm.lcm.entity.Chapter;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChapterRepository extends MongoRepository<Chapter, String> {
}

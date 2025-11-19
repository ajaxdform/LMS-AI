package com.devlcm.lcm.repository;

import com.devlcm.lcm.entity.Topic;


import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TopicRepository extends MongoRepository<Topic, String> {
}

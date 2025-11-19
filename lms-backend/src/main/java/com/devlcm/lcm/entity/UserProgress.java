package com.devlcm.lcm.entity;

import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "user_progress")
@NoArgsConstructor
@AllArgsConstructor
@Data
public class UserProgress {
    
    @Id
    private String id;

    private String userId;
    
    private String courseId;

    private Set<String> completedChapterIds = new HashSet<>();

    private Map<String, Integer> quizzScore = new HashMap<>();

    private Date lastUpdated = new Date();
}

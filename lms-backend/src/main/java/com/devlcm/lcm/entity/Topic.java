package com.devlcm.lcm.entity;

import java.util.UUID;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "topics")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Topic {
    @Id
    private String id = UUID.randomUUID().toString();

    private String title;

    private String content;

    private String chapterId;
}

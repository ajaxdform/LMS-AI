package com.devlcm.lcm.entity;


import java.util.ArrayList;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "chapters")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Chapter {
    @Id
    private String id;

    private String title;

    private String description;

    private String courseId;

    private List<String> topicIds = new ArrayList<>();
}

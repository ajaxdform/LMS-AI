package com.devlcm.lcm.entity;

import java.util.ArrayList;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.mongodb.lang.NonNull;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "courses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Course {
    @Id
    private String id;

    @NonNull
    private String title;

    private String description;

    private String subject;

    private List<String> chapterIds = new ArrayList<>();
}

package com.devlcm.lcm.entity.QuizzAndQuestions;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "quizzes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Quizz {
    @Id
    private String id;

    private String title;

    private String chapterId;

    private List<Questions> question = new ArrayList<>();
}

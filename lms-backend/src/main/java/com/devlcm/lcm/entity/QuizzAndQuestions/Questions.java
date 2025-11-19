package com.devlcm.lcm.entity.QuizzAndQuestions;

import java.util.List;

import org.springframework.data.annotation.Id;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Questions {
    @Id
    private String id;

    private String question;

    private List<String> options;

    private int correctOptionIndex;
}

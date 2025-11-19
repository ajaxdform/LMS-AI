package com.devlcm.lcm.dto;

import java.util.ArrayList;
import java.util.List;

import com.devlcm.lcm.entity.QuizzAndQuestions.Questions;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class QuizzDTO {
    private String id;

    private String title;

    private String chapterId;
    
    private List<Questions> question = new ArrayList<>();
}

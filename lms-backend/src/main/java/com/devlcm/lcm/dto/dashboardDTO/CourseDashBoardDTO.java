package com.devlcm.lcm.dto.dashboardDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CourseDashBoardDTO {
    private String courseId;

    private String title;

    private String subject;

    private double progressPercentage;

    private double averageQuizScore;
}

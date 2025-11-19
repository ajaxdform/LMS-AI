package com.devlcm.lcm.dto.dashboardDTO;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserDashboardDTO {
    private String userId;

    private String username;

    private String email;

    private List<CourseDashBoardDTO> enrolledCourses;
}

package com.devlcm.lcm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for user forum statistics
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserForumStatsDTO {
    private String userId;
    private long postCount;
    private long replyCount;
    private long totalContributions;
}

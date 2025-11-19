package com.devlcm.lcm.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.devlcm.lcm.dto.dashboardDTO.CourseDashBoardDTO;
import com.devlcm.lcm.dto.dashboardDTO.UserDashboardDTO;
import com.devlcm.lcm.entity.Course;
import com.devlcm.lcm.entity.User;
import com.devlcm.lcm.exception.UserNotFoundException;
import com.devlcm.lcm.repository.UserRepository;
import com.devlcm.lcm.repository.CourseRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final UserProgressService userProgressService;

    public UserDashboardDTO getUserDashBoard(String userIdOrFirebaseUid) {
        // Try to find user by MongoDB ID first, then by Firebase UID
        User user = userRepository.findById(userIdOrFirebaseUid)
            .or(() -> userRepository.findByFirebaseUid(userIdOrFirebaseUid))
            .orElseThrow(() -> new UserNotFoundException("User not found with ID or Firebase UID: " + userIdOrFirebaseUid));

        List<CourseDashBoardDTO> enrolledCourses = new ArrayList<>();

        // Iterate through enrolled course IDs
        if (user.getEnrolledCourseIds() != null) {
            List<Course> courses = courseRepository.findAllById(user.getEnrolledCourseIds());
            
            for(Course course : courses) {
                if (course != null && course.getId() != null) {
                    // Get user progress for this course
                    String courseId = course.getId();
                
                // Calculate total chapters for progress calculation
                int totalChapters = course.getChapterIds() != null ? course.getChapterIds().size() : 0;
                
                // Get progress percentage
                double progressPercentage = userProgressService.getCourseProgressPercentage(
                    user.getId(), courseId, totalChapters);
                
                // Calculate average quiz score
                double averageQuizScore = userProgressService.getUserProgress(user.getId(), courseId)
                    .map(progress -> {
                        Map<String, Integer> quizScores = progress.getQuizzScore();
                        if (quizScores == null || quizScores.isEmpty()) {
                            return 0.0;
                        }
                        return quizScores.values().stream()
                            .mapToInt(Integer::intValue)
                            .average()
                            .orElse(0.0);
                    })
                    .orElse(0.0);
                
                CourseDashBoardDTO courseDashboard = new CourseDashBoardDTO();
                courseDashboard.setCourseId(courseId);
                courseDashboard.setTitle(course.getTitle());
                courseDashboard.setSubject(course.getSubject());
                courseDashboard.setProgressPercentage(progressPercentage);
                courseDashboard.setAverageQuizScore(averageQuizScore);
                
                enrolledCourses.add(courseDashboard);
                }
            }
        }

        UserDashboardDTO dashboard = new UserDashboardDTO();
        dashboard.setUserId(user.getId());
        dashboard.setUsername(user.getUsername());
        dashboard.setEmail(user.getEmail());
        dashboard.setEnrolledCourses(enrolledCourses);
        
        return dashboard;
    }
}

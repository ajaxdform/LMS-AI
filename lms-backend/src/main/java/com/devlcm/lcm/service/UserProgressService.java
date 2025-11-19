package com.devlcm.lcm.service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.devlcm.lcm.config.CacheConfig;
import com.devlcm.lcm.entity.Course;
import com.devlcm.lcm.entity.User;
import com.devlcm.lcm.entity.UserProgress;
import com.devlcm.lcm.repository.CourseRepository;
import com.devlcm.lcm.repository.UserProgressRepository;
import com.devlcm.lcm.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserProgressService {
    private final UserProgressRepository userProgressRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final CertificateService certificateService;

    private UserProgress getOrCreateProgress(String userId, String courseId) {
        return userProgressRepository.findByUserIdAndCourseId(userId, courseId)
                .orElseGet(() -> {
                    UserProgress up = new UserProgress();
                    up.setUserId(userId);
                    up.setCourseId(courseId);
                    return userProgressRepository.save(up);
                });
    }

    @Transactional
    @CacheEvict(value = CacheConfig.USER_PROGRESS_CACHE, allEntries = true)
    public UserProgress markedChapterCompleted(String userId, String courseId, String chapterId) {
        UserProgress progress = getOrCreateProgress(userId, courseId);
        boolean wasAlreadyCompleted = progress.getCompletedChapterIds().contains(chapterId);
        
        if (!wasAlreadyCompleted) {
            progress.getCompletedChapterIds().add(chapterId);
            progress.setLastUpdated(new Date());
            progress = userProgressRepository.save(progress);
            
            // Check if course is now completed
            checkAndNotifyCourseCompletion(userId, courseId);
        }
        
        return progress;
    }
    
    /**
     * Check if course is completed and send notification email if so.
     */
    private void checkAndNotifyCourseCompletion(String userId, String courseId) {
        try {
            if (certificateService.isCourseCompleted(userId, courseId)) {
                // Course is completed, send notification email
                Optional<User> userOpt = userRepository.findById(userId);
                Optional<Course> courseOpt = courseRepository.findById(courseId);
                
                if (userOpt.isPresent() && courseOpt.isPresent()) {
                    User user = userOpt.get();
                    Course course = courseOpt.get();
                    
                    if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                        boolean completionNotificationsEnabled = user.getEmailPreferences() != null && 
                            user.getEmailPreferences().isCompletionNotifications();
                        emailService.sendCourseCompletionNotification(
                            user.getEmail(),
                            user.getUsername(),
                            course.getTitle(),
                            completionNotificationsEnabled
                        );
                        log.info("Course completion notification sent to user: {} for course: {}", 
                            userId, courseId);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error checking course completion or sending notification", e);
            // Don't throw - this is a side effect, shouldn't break the main flow
        }
    }

    @Transactional
    @CacheEvict(value = CacheConfig.USER_PROGRESS_CACHE, allEntries = true)
    public UserProgress recoredQuizzScore(String userId, String courseId, String quizzId, int score) {
        UserProgress progress = getOrCreateProgress(userId, courseId);
        progress.getQuizzScore().put(quizzId, score);
        progress.setLastUpdated(new Date());
        return userProgressRepository.save(progress);
    }

    @Cacheable(value = CacheConfig.USER_PROGRESS_CACHE, key = "#userId + '_' + #courseId")
    public Optional<UserProgress> getUserProgress(String userId, String courseId) {
        return userProgressRepository.findByUserIdAndCourseId(userId, courseId);
    }

    public List<UserProgress> getAllProgressForUser(String userId) {
        return userProgressRepository.findByUserId(userId);
    }

    public Page<UserProgress> getAllProgressForUser(String userId, Pageable pageable) {
        return userProgressRepository.findByUserId(userId, pageable);
    }

    public double getCourseProgressPercentage(String userId, String courseId, int totalChapters) {
        UserProgress progress = getOrCreateProgress(userId, courseId);
        int completedChapters = progress.getCompletedChapterIds().size();
        if (totalChapters == 0) {
            return 0.0;
        }
        return (completedChapters / (double) totalChapters) * 100;
    }
}

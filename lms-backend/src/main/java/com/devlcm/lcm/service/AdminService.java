package com.devlcm.lcm.service;

import com.devlcm.lcm.config.CacheConfig;
import com.devlcm.lcm.dto.ChapterDTO;
import com.devlcm.lcm.dto.CourseDTO;
import com.devlcm.lcm.dto.QuizzDTO;
import com.devlcm.lcm.dto.TopicDTO;
import com.devlcm.lcm.dto.UserDTO;
import com.devlcm.lcm.entity.*;
import com.devlcm.lcm.entity.QuizzAndQuestions.Quizz;
import com.devlcm.lcm.exception.*;
import com.devlcm.lcm.mapper.AllMapper;
import com.devlcm.lcm.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Admin Service - Independent microservice-like component
 * Handles all administrative operations for the LMS
 * This service is isolated to keep admin operations separate from student operations
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AdminService {

    // Repositories
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final ChapterRepository chapterRepository;
    private final TopicRepository topicRepository;
    private final QuizRepository quizRepository;
    private final UserProgressRepository userProgressRepository;
    
    // Mapper
    private final AllMapper mapper;
    
    // ==================== USER MANAGEMENT ====================
    
    /**
     * Get all users with pagination
     */
    public Page<UserDTO> getAllUsers(Pageable pageable) {
        log.info("Admin: Fetching all users with pagination");
        return userRepository.findAll(pageable)
            .map(mapper::toUserDTO);
    }
    
    /**
     * Get user by ID
     */
    public UserDTO getUserById(String userId) {
        log.info("Admin: Fetching user with ID: {}", userId);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));
        return mapper.toUserDTO(user);
    }
    
    /**
     * Update user role (promote to admin or demote to student)
     */
    @Transactional
    public UserDTO updateUserRole(String userId, UserRole newRole) {
        log.info("Admin: Updating role for user {} to {}", userId, newRole);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));
        
        user.setRole(newRole);
        User updated = userRepository.save(user);
        
        log.info("Admin: Successfully updated user {} role to {}", userId, newRole);
        return mapper.toUserDTO(updated);
    }
    
    /**
     * Delete user (admin only - removes user and their progress)
     */
    @Transactional
    public void deleteUser(String userId) {
        log.info("Admin: Deleting user with ID: {}", userId);
        
        if (!userRepository.existsById(userId)) {
            throw new UserNotFoundException("User not found with ID: " + userId);
        }
        
        // Delete user progress
        userProgressRepository.deleteByUserId(userId);
        
        // Delete user
        userRepository.deleteById(userId);
        
        log.info("Admin: Successfully deleted user {}", userId);
    }
    
    /**
     * Get user statistics (cached for 5 minutes)
     */
    @Cacheable(value = CacheConfig.USER_STATS_CACHE, unless = "#result == null")
    public AdminUserStats getUserStatistics() {
        log.info("Admin: Fetching user statistics");
        
        long totalUsers = userRepository.count();
        long totalAdmins = userRepository.countByRole(UserRole.ADMIN);
        long totalStudents = userRepository.countByRole(UserRole.STUDENT);
        
        return new AdminUserStats(totalUsers, totalAdmins, totalStudents);
    }
    
    // ==================== COURSE MANAGEMENT ====================
    
    /**
     * Create a new course
     */
    @Transactional
    @CacheEvict(value = {CacheConfig.COURSES_CACHE, CacheConfig.COURSE_STATS_CACHE, CacheConfig.DASHBOARD_STATS_CACHE}, allEntries = true)
    public CourseDTO createCourse(CourseDTO courseDTO) {
        log.info("Admin: Creating new course: {}", courseDTO.getTitle());
        
        Course course = mapper.toCourseEntity(courseDTO);
        Course saved = courseRepository.save(course);
        
        log.info("Admin: Successfully created course with ID: {}", saved.getId());
        return mapper.toCourseDTO(saved);
    }
    
    /**
     * Update existing course
     */
    @Transactional
    @CacheEvict(value = {CacheConfig.COURSES_CACHE, CacheConfig.COURSE_BY_ID_CACHE, CacheConfig.COURSE_STATS_CACHE, CacheConfig.DASHBOARD_STATS_CACHE}, allEntries = true)
    public CourseDTO updateCourse(String courseId, CourseDTO courseDTO) {
        log.info("Admin: Updating course with ID: {}", courseId);
        
        Course existing = courseRepository.findById(courseId)
            .orElseThrow(() -> new CourseNotFoundException("Course not found with ID: " + courseId));
        
        // Update fields
        existing.setTitle(courseDTO.getTitle());
        existing.setDescription(courseDTO.getDescription());
        existing.setSubject(courseDTO.getSubject());
        
        Course updated = courseRepository.save(existing);
        
        log.info("Admin: Successfully updated course {}", courseId);
        return mapper.toCourseDTO(updated);
    }
    
    /**
     * Delete course (cascades to chapters, topics, quizzes)
     */
    @Transactional
    @CacheEvict(value = {CacheConfig.COURSES_CACHE, CacheConfig.COURSE_BY_ID_CACHE, 
                         CacheConfig.CHAPTERS_CACHE, CacheConfig.TOPICS_CACHE, 
                         CacheConfig.QUIZZES_CACHE, CacheConfig.COURSE_STATS_CACHE, 
                         CacheConfig.DASHBOARD_STATS_CACHE}, allEntries = true)
    public void deleteCourse(String courseId) {
        log.info("Admin: Deleting course with ID: {}", courseId);
        
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new CourseNotFoundException("Course not found with ID: " + courseId));
        
        // Delete all chapters and their topics
        if (course.getChapterIds() != null) {
            for (String chapterId : course.getChapterIds()) {
                deleteChapter(chapterId);
            }
        }
        
        // Delete course
        courseRepository.deleteById(courseId);
        
        log.info("Admin: Successfully deleted course {} and all related data", courseId);
    }
    
    /**
     * Get course statistics (cached for 5 minutes)
     */
    @Cacheable(value = CacheConfig.COURSE_STATS_CACHE, unless = "#result == null")
    public AdminCourseStats getCourseStatistics() {
        log.info("Admin: Fetching course statistics");
        
        long totalCourses = courseRepository.count();
        long totalChapters = chapterRepository.count();
        long totalTopics = topicRepository.count();
        long totalQuizzes = quizRepository.count();
        
        return new AdminCourseStats(totalCourses, totalChapters, totalTopics, totalQuizzes);
    }
    
    // ==================== CHAPTER MANAGEMENT ====================
    
    /**
     * Create a new chapter for a course
     */
    @Transactional
    @CacheEvict(value = {CacheConfig.CHAPTERS_CACHE, CacheConfig.COURSES_CACHE, 
                         CacheConfig.COURSE_BY_ID_CACHE, CacheConfig.COURSE_STATS_CACHE, 
                         CacheConfig.DASHBOARD_STATS_CACHE}, allEntries = true)
    public ChapterDTO createChapter(String courseId, ChapterDTO chapterDTO) {
        log.info("Admin: Creating new chapter for course {}: {}", courseId, chapterDTO.getTitle());
        
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new CourseNotFoundException("Course not found with ID: " + courseId));
        
        Chapter chapter = mapper.toChapterEntity(chapterDTO);
        chapter.setCourseId(courseId);
        Chapter saved = chapterRepository.save(chapter);
        
        // Add chapter to course
        course.getChapterIds().add(saved.getId());
        courseRepository.save(course);
        
        log.info("Admin: Successfully created chapter with ID: {}", saved.getId());
        return mapper.toChapterDTO(saved);
    }
    
    /**
     * Update chapter
     */
    @Transactional
    @CacheEvict(value = {CacheConfig.CHAPTERS_CACHE, CacheConfig.CHAPTER_BY_ID_CACHE, 
                         CacheConfig.COURSES_CACHE, CacheConfig.COURSE_BY_ID_CACHE}, allEntries = true)
    public ChapterDTO updateChapter(String chapterId, ChapterDTO chapterDTO) {
        log.info("Admin: Updating chapter with ID: {}", chapterId);
        
        Chapter existing = chapterRepository.findById(chapterId)
            .orElseThrow(() -> new ChapterNotFoundException("Chapter not found with ID: " + chapterId));
        
        existing.setTitle(chapterDTO.getTitle());
        existing.setDescription(chapterDTO.getDescription());
        
        Chapter updated = chapterRepository.save(existing);
        
        log.info("Admin: Successfully updated chapter {}", chapterId);
        return mapper.toChapterDTO(updated);
    }
    
    /**
     * Delete chapter (cascades to topics and quizzes)
     */
    @Transactional
    @CacheEvict(value = {CacheConfig.CHAPTERS_CACHE, CacheConfig.CHAPTER_BY_ID_CACHE, 
                         CacheConfig.TOPICS_CACHE, CacheConfig.QUIZZES_CACHE,
                         CacheConfig.COURSES_CACHE, CacheConfig.COURSE_BY_ID_CACHE,
                         CacheConfig.COURSE_STATS_CACHE, CacheConfig.DASHBOARD_STATS_CACHE}, allEntries = true)
    public void deleteChapter(String chapterId) {
        log.info("Admin: Deleting chapter with ID: {}", chapterId);
        
        Chapter chapter = chapterRepository.findById(chapterId)
            .orElse(null);
        
        if (chapter == null) {
            log.warn("Admin: Chapter {} not found, skipping deletion", chapterId);
            return;
        }
        
        // Delete all topics in this chapter
        if (chapter.getTopicIds() != null) {
            for (String topicId : chapter.getTopicIds()) {
                deleteTopic(topicId);
            }
        }
        
        // Remove chapter from course
        if (chapter.getCourseId() != null) {
            courseRepository.findById(chapter.getCourseId()).ifPresent(course -> {
                course.getChapterIds().remove(chapterId);
                courseRepository.save(course);
            });
        }
        
        // Delete chapter
        chapterRepository.deleteById(chapterId);
        
        log.info("Admin: Successfully deleted chapter {}", chapterId);
    }
    
    // ==================== TOPIC MANAGEMENT ====================
    
    /**
     * Create a new topic for a chapter
     */
    @Transactional
    @CacheEvict(value = {CacheConfig.TOPICS_CACHE, CacheConfig.CHAPTERS_CACHE, 
                         CacheConfig.CHAPTER_BY_ID_CACHE, CacheConfig.COURSE_STATS_CACHE, 
                         CacheConfig.DASHBOARD_STATS_CACHE}, allEntries = true)
    public TopicDTO createTopic(String chapterId, TopicDTO topicDTO) {
        log.info("Admin: Creating new topic for chapter {}: {}", chapterId, topicDTO.getTitle());
        
        Chapter chapter = chapterRepository.findById(chapterId)
            .orElseThrow(() -> new ChapterNotFoundException("Chapter not found with ID: " + chapterId));
        
        Topic topic = mapper.toTopicEntity(topicDTO);
        topic.setChapterId(chapterId);
        Topic saved = topicRepository.save(topic);
        
        // Add topic to chapter
        chapter.getTopicIds().add(saved.getId());
        chapterRepository.save(chapter);
        
        log.info("Admin: Successfully created topic with ID: {}", saved.getId());
        return mapper.toTopicDTO(saved);
    }
    
    /**
     * Update existing topic
     */
    @Transactional
    @CacheEvict(value = {CacheConfig.TOPICS_CACHE, CacheConfig.TOPIC_BY_ID_CACHE, 
                         CacheConfig.CHAPTERS_CACHE, CacheConfig.CHAPTER_BY_ID_CACHE}, allEntries = true)
    public TopicDTO updateTopic(String topicId, TopicDTO topicDTO) {
        log.info("Admin: Updating topic with ID: {}", topicId);
        
        Topic existing = topicRepository.findById(topicId)
            .orElseThrow(() -> new TopicNotFoundException("Topic not found with ID: " + topicId));
        
        existing.setTitle(topicDTO.getTitle());
        existing.setContent(topicDTO.getContent());
        
        Topic updated = topicRepository.save(existing);
        
        log.info("Admin: Successfully updated topic {}", topicId);
        return mapper.toTopicDTO(updated);
    }
    
    /**
     * Delete topic (removes from chapter and deletes associated quiz)
     */
    @Transactional
    @CacheEvict(value = {CacheConfig.TOPICS_CACHE, CacheConfig.TOPIC_BY_ID_CACHE, 
                         CacheConfig.CHAPTERS_CACHE, CacheConfig.CHAPTER_BY_ID_CACHE,
                         CacheConfig.COURSE_STATS_CACHE, CacheConfig.DASHBOARD_STATS_CACHE}, allEntries = true)
    public void deleteTopic(String topicId) {
        log.info("Admin: Deleting topic with ID: {}", topicId);
        
        Topic topic = topicRepository.findById(topicId)
            .orElse(null);
        
        if (topic == null) {
            log.warn("Admin: Topic {} not found, skipping deletion", topicId);
            return;
        }
        
        // Note: Quizzes are now at chapter level, not topic level
        
        // Remove topic from chapter
        if (topic.getChapterId() != null) {
            chapterRepository.findById(topic.getChapterId()).ifPresent(chapter -> {
                chapter.getTopicIds().remove(topicId);
                chapterRepository.save(chapter);
            });
        }
        
        // Delete topic
        topicRepository.deleteById(topicId);
        
        log.info("Admin: Successfully deleted topic {}", topicId);
    }
    
    // ==================== QUIZ MANAGEMENT ====================
    
    /**
     * Create a new quiz for a chapter
     */
    @Transactional
    @CacheEvict(value = {CacheConfig.QUIZZES_CACHE, CacheConfig.QUIZ_BY_ID_CACHE,
                         CacheConfig.COURSE_STATS_CACHE, CacheConfig.DASHBOARD_STATS_CACHE}, allEntries = true)
    public QuizzDTO createQuiz(String chapterId, QuizzDTO quizzDTO) {
        log.info("Admin: Creating new quiz for chapter {}", chapterId);
        
        // Check if quiz already exists for this chapter
        quizRepository.findByChapterId(chapterId).ifPresent(existingQuiz -> {
            throw new IllegalStateException("Quiz already exists for chapter: " + chapterId + ". Each chapter can only have one quiz.");
        });
        
        // Verify chapter exists
        chapterRepository.findById(chapterId)
            .orElseThrow(() -> new ChapterNotFoundException("Chapter not found with ID: " + chapterId));
        
        Quizz quiz = mapper.toQuizzEntity(quizzDTO);
        quiz.setChapterId(chapterId);
        Quizz saved = quizRepository.save(quiz);
        
        log.info("Admin: Successfully created quiz with ID: {}", saved.getId());
        return mapper.toQuizzDTO(saved);
    }
    
    /**
     * Update existing quiz
     */
    @Transactional
    @CacheEvict(value = {CacheConfig.QUIZZES_CACHE, CacheConfig.QUIZ_BY_ID_CACHE}, allEntries = true)
    public QuizzDTO updateQuiz(String quizId, QuizzDTO quizzDTO) {
        log.info("Admin: Updating quiz with ID: {}", quizId);
        
        Quizz existing = quizRepository.findById(quizId)
            .orElseThrow(() -> new QuizNotFoundException("Quiz not found with ID: " + quizId));
        
        existing.setTitle(quizzDTO.getTitle());
        Quizz quizzData = mapper.toQuizzEntity(quizzDTO);
        
        // Generate IDs for questions that don't have them
        if (quizzData.getQuestion() != null) {
            quizzData.getQuestion().forEach(question -> {
                if (question.getId() == null || question.getId().isEmpty()) {
                    question.setId(java.util.UUID.randomUUID().toString());
                }
            });
        }
        
        existing.setQuestion(quizzData.getQuestion());
        
        Quizz updated = quizRepository.save(existing);
        
        log.info("Admin: Successfully updated quiz {}", quizId);
        return mapper.toQuizzDTO(updated);
    }
    
    /**
     * Delete quiz
     */
    @Transactional
    @CacheEvict(value = {CacheConfig.QUIZZES_CACHE, CacheConfig.QUIZ_BY_ID_CACHE,
                         CacheConfig.COURSE_STATS_CACHE, CacheConfig.DASHBOARD_STATS_CACHE}, allEntries = true)
    public void deleteQuiz(String quizId) {
        log.info("Admin: Deleting quiz with ID: {}", quizId);
        
        if (!quizRepository.existsById(quizId)) {
            throw new QuizNotFoundException("Quiz not found with ID: " + quizId);
        }
        
        quizRepository.deleteById(quizId);
        
        log.info("Admin: Successfully deleted quiz {}", quizId);
    }
    
    // ==================== STATISTICS & MONITORING ====================
    
    /**
     * Get comprehensive dashboard statistics for admin (cached for 5 minutes)
     */
    @Cacheable(value = CacheConfig.DASHBOARD_STATS_CACHE, unless = "#result == null")
    public AdminDashboardStats getDashboardStats() {
        log.info("Admin: Fetching dashboard statistics");
        
        AdminUserStats userStats = getUserStatistics();
        AdminCourseStats courseStats = getCourseStatistics();
        
        return new AdminDashboardStats(userStats, courseStats);
    }
    
    /**
     * Get all user progress for monitoring
     */
    public Page<UserProgress> getAllUserProgress(Pageable pageable) {
        log.info("Admin: Fetching all user progress with pagination");
        return userProgressRepository.findAll(pageable);
    }
    
    // ==================== INNER CLASSES FOR STATISTICS ====================
    
    public record AdminUserStats(
        long totalUsers,
        long totalAdmins,
        long totalStudents
    ) {}
    
    public record AdminCourseStats(
        long totalCourses,
        long totalChapters,
        long totalTopics,
        long totalQuizzes
    ) {}
    
    public record AdminDashboardStats(
        AdminUserStats userStats,
        AdminCourseStats courseStats
    ) {}
}

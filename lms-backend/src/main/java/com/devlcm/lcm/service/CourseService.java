package com.devlcm.lcm.service;

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
import com.devlcm.lcm.exception.CourseNotFoundException;
import com.devlcm.lcm.repository.CourseRepository;
import com.devlcm.lcm.repository.ChapterRepository;
import com.devlcm.lcm.repository.TopicRepository;
import com.devlcm.lcm.repository.QuizRepository;
import com.devlcm.lcm.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * Service for course-related business logic and operations.
 */
@Service
@RequiredArgsConstructor
public class CourseService {
    private final CourseRepository courseRepository;
    private final ChapterRepository chapterRepository;
    private final TopicRepository topicRepository;
    private final QuizRepository quizRepository;
    private final UserRepository userRepository;

    // get all course from Database with pagination
    public Page<Course> getAllCourses(Pageable pageable) {
        return courseRepository.findAll(pageable);
    }

    // get all course from Database (backward compatibility)
    @Cacheable(value = CacheConfig.COURSES_CACHE, unless = "#result == null || #result.isEmpty()")
    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    // get course by it's Id
    @Cacheable(value = CacheConfig.COURSE_BY_ID_CACHE, key = "#id")
    public Optional<Course> getCourseById(String id) {
        return courseRepository.findById(id);
    }

    public List<Course> getCourseBySubject(String subject) {
        return courseRepository.findBysubjectIgnoreCase(subject);
    }

    public Page<Course> getCourseBySubject(String subject, Pageable pageable) {
        return courseRepository.findBysubjectIgnoreCase(subject, pageable);
    }

    public List<Course> searchCourses(String keyword) {
        return courseRepository.findByTitleContainingIgnoreCase(keyword);
    }

    public Page<Course> searchCourses(String keyword, Pageable pageable) {
        return courseRepository.findByTitleContainingIgnoreCase(keyword, pageable);
    }

    // create new course in DB
    @Transactional
    @CacheEvict(value = CacheConfig.COURSES_CACHE, allEntries = true)
    public Course createCourse(Course course) {
        return courseRepository.save(course);
    }

    //Update existing course in  DB
    @Transactional
    @CacheEvict(value = {CacheConfig.COURSES_CACHE, CacheConfig.COURSE_BY_ID_CACHE}, allEntries = true)
    public Course updateCourse(String id, Course updatedCourse) {
        return courseRepository.findById(id)
                .map(course -> {
                    course.setTitle(updatedCourse.getTitle());
                    course.setDescription(updatedCourse.getDescription());
                    course.setSubject(updatedCourse.getSubject());
                    course.setChapterIds(updatedCourse.getChapterIds());
                    return courseRepository.save(course);
                })
                .orElseThrow(() -> new CourseNotFoundException("Course not found with ID: " + id));
    }

    // Delete course from DB with cascading deletes
    @Transactional
    @CacheEvict(value = {CacheConfig.COURSES_CACHE, CacheConfig.COURSE_BY_ID_CACHE, 
                         CacheConfig.CHAPTERS_CACHE, CacheConfig.TOPICS_CACHE, 
                         CacheConfig.QUIZZES_CACHE}, allEntries = true)
    public void deleteCourse(String id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new CourseNotFoundException("Course not found with ID: " + id));
        
        // Cascade delete: delete all chapters, topics, quizzes
        if (course.getChapterIds() != null) {
            course.getChapterIds().forEach(chapterId -> {
                chapterRepository.findById(chapterId).ifPresent(chapter -> {
                    // Delete chapter's quiz (one per chapter)
                    quizRepository.findByChapterId(chapterId).ifPresent(quiz -> {
                        quizRepository.deleteById(quiz.getId());
                    });
                    
                    // Delete topics in chapter
                    if (chapter.getTopicIds() != null) {
                        chapter.getTopicIds().forEach(topicId -> {
                            topicRepository.deleteById(topicId);
                        });
                    }
                    chapterRepository.deleteById(chapterId);
                });
            });
        }
        
        // Remove course from all users' enrollments
        userRepository.findAll().forEach(user -> {
            if (user.getEnrolledCourseIds() != null && user.getEnrolledCourseIds().remove(id)) {
                userRepository.save(user);
            }
        });
        
        courseRepository.deleteById(id);
    }
}

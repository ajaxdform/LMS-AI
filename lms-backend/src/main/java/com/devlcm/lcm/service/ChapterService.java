package com.devlcm.lcm.service;

import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.devlcm.lcm.config.CacheConfig;
import com.devlcm.lcm.entity.Chapter;
import com.devlcm.lcm.entity.Course;
import com.devlcm.lcm.exception.ChapterNotFoundException;
import com.devlcm.lcm.exception.CourseNotFoundException;
import com.devlcm.lcm.repository.ChapterRepository;
import com.devlcm.lcm.repository.CourseRepository;
import com.devlcm.lcm.repository.TopicRepository;
import com.devlcm.lcm.repository.QuizRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChapterService {

    private final CourseRepository courseRepository;
    private final ChapterRepository chapterRepository;
    private final TopicRepository topicRepository;
    private final QuizRepository quizRepository;

    /**
     * Get a chapter by ID.
     */
    @Cacheable(value = CacheConfig.CHAPTER_BY_ID_CACHE, key = "#id")
    public java.util.Optional<Chapter> getChapterById(String id) {
        return chapterRepository.findById(id);
    }

    /**
     * Get all chapters for a course by courseId (no pagination).
     */
    @Cacheable(value = CacheConfig.CHAPTERS_CACHE, key = "#courseId", unless = "#result == null || #result.isEmpty()")
    public List<Chapter> getChaptersForCourse(String courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CourseNotFoundException("Course not found with ID: " + courseId));
        return chapterRepository.findAllById(course.getChapterIds());
    }

    /**
     * Get all chapters for a course by courseId with pagination.
     */
    public Page<Chapter> getChaptersForCourse(String courseId, Pageable pageable) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CourseNotFoundException("Course not found with ID: " + courseId));
        
        List<Chapter> allChapters = chapterRepository.findAllById(course.getChapterIds());
        
        // Manual pagination from list
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), allChapters.size());
        
        List<Chapter> pageContent = start > allChapters.size() ? 
            List.of() : allChapters.subList(start, end);
        
        return new PageImpl<>(pageContent, pageable, allChapters.size());
    }

    /**
     * Create a new chapter and attach it to a course.
     */
    @Transactional
    @CacheEvict(value = {CacheConfig.CHAPTERS_CACHE, CacheConfig.COURSES_CACHE, CacheConfig.COURSE_BY_ID_CACHE}, allEntries = true)
    public Chapter createChapterForCourse(String courseId, Chapter chapter) {
        chapter.setCourseId(courseId);

        Chapter saved = chapterRepository.save(chapter);
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CourseNotFoundException("Course not found with ID: " + courseId));
        course.getChapterIds().add(saved.getId());
        courseRepository.save(course);
        return saved; 
    }

    @Transactional
    @CacheEvict(value = {CacheConfig.CHAPTERS_CACHE, CacheConfig.CHAPTER_BY_ID_CACHE, 
                         CacheConfig.COURSES_CACHE, CacheConfig.COURSE_BY_ID_CACHE}, allEntries = true)
    public Chapter updateChapter(String id, Chapter updatedChapter) {
        return chapterRepository.findById(id)
                .map(chapter ->{
                        chapter.setTitle(updatedChapter.getTitle());
                        chapter.setDescription(updatedChapter.getDescription());
                        chapter.setCourseId(updatedChapter.getCourseId());
                        chapter.setTopicIds(updatedChapter.getTopicIds());
                        return chapterRepository.save(chapter);
                })
                .orElseThrow(() -> new ChapterNotFoundException("Chapter not found with ID: " + id));
    }

    @Transactional
    @CacheEvict(value = {CacheConfig.CHAPTERS_CACHE, CacheConfig.CHAPTER_BY_ID_CACHE, 
                         CacheConfig.TOPICS_CACHE, CacheConfig.QUIZZES_CACHE,
                         CacheConfig.COURSES_CACHE, CacheConfig.COURSE_BY_ID_CACHE}, allEntries = true)
    public void deleteChapter(String id) {
        Chapter chapter = chapterRepository.findById(id)
                .orElseThrow(() -> new ChapterNotFoundException("Chapter not found with ID: " + id));
        
        // Delete chapter's quiz (one per chapter)
        quizRepository.findByChapterId(id).ifPresent(quiz -> {
            quizRepository.deleteById(quiz.getId());
        });
        
        // Cascade delete: delete all topics in chapter
        if (chapter.getTopicIds() != null) {
            chapter.getTopicIds().forEach(topicId -> {
                topicRepository.deleteById(topicId);
            });
        }
        
        // Remove chapter from course
        Course course = courseRepository.findById(chapter.getCourseId())
                .orElse(null);
        if (course != null && course.getChapterIds() != null) {
            course.getChapterIds().remove(id);
            courseRepository.save(course);
        }
        
        chapterRepository.deleteById(id);
    }
}

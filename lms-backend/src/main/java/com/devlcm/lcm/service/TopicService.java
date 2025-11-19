package com.devlcm.lcm.service;

import java.util.List;
import java.util.Optional;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.devlcm.lcm.config.CacheConfig;
import com.devlcm.lcm.entity.Chapter;
import com.devlcm.lcm.entity.Topic;
import com.devlcm.lcm.exception.ChapterNotFoundException;
import com.devlcm.lcm.exception.TopicNotFoundException;
import com.devlcm.lcm.repository.ChapterRepository;
import com.devlcm.lcm.repository.TopicRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TopicService {

    private final ChapterRepository chapterRepository;
    private final TopicRepository topicRepository;

    @Cacheable(value = CacheConfig.TOPIC_BY_ID_CACHE, key = "#id")
    public Optional<Topic> getTopicById(String id) {
        return topicRepository.findById(id);
    }

    /**
     * Get all topics for a chapter by chapterId (no pagination).
     */
    @Cacheable(value = CacheConfig.TOPICS_CACHE, key = "#chapterId", unless = "#result == null || #result.isEmpty()")
    public List<Topic> getTopicsForChapter(String chapterId) {
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ChapterNotFoundException("Chapter not found with ID: " + chapterId));
        return topicRepository.findAllById(chapter.getTopicIds());
    }

    /**
     * Get all topics for a chapter by chapterId with pagination.
     */
    public Page<Topic> getTopicsForChapter(String chapterId, Pageable pageable) {
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ChapterNotFoundException("Chapter not found with ID: " + chapterId));
        
        List<Topic> allTopics = topicRepository.findAllById(chapter.getTopicIds());
        
        // Manual pagination from list
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), allTopics.size());
        
        List<Topic> pageContent = start > allTopics.size() ? 
            List.of() : allTopics.subList(start, end);
        
        return new PageImpl<>(pageContent, pageable, allTopics.size());
    }

    @Transactional
    @CacheEvict(value = {CacheConfig.TOPICS_CACHE, CacheConfig.TOPIC_BY_ID_CACHE, 
                         CacheConfig.CHAPTERS_CACHE, CacheConfig.CHAPTER_BY_ID_CACHE}, allEntries = true)
    public Topic updateTopic(String id, Topic updatedTopic) {
        return topicRepository.findById(id)
                .map(existing -> {
                    existing.setTitle(updatedTopic.getTitle());
                    existing.setContent(updatedTopic.getContent());
                    return topicRepository.save(existing);
                })
                .orElseThrow(() -> new TopicNotFoundException("Topic not found with ID: " + id));
    }

    @Transactional
    @CacheEvict(value = {CacheConfig.TOPICS_CACHE, CacheConfig.TOPIC_BY_ID_CACHE, 
                         CacheConfig.CHAPTERS_CACHE, CacheConfig.CHAPTER_BY_ID_CACHE}, allEntries = true)
    public void deleteTopic(String id) {
        Topic topic = topicRepository.findById(id)
                .orElseThrow(() -> new TopicNotFoundException("Topic not found with ID: " + id));
        
        // Remove topic from chapter
        Chapter chapter = chapterRepository.findById(topic.getChapterId())
                .orElse(null);
        if (chapter != null && chapter.getTopicIds() != null) {
            chapter.getTopicIds().remove(id);
            chapterRepository.save(chapter);
        }
        
        topicRepository.deleteById(id);
    }

    /**
     * Create a new topic and attach it to a chapter.
     */
    @Transactional
    @CacheEvict(value = {CacheConfig.TOPICS_CACHE, CacheConfig.CHAPTERS_CACHE, CacheConfig.CHAPTER_BY_ID_CACHE}, allEntries = true)
    public Topic createTopicForChapter(String chapterId, Topic topic) {
        topic.setChapterId(chapterId);
        Topic saved = topicRepository.save(topic);
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ChapterNotFoundException("Chapter not found with ID: " + chapterId));
        chapter.getTopicIds().add(saved.getId());
        chapterRepository.save(chapter);
        return saved;
    }
}

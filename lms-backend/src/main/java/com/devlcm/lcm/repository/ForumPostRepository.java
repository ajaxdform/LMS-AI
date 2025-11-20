package com.devlcm.lcm.repository;

import com.devlcm.lcm.entity.ForumPost;
import com.devlcm.lcm.entity.ForumCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ForumPostRepository extends MongoRepository<ForumPost, String> {
    
    // Find by course (includes null for general discussions)
    Page<ForumPost> findByCourseId(String courseId, Pageable pageable);
    
    // Find by chapter
    Page<ForumPost> findByChapterId(String chapterId, Pageable pageable);
    
    // Find by category
    Page<ForumPost> findByCategory(ForumCategory category, Pageable pageable);
    
    // Find by author
    Page<ForumPost> findByAuthorId(String authorId, Pageable pageable);
    
    // Search by title or content
    @Query("{ $or: [ { 'title': { $regex: ?0, $options: 'i' } }, { 'content': { $regex: ?0, $options: 'i' } } ] }")
    Page<ForumPost> searchByTitleOrContent(String keyword, Pageable pageable);
    
    // Find pinned posts
    Page<ForumPost> findByIsPinnedTrue(Pageable pageable);
    
    // Find resolved questions
    Page<ForumPost> findByIsResolvedTrue(Pageable pageable);
    
    // Find unanswered questions (category = QUESTION and replyCount = 0)
    @Query("{ 'category': 'QUESTION', 'replyCount': 0 }")
    Page<ForumPost> findUnansweredQuestions(Pageable pageable);
    
    // Count posts by author
    long countByAuthorId(String authorId);
    
    // Count posts by course
    long countByCourseId(String courseId);
    
    // Find recent posts ordered by lastActivityAt
    @Query("{ }")
    Page<ForumPost> findAllOrderedByActivity(Pageable pageable);
    
    // Find popular posts (high view count)
    @Query("{ }")
    Page<ForumPost> findPopularPosts(Pageable pageable);
}

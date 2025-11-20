package com.devlcm.lcm.repository;

import com.devlcm.lcm.entity.ForumReply;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ForumReplyRepository extends MongoRepository<ForumReply, String> {
    
    // Find all replies for a post
    Page<ForumReply> findByPostId(String postId, Pageable pageable);
    
    // Find all replies for a post (no pagination)
    List<ForumReply> findByPostId(String postId);
    
    // Find replies by author
    Page<ForumReply> findByAuthorId(String authorId, Pageable pageable);
    
    // Find accepted answer for a post
    Optional<ForumReply> findByPostIdAndIsAcceptedAnswerTrue(String postId);
    
    // Count replies by author
    long countByAuthorId(String authorId);
    
    // Count replies for a post
    long countByPostId(String postId);
    
    // Delete all replies for a post
    void deleteByPostId(String postId);
}

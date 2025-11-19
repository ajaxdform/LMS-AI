package com.devlcm.lcm.service;

import com.devlcm.lcm.util.InputSanitizer;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

/**
 * Service for validating and sanitizing user inputs before processing
 */
@Service
@RequiredArgsConstructor
public class ValidationService {

    private final InputSanitizer inputSanitizer;
    
    /**
     * Validate and sanitize course input
     */
    public void validateCourseInput(String title, String description) {
        if (title != null) {
            if (inputSanitizer.containsXss(title) || inputSanitizer.containsSqlInjection(title)) {
                throw new IllegalArgumentException("Invalid characters detected in course title");
            }
            if (!inputSanitizer.isValidLength(title, 3, 200)) {
                throw new IllegalArgumentException("Course title must be between 3 and 200 characters");
            }
        }
        
        if (description != null) {
            // Description can contain HTML from rich text editor, but check for XSS
            if (inputSanitizer.containsSqlInjection(description)) {
                throw new IllegalArgumentException("Invalid characters detected in course description");
            }
            if (!inputSanitizer.isValidLength(description, 10, 5000)) {
                throw new IllegalArgumentException("Course description must be between 10 and 5000 characters");
            }
        }
    }
    
    /**
     * Validate and sanitize chapter input
     */
    public void validateChapterInput(String title, String description) {
        if (title != null) {
            if (inputSanitizer.containsXss(title) || inputSanitizer.containsSqlInjection(title)) {
                throw new IllegalArgumentException("Invalid characters detected in chapter title");
            }
            if (!inputSanitizer.isValidLength(title, 3, 200)) {
                throw new IllegalArgumentException("Chapter title must be between 3 and 200 characters");
            }
        }
        
        if (description != null && !description.isEmpty()) {
            if (inputSanitizer.containsSqlInjection(description)) {
                throw new IllegalArgumentException("Invalid characters detected in chapter description");
            }
            if (!inputSanitizer.isValidLength(description, 10, 3000)) {
                throw new IllegalArgumentException("Chapter description must be between 10 and 3000 characters");
            }
        }
    }
    
    /**
     * Validate and sanitize topic input
     */
    public void validateTopicInput(String title, String content) {
        if (title != null) {
            if (inputSanitizer.containsXss(title) || inputSanitizer.containsSqlInjection(title)) {
                throw new IllegalArgumentException("Invalid characters detected in topic title");
            }
            if (!inputSanitizer.isValidLength(title, 3, 200)) {
                throw new IllegalArgumentException("Topic title must be between 3 and 200 characters");
            }
        }
        
        if (content != null && !content.isEmpty()) {
            // Content can contain HTML from rich text editor
            if (inputSanitizer.containsSqlInjection(content)) {
                throw new IllegalArgumentException("Invalid characters detected in topic content");
            }
            if (!inputSanitizer.isValidLength(content, 10, 50000)) {
                throw new IllegalArgumentException("Topic content must be between 10 and 50000 characters");
            }
        }
    }
    
    /**
     * Validate username
     */
    public void validateUsername(String username) {
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username cannot be empty");
        }
        
        if (inputSanitizer.containsXss(username) || inputSanitizer.containsSqlInjection(username)) {
            throw new IllegalArgumentException("Invalid characters detected in username");
        }
        
        if (!inputSanitizer.isValidLength(username, 3, 50)) {
            throw new IllegalArgumentException("Username must be between 3 and 50 characters");
        }
        
        // Username should only contain alphanumeric, underscores, and hyphens
        if (!username.matches("^[a-zA-Z0-9_-]+$")) {
            throw new IllegalArgumentException("Username can only contain letters, numbers, underscores, and hyphens");
        }
    }
    
    /**
     * Validate email format
     */
    public void validateEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email cannot be empty");
        }
        
        String emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
        if (!email.matches(emailRegex)) {
            throw new IllegalArgumentException("Invalid email format");
        }
        
        if (!inputSanitizer.isValidLength(email, 5, 100)) {
            throw new IllegalArgumentException("Email must be between 5 and 100 characters");
        }
    }
}

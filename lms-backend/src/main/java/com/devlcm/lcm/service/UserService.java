package com.devlcm.lcm.service;

import com.devlcm.lcm.entity.User;
import com.devlcm.lcm.entity.Course;
import com.devlcm.lcm.entity.UserRole;
import com.devlcm.lcm.exception.UserNotFoundException;
import com.devlcm.lcm.exception.CourseNotFoundException;
import com.devlcm.lcm.exception.EnrollmentException;
import com.devlcm.lcm.repository.CourseRepository;
import com.devlcm.lcm.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Service for user-related business logic and operations.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    private final CourseRepository courseRepository;
    
    private final EmailService emailService;

    /**
     * Get all users in the system with pagination.
     * @return page of users
     */
    public Page<User> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    /**
     * Get all users in the system (backward compatibility).
     * @return list of users
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Get a user by username.
     * @param username the username
     * @return optional user
     */
    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    /**
     * Get a user by Firebase UID.
     * @param firebaseUid the Firebase UID
     * @return optional user
     */
    public Optional<User> getUserByFirebaseUid(String firebaseUid) {
        return userRepository.findByFirebaseUid(firebaseUid);
    }

    /**
     * Create a new user with the given signup request and Firebase UID.
     * Handles multiple auth providers for the same email by updating Firebase UID if needed.
     * @param signupRequest the user signup data
     * @param firebaseUid the Firebase UID
     * @return the created user
     */
    public User createUser(User signupRequest, String firebaseUid) {
        // Check if user already exists with this Firebase UID
        Optional<User> existingUserByUid = userRepository.findByFirebaseUid(firebaseUid);
        if (existingUserByUid.isPresent()) {
            log.info("User already exists with Firebase UID: " + firebaseUid);
            return existingUserByUid.get(); // user already exists, just return
        }
        
        // Check if user exists with the same email but different Firebase UID
        // This happens when user signs up with email/password then tries Google (or vice versa)
        Optional<User> existingUserByEmail = userRepository.findByEmail(signupRequest.getEmail());
        if (existingUserByEmail.isPresent()) {
            User existingUser = existingUserByEmail.get();
            log.info("User exists with email {} but different Firebase UID. Updating Firebase UID from {} to {}", 
                     signupRequest.getEmail(), existingUser.getFirebaseUid(), firebaseUid);
            
            // Update the Firebase UID to support multiple auth providers
            existingUser.setFirebaseUid(firebaseUid);
            return userRepository.save(existingUser);
        }
        
        // Create new user
        User user = new User();
        user.setFirebaseUid(firebaseUid);
        user.setUsername(signupRequest.getUsername());
        user.setEmail(signupRequest.getEmail());
        user.setRole(UserRole.STUDENT);
        user.setEnrolledCourseIds(new ArrayList<>());

        return userRepository.save(user);
    }

    /**
     * Update an existing user by username.
     * @param username the username
     * @param updatedUser the updated user data
     * @return the updated user
     */
    @Transactional
    public User updateUser(String username, User updatedUser) {
        return userRepository.findByUsername(username).map(existingUser -> {
            existingUser.setUsername(updatedUser.getUsername());
            existingUser.setEmail(updatedUser.getEmail());
            existingUser.setRole(updatedUser.getRole());
            existingUser.setEnrolledCourseIds(updatedUser.getEnrolledCourseIds());
            // Update profile fields
            existingUser.setAvatar(updatedUser.getAvatar());
            existingUser.setBio(updatedUser.getBio());
            existingUser.setPhoneNumber(updatedUser.getPhoneNumber());
            // Update email preferences if present
            if (updatedUser.getEmailPreferences() != null) {
                existingUser.setEmailPreferences(updatedUser.getEmailPreferences());
            }
            return userRepository.save(existingUser);
        }).orElseThrow(() -> new UserNotFoundException("User not found with username: " + username));
    }

    /**
     * Delete a user by username.
     * @param username the username
     */
    @Transactional
    public void deleteUserByUsername(String username) {
        Optional<User> user = userRepository.findByUsername(username);
        if (user.isPresent()) {
            userRepository.deleteByUsername(username);
        } else {
            throw new UserNotFoundException("User not found with username: " + username);
        }
    }

    /**
     * Enroll a user in a course.
     * @param firebaseUid the Firebase UID
     * @param courseId the course ID
     * @return the updated user
     */
    @Transactional
    public User enrollInCourse(String firebaseUid, String courseId) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new UserNotFoundException("User not found with Firebase UID: " + firebaseUid));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CourseNotFoundException("Course not found with ID: " + courseId));

        if (user.getEnrolledCourseIds() == null) {
            user.setEnrolledCourseIds(new ArrayList<>());
        }

        if (user.getEnrolledCourseIds().contains(course.getId())) {
            throw new EnrollmentException("User is already enrolled in course with ID: " + courseId);
        }

        user.getEnrolledCourseIds().add(course.getId());
        User savedUser = userRepository.save(user);
        
        // Send enrollment notification email
        if (savedUser.getEmail() != null && !savedUser.getEmail().isEmpty()) {
            try {
                boolean enrollmentNotificationsEnabled = savedUser.getEmailPreferences() != null && 
                    savedUser.getEmailPreferences().isEnrollmentNotifications();
                emailService.sendEnrollmentNotification(
                    savedUser.getEmail(),
                    savedUser.getUsername(),
                    course.getTitle(),
                    enrollmentNotificationsEnabled
                );
            } catch (Exception e) {
                log.error("Failed to send enrollment email, but enrollment was successful", e);
            }
        }
        
        return savedUser;
    }

    /**
     * Unenroll a user from a course.
     * @param firebaseUid the Firebase UID
     * @param courseId the course ID
     * @return the updated user
     */
    @Transactional
    public User unenrollCourse(String firebaseUid, String courseId) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new UserNotFoundException("User not found with Firebase UID: " + firebaseUid));

        if (user.getEnrolledCourseIds() == null || !user.getEnrolledCourseIds().remove(courseId)) {
            throw new EnrollmentException("User was not enrolled in course with ID: " + courseId);
        }

        return userRepository.save(user);
    }

    /**
     * Get all courses a user is enrolled in (no pagination).
     * @param firebaseUid the Firebase UID
     * @return list of enrolled courses
     */
    public List<Course> getEnrolledCourses(String firebaseUid) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new UserNotFoundException("User not found with Firebase UID: " + firebaseUid));

        if (user.getEnrolledCourseIds() == null || user.getEnrolledCourseIds().isEmpty()) {
            return List.of();
        }
        return courseRepository.findAllById(user.getEnrolledCourseIds());
    }

    /**
     * Get all courses a user is enrolled in with pagination.
     * @param firebaseUid the Firebase UID
     * @param pageable pagination parameters
     * @return page of enrolled courses
     */
    public Page<Course> getEnrolledCourses(String firebaseUid, Pageable pageable) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new UserNotFoundException("User not found with Firebase UID: " + firebaseUid));

        if (user.getEnrolledCourseIds() == null || user.getEnrolledCourseIds().isEmpty()) {
            return Page.empty(pageable);
        }
        
        List<Course> allCourses = courseRepository.findAllById(user.getEnrolledCourseIds());
        
        // Manual pagination from list
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), allCourses.size());
        
        List<Course> pageContent = start > allCourses.size() ? 
            List.of() : allCourses.subList(start, end);
        
        return new PageImpl<>(pageContent, pageable, allCourses.size());
    }
}

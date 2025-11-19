package com.devlcm.lcm.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for sending email notifications.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:noreply@lms.com}")
    private String fromEmail;

    /**
     * Send enrollment notification email to user.
     * @param userEmail the user's email address
     * @param userName the user's name
     * @param courseTitle the course title
     * @param enrollmentNotificationsEnabled whether user has enabled enrollment notifications
     */
    public void sendEnrollmentNotification(String userEmail, String userName, String courseTitle, boolean enrollmentNotificationsEnabled) {
        if (!enrollmentNotificationsEnabled) {
            log.info("Enrollment notification skipped for {} - user preference disabled", userEmail);
            return;
        }
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(userEmail);
            message.setSubject("Welcome to " + courseTitle + "!");
            message.setText(buildEnrollmentEmailBody(userName, courseTitle));
            
            mailSender.send(message);
            log.info("Enrollment notification email sent to: {}", userEmail);
        } catch (Exception e) {
            log.error("Failed to send enrollment notification email to: {}", userEmail, e);
            // Don't throw exception - email failure shouldn't break enrollment
        }
    }

    /**
     * Send course completion notification email.
     * @param userEmail the user's email address
     * @param userName the user's name
     * @param courseTitle the course title
     * @param completionNotificationsEnabled whether user has enabled completion notifications
     */
    public void sendCourseCompletionNotification(String userEmail, String userName, String courseTitle, boolean completionNotificationsEnabled) {
        if (!completionNotificationsEnabled) {
            log.info("Completion notification skipped for {} - user preference disabled", userEmail);
            return;
        }
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(userEmail);
            message.setSubject("Congratulations! You've completed " + courseTitle);
            message.setText(buildCompletionEmailBody(userName, courseTitle));
            
            mailSender.send(message);
            log.info("Course completion notification email sent to: {}", userEmail);
        } catch (Exception e) {
            log.error("Failed to send completion notification email to: {}", userEmail, e);
        }
    }

    /**
     * Build the email body for enrollment notification.
     */
    private String buildEnrollmentEmailBody(String userName, String courseTitle) {
        return String.format(
            "Dear %s,\n\n" +
            "Congratulations! You have successfully enrolled in the course: %s\n\n" +
            "We're excited to have you on this learning journey. You can now access the course materials, " +
            "complete chapters, and take quizzes to track your progress.\n\n" +
            "Happy Learning!\n\n" +
            "Best regards,\n" +
            "LMS Team",
            userName, courseTitle
        );
    }

    /**
     * Build the email body for course completion notification.
     */
    private String buildCompletionEmailBody(String userName, String courseTitle) {
        return String.format(
            "Dear %s,\n\n" +
            "Congratulations on completing the course: %s!\n\n" +
            "You have successfully finished all chapters and assessments. " +
            "You can now download your certificate of completion from your dashboard.\n\n" +
            "Keep up the great work!\n\n" +
            "Best regards,\n" +
            "LMS Team",
            userName, courseTitle
        );
    }
}


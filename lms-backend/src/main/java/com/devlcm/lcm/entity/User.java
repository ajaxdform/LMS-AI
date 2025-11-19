package com.devlcm.lcm.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import com.mongodb.lang.NonNull;

@Document(collection = "users")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class User {
    @Id
    private String id;

    private String firebaseUid;

    @Indexed(unique = true)
    @NonNull
    private String username;

    private String email;

    // Password is managed by Firebase, not stored in MongoDB
    @org.springframework.data.annotation.Transient
    private String password;

    private LocalDateTime createdAt = LocalDateTime.now();

    private UserRole role = UserRole.STUDENT; // Default role is STUDENT

    // Store course IDs instead of DBRef for better performance and consistency
    private List<String> enrolledCourseIds = new ArrayList<>();
    
    // Profile information
    private String avatar = "avatar1"; // Default avatar
    private String bio;
    private String phoneNumber;
    
    // Email notification preferences
    private EmailPreferences emailPreferences = new EmailPreferences();
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmailPreferences {
        private boolean enrollmentNotifications = true;
        private boolean completionNotifications = true;
        private boolean progressReminders = true;
        private boolean marketingEmails = false;
    }
}

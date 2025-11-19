package com.devlcm.lcm.util;

import com.devlcm.lcm.entity.User;
import com.devlcm.lcm.entity.UserRole;
import com.devlcm.lcm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

/**
 * Data initialization utility
 * Uncomment @Bean to run on application startup
 */
@Configuration
@Slf4j
@RequiredArgsConstructor
public class DataInitializer {
    
    private final UserRepository userRepository;
    
    /**
     * Uncomment this method to create a default admin user on startup
     * Make sure to comment it out after first run or you'll get duplicate key errors
     */
    // @Bean
    public CommandLineRunner initAdminUser() {
        return args -> {
            // Check if admin user already exists
            if (userRepository.findByEmail("admin@lms.com").isPresent()) {
                log.info("Admin user already exists, skipping initialization");
                return;
            }
            
            // Create admin user
            // Note: This creates a database user, but Firebase authentication must be set up separately
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail("admin@lms.com");
            admin.setRole(UserRole.ADMIN);
            admin.setFirebaseUid("CHANGE_ME"); // Update this with actual Firebase UID after creating user in Firebase
            
            userRepository.save(admin);
            
            log.info("========================================");
            log.info("DEFAULT ADMIN USER CREATED");
            log.info("Email: admin@lms.com");
            log.info("Role: ADMIN");
            log.info("IMPORTANT: Update the firebaseUid field with actual Firebase UID!");
            log.info("========================================");
        };
    }
    
    /**
     * Promote an existing user to admin role
     * Uncomment and update the email to promote a user
     */
    // @Bean
    public CommandLineRunner promoteUserToAdmin() {
        return args -> {
            String emailToPromote = "shubhamsalaskar03@gmail.com"; // Change this
            
            userRepository.findByEmail(emailToPromote).ifPresentOrElse(
                user -> {
                    user.setRole(UserRole.ADMIN);
                    userRepository.save(user);
                    log.info("User {} promoted to ADMIN role", emailToPromote);
                },
                () -> log.warn("User with email {} not found", emailToPromote)
            );
        };
    }
}

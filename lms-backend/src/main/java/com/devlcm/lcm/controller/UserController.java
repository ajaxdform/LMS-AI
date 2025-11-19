package com.devlcm.lcm.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.devlcm.lcm.dto.ApiResponse;
import com.devlcm.lcm.entity.User;
import com.devlcm.lcm.service.UserService;

import org.springframework.validation.annotation.Validated;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
@Validated
public class UserController {

    private final UserService userService;

    @GetMapping(path = "/getAllUsers")
    public ResponseEntity<ApiResponse<Page<User>>> getAllUsers(
            @PageableDefault(size = 20, sort = "username") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsers(pageable)));
    }

    @GetMapping(path = "/getAllUsersList")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsersList() {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsers()));
    }

    @GetMapping(path = "/getUserById/{username}")
    public ResponseEntity<ApiResponse<User>> getUserById(
            @PathVariable @NotBlank String username) {
        User user = userService.getUserByUsername(username)
            .orElseThrow(() -> new com.devlcm.lcm.exception.UserNotFoundException("User not found: " + username));
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @GetMapping(path = "/me")
    public ResponseEntity<ApiResponse<User>> getCurrentUser() {
        // Get the Firebase UID from the security context
        String firebaseUid = (String) org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
        
        User user = userService.getUserByFirebaseUid(firebaseUid)
            .orElseThrow(() -> new com.devlcm.lcm.exception.UserNotFoundException("Current user not found"));
        
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PutMapping(path = "/updateUser/{username}")
    public ResponseEntity<ApiResponse<User>> updateUser(
            @PathVariable @NotBlank String username, 
            @Valid @RequestBody User user) {
        User updated = userService.updateUser(username, user);
        return ResponseEntity.ok(ApiResponse.success(updated, "User updated successfully"));
    }

    @DeleteMapping(path = "/deleteUser/{username}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable @NotBlank String username) {
        userService.deleteUserByUsername(username);
        return ResponseEntity.ok(ApiResponse.success(null, "User deleted successfully: " + username));
    }

    /**
     * Get email preferences for the current user.
     */
    @GetMapping(path = "/email-preferences")
    public ResponseEntity<ApiResponse<User.EmailPreferences>> getEmailPreferences() {
        String firebaseUid = (String) org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
        
        User user = userService.getUserByFirebaseUid(firebaseUid)
            .orElseThrow(() -> new com.devlcm.lcm.exception.UserNotFoundException("Current user not found"));
        
        User.EmailPreferences prefs = user.getEmailPreferences();
        if (prefs == null) {
            prefs = new User.EmailPreferences();
        }
        
        return ResponseEntity.ok(ApiResponse.success(prefs));
    }

    /**
     * Update email preferences for the current user.
     */
    @PutMapping(path = "/email-preferences")
    public ResponseEntity<ApiResponse<User.EmailPreferences>> updateEmailPreferences(
            @Valid @RequestBody User.EmailPreferences preferences) {
        String firebaseUid = (String) org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
        
        User user = userService.getUserByFirebaseUid(firebaseUid)
            .orElseThrow(() -> new com.devlcm.lcm.exception.UserNotFoundException("Current user not found"));
        
        user.setEmailPreferences(preferences);
        userService.updateUser(user.getUsername(), user);
        
        return ResponseEntity.ok(ApiResponse.success(preferences, "Email preferences updated successfully"));
    }

    /**
     * Update profile for the current user.
     */
    @PutMapping(path = "/profile")
    public ResponseEntity<ApiResponse<User>> updateProfile(@Valid @RequestBody User profileUpdate) {
        String firebaseUid = (String) org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
        
        User user = userService.getUserByFirebaseUid(firebaseUid)
            .orElseThrow(() -> new com.devlcm.lcm.exception.UserNotFoundException("Current user not found"));
        
        // Store original username before any updates
        String originalUsername = user.getUsername();
        
        // Update only allowed profile fields
        if (profileUpdate.getAvatar() != null) {
            user.setAvatar(profileUpdate.getAvatar());
        }
        if (profileUpdate.getBio() != null) {
            user.setBio(profileUpdate.getBio());
        }
        if (profileUpdate.getPhoneNumber() != null) {
            user.setPhoneNumber(profileUpdate.getPhoneNumber());
        }
        if (profileUpdate.getUsername() != null && !profileUpdate.getUsername().equals(user.getUsername())) {
            user.setUsername(profileUpdate.getUsername());
        }
        
        // Use original username to find and update the user
        User updated = userService.updateUser(originalUsername, user);
        return ResponseEntity.ok(ApiResponse.success(updated, "Profile updated successfully"));
    }
}

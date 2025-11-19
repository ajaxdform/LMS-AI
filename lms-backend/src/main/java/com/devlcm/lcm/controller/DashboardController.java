package com.devlcm.lcm.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;

import com.devlcm.lcm.dto.ApiResponse;
import com.devlcm.lcm.dto.dashboardDTO.UserDashboardDTO;
import com.devlcm.lcm.entity.User;
import com.devlcm.lcm.entity.UserRole;
import com.devlcm.lcm.service.DashboardService;
import com.devlcm.lcm.service.UserService;
import com.devlcm.lcm.util.AuthUtil;

import lombok.RequiredArgsConstructor;

/**
 * REST controller for dashboard-related operations.
 * Provides endpoints for user dashboard data and analytics.
 */
@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Validated
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserService userService;

    /**
     * Get dashboard data for the current user.
     * Uses Firebase UID from authentication context.
     * 
     * @return UserDashboardDTO containing user dashboard information
     */
    @GetMapping
    public ResponseEntity<ApiResponse<UserDashboardDTO>> getMyDashboard() {
        String firebaseUid = AuthUtil.getCurrentFirebaseUid();
        UserDashboardDTO dashboard = dashboardService.getUserDashBoard(firebaseUid);
        return ResponseEntity.ok(ApiResponse.success(dashboard));
    }

    /**
     * Get dashboard data for a specific user (admin or self-access).
     * Returns user information along with enrolled courses, progress, and quiz scores.
     * 
     * @param userId the user ID (Firebase UID)
     * @return UserDashboardDTO containing user dashboard information
     */
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserDashboardDTO>> getUserDashboard(
            @PathVariable @NotBlank String userId) {
        // Note: For admin dashboard access, userId is the Firebase UID of the target user
        // We allow access if the current user is an admin OR if they're accessing their own data
        String currentUid = AuthUtil.getCurrentFirebaseUid();
        
        // Check if accessing own data
        if (currentUid.equals(userId)) {
            UserDashboardDTO dashboard = dashboardService.getUserDashBoard(userId);
            return ResponseEntity.ok(ApiResponse.success(dashboard));
        }
        
        // Check if user is admin (check both token claim and database role)
        boolean isAdmin = AuthUtil.hasRole("ADMIN");
        
        // If not admin by token claim, check database role as fallback
        if (!isAdmin) {
            User currentUser = userService.getUserByFirebaseUid(currentUid)
                .orElseThrow(() -> new com.devlcm.lcm.exception.UserNotFoundException(
                    "Current user not found"));
            isAdmin = currentUser.getRole() == UserRole.ADMIN;
        }
        
        if (!isAdmin) {
            throw new com.devlcm.lcm.exception.UnauthorizedAccessException(
                "User " + currentUid + " is not authorized to access dashboard for user " + userId);
        }
        
        UserDashboardDTO dashboard = dashboardService.getUserDashBoard(userId);
        return ResponseEntity.ok(ApiResponse.success(dashboard));
    }
}


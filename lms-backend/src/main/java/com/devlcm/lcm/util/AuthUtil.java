package com.devlcm.lcm.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import com.devlcm.lcm.exception.UnauthorizedAccessException;

/**
 * Utility class for authentication and authorization operations.
 */
public class AuthUtil {

    /**
     * Get the Firebase UID from the current security context.
     * @return the Firebase UID
     * @throws UnauthorizedAccessException if user is not authenticated
     */
    public static String getCurrentFirebaseUid() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated() || 
            "anonymousUser".equals(authentication.getPrincipal())) {
            throw new UnauthorizedAccessException("User is not authenticated");
        }
        
        return (String) authentication.getPrincipal();
    }

    /**
     * Check if current user has the specified role.
     * @param role the role to check
     * @return true if user has the role
     */
    public static boolean hasRole(String role) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null) {
            return false;
        }
        
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + role.toUpperCase()));
    }

    /**
     * Verify that the current user matches the requested user ID (for authorization).
     * @param requestedUid the user ID from the request
     * @throws UnauthorizedAccessException if user doesn't match or is not admin
     */
    public static void verifyUserAccess(String requestedUid) {
        String currentUid = getCurrentFirebaseUid();
        
        // Admins can access any user's data
        if (hasRole("ADMIN")) {
            System.out.println("Admin access granted for user " + currentUid + " to access data for " + requestedUid);
            return;
        }
        
        // Users can only access their own data
        if (!currentUid.equals(requestedUid)) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            System.out.println("Access denied. Current UID: " + currentUid + ", Requested UID: " + requestedUid);
            System.out.println("Authorities: " + (auth != null ? auth.getAuthorities() : "null"));
            throw new UnauthorizedAccessException(
                "User " + currentUid + " is not authorized to access data for " + requestedUid);
        }
    }
}


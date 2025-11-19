package com.devlcm.lcm.dto;

import com.devlcm.lcm.entity.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class UserDTO {
    private String id; // MongoDB ID for updates/deletes
    
    private String firebaseUid;
    
    @NotBlank(message = "Username is mandatory")
    private String username;

    @Email(message = "Invalid email format")
    private String email;

    @Size(min = 6, message = "Password must be 6 character long")
    private String password;
    
    private UserRole role;
    
    private List<String> enrolledCourseIds;
    
    private LocalDateTime createdAt;
}

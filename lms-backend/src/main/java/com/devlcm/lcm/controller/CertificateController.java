package com.devlcm.lcm.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.validation.annotation.Validated;

import com.devlcm.lcm.dto.ApiResponse;
import com.devlcm.lcm.entity.User;
import com.devlcm.lcm.repository.UserRepository;
import com.devlcm.lcm.service.CertificateService;
import com.devlcm.lcm.util.AuthUtil;

import jakarta.validation.constraints.NotBlank;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Controller for certificate generation and download.
 */
@RestController
@RequestMapping("/api/v1/certificates")
@RequiredArgsConstructor
@Slf4j
@Validated
public class CertificateController {

    private final CertificateService certificateService;
    private final UserRepository userRepository;

    /**
     * Download certificate for current user's completed course.
     * @param courseId the course ID
     * @return PDF certificate file
     */
    @GetMapping("/course/{courseId}")
    public ResponseEntity<byte[]> downloadCertificate(
            @PathVariable @NotBlank String courseId) {
        String firebaseUid = AuthUtil.getCurrentFirebaseUid();
        
        // Get user MongoDB ID from Firebase UID
        User user = userRepository.findByFirebaseUid(firebaseUid)
            .orElseThrow(() -> new com.devlcm.lcm.exception.UserNotFoundException("User not found"));
        String userId = user.getId();
        
        byte[] certificate;
        try {
            certificate = certificateService.generateCertificate(userId, courseId);
        } catch (java.io.IOException e) {
            throw new RuntimeException("Error generating certificate", e);
        }
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "certificate_" + courseId + ".pdf");
        
        return new ResponseEntity<>(certificate, headers, HttpStatus.OK);
    }

    /**
     * Download certificate for a specific user (admin only or own user).
     * @param userId the user ID
     * @param courseId the course ID
     * @return PDF certificate file
     */
    @GetMapping("/user/{userId}/course/{courseId}")
    public ResponseEntity<byte[]> downloadUserCertificate(
            @PathVariable @NotBlank String userId,
            @PathVariable @NotBlank String courseId) {
        // Verify user access (admin or own user)
        AuthUtil.verifyUserAccess(userId);
        
        byte[] certificate;
        try {
            certificate = certificateService.generateCertificate(userId, courseId);
        } catch (java.io.IOException e) {
            throw new RuntimeException("Error generating certificate", e);
        }
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", 
            "certificate_" + userId + "_" + courseId + ".pdf");
        
        return new ResponseEntity<>(certificate, headers, HttpStatus.OK);
    }

    /**
     * Check if a course is completed for the current user.
     * @param courseId the course ID
     * @return true if completed
     */
    @GetMapping("/course/{courseId}/check")
    public ResponseEntity<ApiResponse<Boolean>> checkCourseCompletion(
            @PathVariable @NotBlank String courseId) {
        String firebaseUid = AuthUtil.getCurrentFirebaseUid();
        User user = userRepository.findByFirebaseUid(firebaseUid)
            .orElseThrow(() -> new com.devlcm.lcm.exception.UserNotFoundException("User not found"));
        String userId = user.getId();
        boolean isCompleted = certificateService.isCourseCompleted(userId, courseId);
        return ResponseEntity.ok(ApiResponse.success(isCompleted));
    }
}


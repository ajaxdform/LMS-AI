package com.devlcm.lcm.service;

import com.devlcm.lcm.entity.ForumAttachment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Service for handling file uploads and storage for forum attachments
 */
@Service
@Slf4j
public class FileStorageService {
    
    @Value("${file.upload-dir:uploads/forum}")
    private String uploadDir;
    
    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;
    
    /**
     * Upload multiple files and return ForumAttachment objects
     */
    public List<ForumAttachment> uploadFiles(MultipartFile[] files) {
        List<ForumAttachment> attachments = new ArrayList<>();
        
        // Create upload directory if it doesn't exist
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
        } catch (IOException e) {
            log.error("Failed to create upload directory", e);
            throw new RuntimeException("Could not create upload directory");
        }
        
        for (MultipartFile file : files) {
            if (file.isEmpty()) {
                continue;
            }
            
            try {
                // Generate unique filename
                String originalFilename = file.getOriginalFilename();
                String extension = "";
                if (originalFilename != null && originalFilename.contains(".")) {
                    extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                }
                String uniqueFilename = UUID.randomUUID().toString() + extension;
                
                // Save file
                Path filePath = Paths.get(uploadDir).resolve(uniqueFilename);
                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                
                // Create attachment object
                String fileUrl = baseUrl + "/api/v1/forum/files/" + uniqueFilename;
                ForumAttachment attachment = new ForumAttachment();
                attachment.setFileName(originalFilename);
                attachment.setFileUrl(fileUrl);
                attachment.setFileType(file.getContentType());
                attachment.setFileSize(file.getSize());
                attachment.setUploadedAt(LocalDateTime.now());
                
                attachments.add(attachment);
                log.info("File uploaded successfully: {} -> {}", originalFilename, uniqueFilename);
                
            } catch (IOException e) {
                log.error("Failed to upload file: {}", file.getOriginalFilename(), e);
                throw new RuntimeException("Failed to upload file: " + file.getOriginalFilename());
            }
        }
        
        return attachments;
    }
    
    /**
     * Get file by filename
     */
    public Path getFile(String filename) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(filename).normalize();
            if (Files.exists(filePath)) {
                return filePath;
            } else {
                throw new RuntimeException("File not found: " + filename);
            }
        } catch (Exception e) {
            log.error("Failed to retrieve file: {}", filename, e);
            throw new RuntimeException("Failed to retrieve file: " + filename);
        }
    }
    
    /**
     * Delete file by filename
     */
    public void deleteFile(String filename) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(filename).normalize();
            Files.deleteIfExists(filePath);
            log.info("File deleted: {}", filename);
        } catch (IOException e) {
            log.error("Failed to delete file: {}", filename, e);
        }
    }
}

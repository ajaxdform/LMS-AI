package com.devlcm.lcm.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Represents a file attachment in a forum post or reply
 * Supports images, PDFs, PPTs, and other study materials
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ForumAttachment {
    
    private String fileName;
    private String fileUrl;         // URL where file is stored (could be cloud storage)
    private String fileType;        // MIME type (e.g., image/png, application/pdf)
    private long fileSize;          // Size in bytes
    private LocalDateTime uploadedAt = LocalDateTime.now();
    
    /**
     * Get file extension from filename
     */
    public String getFileExtension() {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
    }
    
    /**
     * Check if attachment is an image
     */
    public boolean isImage() {
        return fileType != null && fileType.startsWith("image/");
    }
    
    /**
     * Check if attachment is a document
     */
    public boolean isDocument() {
        if (fileType == null) return false;
        return fileType.equals("application/pdf") 
            || fileType.contains("word")
            || fileType.contains("powerpoint")
            || fileType.contains("presentation");
    }
    
    /**
     * Get human-readable file size
     */
    public String getFormattedFileSize() {
        if (fileSize < 1024) {
            return fileSize + " B";
        } else if (fileSize < 1024 * 1024) {
            return String.format("%.1f KB", fileSize / 1024.0);
        } else {
            return String.format("%.1f MB", fileSize / (1024.0 * 1024.0));
        }
    }
}

package com.devlcm.lcm.util;

import org.springframework.stereotype.Component;
import org.owasp.encoder.Encode;

import java.util.regex.Pattern;

/**
 * Utility class for sanitizing and validating user inputs
 */
@Component
public class InputSanitizer {

    private static final Pattern HTML_TAG_PATTERN = Pattern.compile("<[^>]*>");
    private static final Pattern SQL_INJECTION_PATTERN = Pattern.compile("('.*(\\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\\b).*)|(;\\s*(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE))", Pattern.CASE_INSENSITIVE);
    private static final Pattern XSS_PATTERN = Pattern.compile("(<script[^>]*>.*?</script>)|(<iframe[^>]*>.*?</iframe>)|(javascript:)|(onerror=)|(onload=)", Pattern.CASE_INSENSITIVE);
    
    /**
     * Sanitize HTML content (for rich text fields like course descriptions)
     * Allows safe HTML tags while encoding dangerous ones
     */
    public String sanitizeHtml(String input) {
        if (input == null || input.isEmpty()) {
            return input;
        }
        
        // For now, we allow HTML from ReactQuill but encode JavaScript
        // In production, consider using a library like OWASP Java HTML Sanitizer
        String sanitized = input;
        
        // Remove script tags and event handlers
        sanitized = sanitized.replaceAll("<script[^>]*>.*?</script>", "");
        sanitized = sanitized.replaceAll("javascript:", "");
        sanitized = sanitized.replaceAll("on\\w+\\s*=", ""); // Remove event handlers like onclick=
        
        return sanitized;
    }
    
    /**
     * Sanitize plain text input (for titles, usernames, etc.)
     */
    public String sanitizePlainText(String input) {
        if (input == null || input.isEmpty()) {
            return input;
        }
        
        // Remove all HTML tags
        String sanitized = HTML_TAG_PATTERN.matcher(input).replaceAll("");
        
        // Encode special characters
        sanitized = Encode.forHtml(sanitized);
        
        return sanitized.trim();
    }
    
    /**
     * Validate input for SQL injection attempts
     */
    public boolean containsSqlInjection(String input) {
        if (input == null || input.isEmpty()) {
            return false;
        }
        return SQL_INJECTION_PATTERN.matcher(input).find();
    }
    
    /**
     * Validate input for XSS attempts
     */
    public boolean containsXss(String input) {
        if (input == null || input.isEmpty()) {
            return false;
        }
        return XSS_PATTERN.matcher(input).find();
    }
    
    /**
     * Sanitize email input
     */
    public String sanitizeEmail(String email) {
        if (email == null || email.isEmpty()) {
            return email;
        }
        return email.trim().toLowerCase();
    }
    
    /**
     * Validate if string length is within bounds
     */
    public boolean isValidLength(String input, int minLength, int maxLength) {
        if (input == null) {
            return false;
        }
        int length = input.length();
        return length >= minLength && length <= maxLength;
    }
}

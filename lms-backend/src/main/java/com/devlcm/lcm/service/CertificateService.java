package com.devlcm.lcm.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import com.devlcm.lcm.entity.Course;
import com.devlcm.lcm.entity.User;
import com.devlcm.lcm.exception.CourseNotFoundException;
import com.devlcm.lcm.exception.UserNotFoundException;
import com.devlcm.lcm.repository.CourseRepository;
import com.devlcm.lcm.repository.UserProgressRepository;
import com.devlcm.lcm.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for generating course completion certificates.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class CertificateService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final UserProgressRepository userProgressRepository;

    /**
     * Check if a user has completed a course (all chapters completed).
     * @param userId the user ID
     * @param courseId the course ID
     * @return true if course is completed
     */
    public boolean isCourseCompleted(String userId, String courseId) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new CourseNotFoundException("Course not found with ID: " + courseId));

        if (course.getChapterIds() == null || course.getChapterIds().isEmpty()) {
            return false;
        }

        return userProgressRepository.findByUserIdAndCourseId(userId, courseId)
            .map(progress -> {
                int totalChapters = course.getChapterIds().size();
                int completedChapters = progress.getCompletedChapterIds() != null 
                    ? progress.getCompletedChapterIds().size() 
                    : 0;
                return completedChapters == totalChapters && totalChapters > 0;
            })
            .orElse(false);
    }

    /**
     * Generate a PDF certificate for course completion.
     * @param userId the user ID
     * @param courseId the course ID
     * @return byte array of the PDF certificate
     * @throws IOException if PDF generation fails
     */
    public byte[] generateCertificate(String userId, String courseId) throws IOException {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));

        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new CourseNotFoundException("Course not found with ID: " + courseId));

        if (!isCourseCompleted(userId, courseId)) {
            throw new IllegalStateException("Course is not completed. Cannot generate certificate.");
        }

        return createCertificatePDF(user, course);
    }

    /**
     * Create the PDF certificate document.
     */
    private byte[] createCertificatePDF(User user, Course course) throws IOException {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                // Set up fonts
                var titleFont = new PDType1Font(Standard14Fonts.FontName.TIMES_BOLD);
                var headingFont = new PDType1Font(Standard14Fonts.FontName.TIMES_BOLD);
                var bodyFont = new PDType1Font(Standard14Fonts.FontName.TIMES_ROMAN);

                float pageWidth = page.getMediaBox().getWidth();
                float pageHeight = page.getMediaBox().getHeight();
                float margin = 50;

                // Title
                String title = "CERTIFICATE OF COMPLETION";
                float titleWidth = titleFont.getStringWidth(title) / 1000 * 24;
                float titleX = (pageWidth - titleWidth) / 2;
                contentStream.beginText();
                contentStream.setFont(titleFont, 24);
                contentStream.newLineAtOffset(titleX, pageHeight - 100);
                contentStream.showText(title);
                contentStream.endText();

                // Subtitle
                String subtitle = "This is to certify that";
                float subtitleWidth = bodyFont.getStringWidth(subtitle) / 1000 * 14;
                float subtitleX = (pageWidth - subtitleWidth) / 2;
                contentStream.beginText();
                contentStream.setFont(bodyFont, 14);
                contentStream.newLineAtOffset(subtitleX, pageHeight - 150);
                contentStream.showText(subtitle);
                contentStream.endText();

                // User name
                String userName = user.getUsername() != null ? user.getUsername() : "Student";
                float nameWidth = headingFont.getStringWidth(userName) / 1000 * 20;
                float nameX = (pageWidth - nameWidth) / 2;
                contentStream.beginText();
                contentStream.setFont(headingFont, 20);
                contentStream.newLineAtOffset(nameX, pageHeight - 200);
                contentStream.showText(userName);
                contentStream.endText();

                // Course completion text
                String completionText = "has successfully completed the course";
                float textWidth = bodyFont.getStringWidth(completionText) / 1000 * 14;
                float textX = (pageWidth - textWidth) / 2;
                contentStream.beginText();
                contentStream.setFont(bodyFont, 14);
                contentStream.newLineAtOffset(textX, pageHeight - 250);
                contentStream.showText(completionText);
                contentStream.endText();

                // Course title
                String courseTitle = course.getTitle() != null ? course.getTitle() : "Course";
                float courseWidth = headingFont.getStringWidth(courseTitle) / 1000 * 18;
                float courseX = (pageWidth - courseWidth) / 2;
                contentStream.beginText();
                contentStream.setFont(headingFont, 18);
                contentStream.newLineAtOffset(courseX, pageHeight - 300);
                contentStream.showText(courseTitle);
                contentStream.endText();

                // Date
                String dateText = "Date: " + LocalDate.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy"));
                float dateWidth = bodyFont.getStringWidth(dateText) / 1000 * 12;
                float dateX = (pageWidth - dateWidth) / 2;
                contentStream.beginText();
                contentStream.setFont(bodyFont, 12);
                contentStream.newLineAtOffset(dateX, pageHeight - 400);
                contentStream.showText(dateText);
                contentStream.endText();

                // Signature line
                String signatureText = "LMS Team";
                float sigWidth = bodyFont.getStringWidth(signatureText) / 1000 * 12;
                float sigX = pageWidth - margin - sigWidth;
                contentStream.beginText();
                contentStream.setFont(bodyFont, 12);
                contentStream.newLineAtOffset(sigX, pageHeight - 500);
                contentStream.showText(signatureText);
                contentStream.endText();
            }

            // Save to byte array
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }
}


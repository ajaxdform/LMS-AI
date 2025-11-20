# Forum Attachment Feature

## Overview
Users can now attach files (images, PDFs, PowerPoints, Word documents) to forum posts. This feature enables sharing of study materials, screenshots, and relevant documents within discussions.

## Supported File Types

### Images
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### Documents
- PDF (.pdf)
- PowerPoint (.ppt, .pptx)
- Word (.doc, .docx)

### File Size Limits
- Maximum file size per attachment: **10 MB**
- Multiple files can be attached to a single post

## How It Works

### Backend Implementation

#### 1. New Entity: ForumAttachment
Located: `lms-backend/src/main/java/com/devlcm/lcm/entity/ForumAttachment.java`

```java
public class ForumAttachment {
    private String fileName;        // Original filename
    private String fileUrl;         // URL to download the file
    private String fileType;        // MIME type
    private long fileSize;          // Size in bytes
    private LocalDateTime uploadedAt;
}
```

Includes helper methods:
- `getFileExtension()` - Extract file extension
- `isImage()` - Check if attachment is an image
- `isDocument()` - Check if attachment is a document
- `getFormattedFileSize()` - Human-readable size (KB/MB)

#### 2. File Storage Service
Located: `lms-backend/src/main/java/com/devlcm/lcm/service/FileStorageService.java`

**Upload Process:**
1. Creates upload directory if it doesn't exist (default: `uploads/forum`)
2. Generates unique filename using UUID + original extension
3. Saves file to local filesystem
4. Returns ForumAttachment object with download URL

**Configuration:**
```properties
# application.properties
file.upload-dir=uploads/forum
app.base-url=http://localhost:8080
```

#### 3. API Endpoints

**Upload Files:**
```
POST /api/v1/forum/upload
Content-Type: multipart/form-data
Parameter: files (MultipartFile[])

Response:
{
  "success": true,
  "message": "Files uploaded successfully",
  "data": [
    {
      "fileName": "diagram.png",
      "fileUrl": "http://localhost:8080/api/v1/forum/files/abc123.png",
      "fileType": "image/png",
      "fileSize": 245678,
      "uploadedAt": "2024-01-15T10:30:00"
    }
  ]
}
```

**Download File:**
```
GET /api/v1/forum/files/{filename}

Returns: File as binary stream (attachment download)
```

#### 4. Updated DTOs

**ForumPostDTO:**
- Added `attachments` field: `List<ForumAttachment>`

**CreateForumPostRequest:**
- Added `attachments` field: `List<ForumAttachment>`

#### 5. Updated ForumService
- `createPost()` now copies attachments from request to entity
- `toDTO()` includes attachments in response

### Frontend Implementation

#### 1. Create Post Page (CreateForumPost.jsx)

**New State:**
```javascript
const [attachments, setAttachments] = useState([]);
```

**File Selection:**
- File input with drag-and-drop support
- Accepts: `.jpg, .jpeg, .png, .gif, .webp, .pdf, .ppt, .pptx, .doc, .docx`
- Client-side validation:
  - Max file size: 10MB
  - Allowed MIME types check
  - Shows toast warnings for invalid files

**File Preview:**
- Shows list of selected files before upload
- Displays file name, size, and type icon
- Remove button to deselect files

**Upload Flow:**
1. User selects files
2. Clicks "Create Post"
3. Files uploaded first via `/forum/upload` endpoint
4. Returns attachment metadata
5. Post created with attachment metadata included

#### 2. Post Detail Page (ForumPostDetail.jsx)

**Attachments Display:**
- Shows attachment count and icon (📎)
- Each attachment displayed as a card with:
  - Type-specific icon (🖼️ images, 📄 PDFs, 📊 presentations, 📝 documents)
  - File name (truncated if long)
  - File size
  - Download icon (⬇)
- Click to download in new tab

## Usage Example

### Creating a Post with Attachments

1. Navigate to forum
2. Click "Create New Post"
3. Fill in title and content
4. Click the attachment upload area
5. Select files (images, PDFs, etc.)
6. Review selected files in preview
7. Click "Create Post"
8. Files are uploaded and post is created

### Viewing Attachments

1. Open any forum post
2. Scroll to attachments section (below content)
3. Click any attachment to download/view

## Technical Details

### File Storage

**Current Implementation:**
- Local filesystem storage
- Files stored in `uploads/forum/` directory
- Unique filenames using UUID to prevent conflicts
- Original filenames preserved in metadata

**Future Enhancements:**
- Cloud storage integration (AWS S3, Azure Blob, Google Cloud Storage)
- MongoDB GridFS for database-integrated storage
- CDN integration for faster delivery
- Image thumbnail generation
- Virus scanning for security

### Security Considerations

**Implemented:**
- File type validation (MIME type checking)
- File size limits (10MB per file)
- Unique filename generation (prevents path traversal)
- Authentication required for upload

**Recommended for Production:**
- Virus/malware scanning
- Content-Type verification (not just extension)
- Rate limiting on upload endpoint
- CORS configuration
- File access permissions (only enrolled users?)
- Periodic cleanup of orphaned files

### Database Schema

**ForumPost Collection:**
```javascript
{
  "_id": ObjectId("..."),
  "title": "How to use React hooks?",
  "content": "I'm attaching a diagram...",
  "attachments": [
    {
      "fileName": "react-hooks-diagram.png",
      "fileUrl": "http://localhost:8080/api/v1/forum/files/uuid.png",
      "fileType": "image/png",
      "fileSize": 245678,
      "uploadedAt": ISODate("2024-01-15T10:30:00Z")
    }
  ],
  // ... other fields
}
```

## Testing

### Manual Testing Steps

1. **Upload Valid Files:**
   - Create post with 1-3 attachments
   - Verify files appear in post detail
   - Download each attachment

2. **File Type Validation:**
   - Try uploading .exe file → Should show error
   - Try uploading .txt file → Should show error

3. **File Size Validation:**
   - Try uploading file > 10MB → Should show error

4. **Multiple Files:**
   - Upload 5 different file types
   - Verify all display correctly

5. **Post Without Attachments:**
   - Create post without attachments
   - Verify no attachment section shown

### API Testing with Postman

**Upload Files:**
```
POST http://localhost:8080/api/v1/forum/upload
Headers:
  Authorization: Bearer <your-jwt-token>
Body: form-data
  files: [select multiple files]
```

**Create Post with Attachments:**
```
POST http://localhost:8080/api/v1/forum/posts
Headers:
  Authorization: Bearer <your-jwt-token>
  Content-Type: application/json
Body:
{
  "title": "Test Post",
  "content": "With attachments",
  "category": "RESOURCE_SHARING",
  "attachments": [
    {
      "fileName": "test.pdf",
      "fileUrl": "http://localhost:8080/api/v1/forum/files/uuid.pdf",
      "fileType": "application/pdf",
      "fileSize": 123456,
      "uploadedAt": "2024-01-15T10:30:00"
    }
  ]
}
```

## Future Enhancements

1. **Image Preview:** Display image thumbnails inline in posts
2. **Drag & Drop:** Drag files directly onto content area
3. **Progress Bar:** Show upload progress for large files
4. **File Categories:** Filter/group attachments by type
5. **Cloud Storage:** Integrate AWS S3 or similar
6. **Compression:** Auto-compress large images
7. **Reply Attachments:** Allow attachments in replies too
8. **Gallery View:** Grid view for multiple images
9. **Edit Attachments:** Add/remove attachments when editing posts
10. **File Search:** Search posts by attachment name/type

## Configuration

### Backend Configuration (application.properties)

```properties
# File Upload Settings
file.upload-dir=uploads/forum
app.base-url=http://localhost:8080

# Spring File Upload (Optional - adjust limits)
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=50MB
```

### Frontend Configuration

Maximum file size is defined in `CreateForumPost.jsx`:
```javascript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

Allowed MIME types:
```javascript
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
```

## Troubleshooting

### Files Not Uploading
- Check file size < 10MB
- Verify file type is allowed
- Check network console for errors
- Ensure JWT token is valid

### Files Not Downloading
- Verify file exists in `uploads/forum/` directory
- Check file permissions
- Ensure backend is running
- Check browser console for CORS errors

### Upload Directory Not Created
- Ensure backend has write permissions
- Check `file.upload-dir` configuration
- Manually create directory if needed

## Architecture Decisions

### Why Local File Storage?
- Simple to implement
- No external dependencies
- Good for development/MVP
- Easy to migrate to cloud later

### Why Separate Upload Endpoint?
- Allows validation before post creation
- Better error handling
- Reusable for reply attachments
- Progress tracking possible

### Why Store Metadata in MongoDB?
- Keeps attachment info with post
- Efficient querying
- No need for separate file database
- Easy to display in UI

## Summary

The forum attachment feature is now fully functional, allowing users to:
- ✅ Upload images, PDFs, PowerPoints, and documents
- ✅ Attach multiple files to a single post
- ✅ View and download attachments from posts
- ✅ See file type icons and sizes
- ✅ Client-side validation for file types and sizes

The implementation is production-ready for basic usage but can be enhanced with cloud storage, image thumbnails, and additional security measures for large-scale deployment.

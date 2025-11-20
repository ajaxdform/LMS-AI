# Quick Start: Testing Forum Attachments

## Prerequisites
- Backend running on `http://localhost:8080`
- Frontend running on `http://localhost:5173`
- Logged in as a user

## Test Steps

### 1. Create a Post with Attachments

1. **Navigate to Forum**
   - Go to `http://localhost:5173/forum`

2. **Create New Post**
   - Click "Create New Post" button

3. **Fill Post Details**
   - Title: "Testing File Attachments"
   - Content: "This is a test post with various file types attached."
   - Category: "Resource Sharing"

4. **Add Attachments**
   - Click on the file upload area (with 📁 icon)
   - Select multiple files:
     - 1 image file (.jpg, .png, .gif)
     - 1 PDF file
     - 1 PowerPoint file (.ppt or .pptx)
   
5. **Verify File Preview**
   - Check that selected files appear below upload area
   - Verify file names and sizes are shown
   - Verify correct icons for each file type
   - Try removing a file using the × button

6. **Submit Post**
   - Click "✨ Create Post" button
   - Wait for upload (may take a few seconds for large files)
   - Should redirect to post detail page

### 2. View Post with Attachments

1. **Check Attachments Section**
   - Scroll to attachments section below post content
   - Should see "📎 Attachments (X)" header
   - Each attachment should show:
     - Type icon (🖼️ for images, 📄 for PDFs, etc.)
     - File name
     - File size
     - Download icon (⬇)

2. **Download Attachments**
   - Click on any attachment card
   - File should download or open in new tab
   - Verify file is correct and not corrupted

### 3. Test Validation

1. **File Size Validation**
   - Try uploading a file larger than 10MB
   - Should see warning toast: "filename is too large (max 10MB)"
   - File should not be added to selection

2. **File Type Validation**
   - Try uploading a .txt or .exe file
   - Should see warning toast: "filename has an unsupported file type"
   - File should not be added to selection

3. **Multiple Files**
   - Upload 5 different files at once
   - All should be accepted and shown in preview
   - All should be included in created post

### 4. Edge Cases

1. **Post Without Attachments**
   - Create a post without any attachments
   - Attachments section should not appear in post detail

2. **Large Files**
   - Upload a 9MB file (just under limit)
   - Should work fine but may take longer

3. **Special Characters in Filenames**
   - Upload file with spaces: "My Document.pdf"
   - Upload file with symbols: "Report-2024_final.pdf"
   - Both should work correctly

## Expected Results

### ✅ Success Indicators
- Files upload without errors
- Post is created successfully
- Attachments appear in post detail page
- Files can be downloaded
- File icons match file types
- File sizes are displayed correctly
- Validation works for invalid files

### ❌ Common Issues

#### Upload Fails
- **Check:** Backend logs for errors
- **Check:** Network tab in browser dev tools
- **Check:** JWT token is valid (not expired)
- **Solution:** Restart backend if needed

#### Files Not Appearing
- **Check:** Response from `/forum/posts` API includes attachments
- **Check:** Browser console for JavaScript errors
- **Solution:** Clear browser cache and reload

#### Download Fails (404)
- **Check:** File exists in `uploads/forum/` directory
- **Check:** `fileUrl` in database has correct path
- **Solution:** Verify `app.base-url` in application.properties

#### "Upload Directory Not Created"
- **Check:** Backend has write permissions
- **Solution:** Manually create `uploads/forum/` directory

## API Testing with Postman

### 1. Upload Files

```
POST http://localhost:8080/api/v1/forum/upload
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
Body: form-data
  files: [Select multiple files]

Expected Response (200 OK):
{
  "success": true,
  "message": "Files uploaded successfully",
  "data": [
    {
      "fileName": "example.pdf",
      "fileUrl": "http://localhost:8080/api/v1/forum/files/UUID.pdf",
      "fileType": "application/pdf",
      "fileSize": 123456,
      "uploadedAt": "2024-01-15T10:30:00"
    }
  ]
}
```

### 2. Create Post with Attachments

```
POST http://localhost:8080/api/v1/forum/posts
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
Body:
{
  "title": "Test Post",
  "content": "Post with attachments",
  "category": "RESOURCE_SHARING",
  "attachments": [
    {
      "fileName": "example.pdf",
      "fileUrl": "http://localhost:8080/api/v1/forum/files/UUID.pdf",
      "fileType": "application/pdf",
      "fileSize": 123456,
      "uploadedAt": "2024-01-15T10:30:00"
    }
  ]
}

Expected Response (201 Created):
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "id": "post_id",
    "title": "Test Post",
    "content": "Post with attachments",
    "attachments": [...],
    // ... other fields
  }
}
```

### 3. Get Post with Attachments

```
GET http://localhost:8080/api/v1/forum/posts/{postId}
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN

Expected Response (200 OK):
{
  "success": true,
  "message": "Post retrieved successfully",
  "data": {
    "id": "post_id",
    "title": "Test Post",
    "attachments": [
      {
        "fileName": "example.pdf",
        "fileUrl": "http://localhost:8080/api/v1/forum/files/UUID.pdf",
        "fileType": "application/pdf",
        "fileSize": 123456,
        "uploadedAt": "2024-01-15T10:30:00"
      }
    ],
    // ... other fields
  }
}
```

### 4. Download File

```
GET http://localhost:8080/api/v1/forum/files/{filename}

Expected Response: File binary data (automatic download)
```

## Verification Checklist

- [ ] Can create post without attachments
- [ ] Can create post with 1 attachment
- [ ] Can create post with multiple attachments (3-5 files)
- [ ] Image files display correct icon (🖼️)
- [ ] PDF files display correct icon (📄)
- [ ] PowerPoint files display correct icon (📊)
- [ ] Word files display correct icon (📝)
- [ ] File sizes are displayed correctly
- [ ] Can download each attachment
- [ ] Downloaded files are not corrupted
- [ ] File > 10MB shows validation error
- [ ] Unsupported file type shows validation error
- [ ] Can remove file from selection before upload
- [ ] Upload progress completes successfully
- [ ] Post detail page shows all attachments
- [ ] Attachments section hidden when no attachments
- [ ] Multiple users can upload files simultaneously

## Performance Testing

### Test Large Files
1. Upload 5 files of 5MB each (25MB total)
2. Should complete within reasonable time (depends on connection)
3. Check backend logs for any memory issues

### Test Many Small Files
1. Upload 20 small image files (100KB each)
2. Should handle without errors
3. Verify all files saved correctly

## Database Verification

### Check MongoDB
```javascript
// Connect to MongoDB
use lms03_db

// Find posts with attachments
db.forumPosts.find({ "attachments.0": { $exists: true } }).pretty()

// Verify attachment structure
db.forumPosts.findOne({ "attachments.0": { $exists: true } }, { attachments: 1 })

// Expected structure:
{
  "attachments": [
    {
      "fileName": "example.pdf",
      "fileUrl": "http://localhost:8080/api/v1/forum/files/UUID.pdf",
      "fileType": "application/pdf",
      "fileSize": 123456,
      "uploadedAt": ISODate("2024-01-15T10:30:00.000Z")
    }
  ]
}
```

### Check File System
```bash
# Windows PowerShell
cd lms-backend
dir uploads/forum

# Should see uploaded files with UUID filenames
```

## Troubleshooting Guide

### Issue: "Failed to upload attachments"

**Possible Causes:**
1. Backend not running
2. Upload directory permissions
3. File too large
4. Invalid JWT token

**Solutions:**
1. Start backend: `mvn spring-boot:run`
2. Create directory: `mkdir -p uploads/forum`
3. Check file size < 10MB
4. Login again to get fresh token

### Issue: "Failed to create post"

**Possible Causes:**
1. Validation errors
2. Network timeout
3. Database connection issue

**Solutions:**
1. Check title and content not empty
2. Check browser console for errors
3. Verify MongoDB connection in backend logs

### Issue: Files not downloading (404)

**Possible Causes:**
1. File deleted from filesystem
2. Incorrect file URL
3. File not found

**Solutions:**
1. Check files exist in `uploads/forum/`
2. Verify `app.base-url` configuration
3. Check backend logs for errors

## Success Criteria

The feature is working correctly if:

1. ✅ Users can upload images, PDFs, PowerPoints, and Word documents
2. ✅ Files are validated for size and type
3. ✅ Posts are created with attachment metadata
4. ✅ Attachments display correctly in post detail page
5. ✅ Files can be downloaded without errors
6. ✅ No console errors in browser or backend
7. ✅ File storage is working (files saved to disk)
8. ✅ Database contains attachment metadata

## Next Steps

After successful testing:
1. Test with different users
2. Test from mobile devices
3. Monitor backend performance under load
4. Consider cloud storage migration for production
5. Implement virus scanning if going to production
6. Add image preview/thumbnails
7. Allow attachments in replies

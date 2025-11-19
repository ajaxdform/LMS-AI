# Pagination Quick Reference Guide

## 🎯 New Paginated Endpoints

### Courses
```bash
# Get all courses (paginated) - default 20/page
GET /api/v1/courses?page=0&size=20&sort=title,asc

# Search courses by keyword (paginated)
GET /api/v1/courses/search/paginated?q=java&page=0&size=10

# Get courses by subject (paginated)
GET /api/v1/courses/subject/Mathematics/paginated?page=0&size=20
```

### Chapters
```bash
# Get chapters for a course (paginated) - default 10/page
GET /api/v1/chapters/{courseId}/chapters/paginated?page=0&size=10
```

### Topics
```bash
# Get topics for a chapter (paginated) - default 10/page
GET /api/v1/topics/{chapterId}/topics/paginated?page=0&size=10
```

### Enrollments
```bash
# Get my enrolled courses (paginated) - default 10/page
GET /api/v1/enrollments/courses/paginated?page=0&size=10

# Get user's enrolled courses (paginated)
GET /api/v1/enrollments/{firebaseUid}/courses/paginated?page=0&size=10
```

### User Progress
```bash
# Get all progress for user (paginated) - default 10/page
GET /api/v1/user-progress/all/{userId}/paginated?page=0&size=10&sort=lastUpdated,desc
```

## 📊 Response Structure

```json
{
  "success": true,
  "data": {
    "content": [...],
    "totalPages": 5,
    "totalElements": 47,
    "size": 10,
    "number": 0,
    "first": true,
    "last": false
  }
}
```

## 🔧 Query Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `page` | No | 0 | Zero-indexed page number |
| `size` | No | 10 or 20 | Items per page |
| `sort` | No | varies | Format: `field,direction` (e.g., `title,asc`) |

## 💡 Frontend Example (JavaScript)

```javascript
// Fetch paginated courses
async function getCourses(page = 0, size = 20) {
  const response = await fetch(
    `http://localhost:8080/api/v1/courses?page=${page}&size=${size}&sort=title,asc`,
    {
      headers: {
        'Authorization': `Bearer ${firebaseToken}`
      }
    }
  );
  const data = await response.json();
  return data.data; // Page object
}

// Example usage
const page = await getCourses(0, 20);
console.log(`Total courses: ${page.totalElements}`);
console.log(`Current page: ${page.number + 1} of ${page.totalPages}`);
page.content.forEach(course => console.log(course.title));
```

## ✅ Backward Compatibility

All existing non-paginated endpoints still work:
- `/api/v1/courses/all` - Returns all courses as list
- `/api/v1/chapters/{courseId}/chapters` - Returns all chapters
- `/api/v1/topics/{chapterId}/topics` - Returns all topics
- `/api/v1/enrollments/courses` - Returns all enrolled courses
- `/api/v1/user-progress/all/{userId}` - Returns all progress

Choose paginated endpoints for better performance with large datasets!

# API Reference Guide

## Base Configuration

**Base URL:** `http://localhost:8080`

**Authentication:** Bearer Token (Firebase JWT)

**Content-Type:** `application/json`

---

## Authentication Endpoints

### Register User

**POST** `/public/signup`

**Description:** Creates a new user account

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response:** `201 Created`
```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "createdAt": "datetime"
}
```

**Usage:**
```javascript
const response = await api.post("/public/signup", {
  username: "john_doe",
  email: "john@example.com",
  password: "password123"
});
```

---

## Dashboard Endpoints

### Get User Dashboard

**GET** `/dashboard`

**Description:** Retrieves user dashboard data including enrolled courses, progress, and quiz scores

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "enrolledCourses": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "subject": "string"
    }
  ],
  "completedTopics": 0,
  "averageQuizScore": 85.5
}
```

**Usage:**
```javascript
const response = await api.get("/dashboard");
const dashboardData = response.data;
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token
- `500 Internal Server Error` - Server error

---

## Course Endpoints

### Get All Courses

**GET** `/courses/all`

**Description:** Retrieves a list of all available courses

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
[
  {
    "id": "string",
    "title": "string",
    "description": "string",
    "subject": "string"
  }
]
```

**Usage:**
```javascript
const response = await api.get("/courses/all");
const courses = response.data;
```

---

### Get Course by ID

**GET** `/courses/{id}`

**Description:** Retrieves detailed information about a specific course

**Path Parameters:**
- `id` (string) - Course ID

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "subject": "string"
}
```

**Usage:**
```javascript
const courseId = "123";
const response = await api.get(`/courses/${courseId}`);
const course = response.data;
```

**Error Responses:**
- `404 Not Found` - Course not found
- `401 Unauthorized` - Invalid token

---

### Search Courses

**GET** `/courses/search?q={keyword}`

**Description:** Searches for courses by keyword

**Query Parameters:**
- `q` (string) - Search keyword

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
[
  {
    "id": "string",
    "title": "string",
    "description": "string",
    "subject": "string"
  }
]
```

**Usage:**
```javascript
const keyword = "javascript";
const response = await api.get(`/courses/search?q=${encodeURIComponent(keyword)}`);
const results = response.data;
```

---

## Enrollment Endpoints

### Get Enrolled Courses

**GET** `/enrollments/courses`

**Description:** Retrieves all courses the current user is enrolled in

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
[
  {
    "id": "string",
    "title": "string",
    "description": "string",
    "subject": "string"
  }
]
```

**Usage:**
```javascript
const response = await api.get("/enrollments/courses");
const enrolledCourses = response.data;
```

---

### Enroll in Course

**POST** `/enrollments/courses/{courseId}/enroll`

**Description:** Enrolls the current user in a course

**Path Parameters:**
- `courseId` (string) - Course ID to enroll in

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "message": "User enrolled in course successfully."
}
```

**Usage:**
```javascript
const courseId = "123";
await api.post(`/enrollments/courses/${courseId}/enroll`);
```

**Error Responses:**
- `400 Bad Request` - Already enrolled or invalid course
- `401 Unauthorized` - Invalid token
- `404 Not Found` - Course not found

---

### Unenroll from Course

**DELETE** `/enrollments/courses/{courseId}/enroll`

**Description:** Unenrolls the current user from a course

**Path Parameters:**
- `courseId` (string) - Course ID to unenroll from

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "message": "User unenrolled from course successfully."
}
```

**Usage:**
```javascript
const courseId = "123";
await api.delete(`/enrollments/courses/${courseId}/enroll`);
```

**Error Responses:**
- `400 Bad Request` - Not enrolled or invalid course
- `401 Unauthorized` - Invalid token
- `404 Not Found` - Course not found

---

## Error Handling

### Standard Error Response

```json
{
  "message": "Error description",
  "status": 400,
  "timestamp": "2024-11-08T10:30:00Z"
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error |

---

## Axios Configuration

### Request Interceptor

Automatically adds authentication token to all requests:

```javascript
api.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    const token = await currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Response Interceptor

Handles token refresh on 401 errors:

```javascript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Refresh token and retry
      const newToken = await currentUser.getIdToken(true);
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

## Usage Examples

### Complete Enrollment Flow

```javascript
// 1. Get all courses
const coursesResponse = await api.get("/courses/all");
const courses = coursesResponse.data;

// 2. Get course details
const courseResponse = await api.get(`/courses/${courseId}`);
const course = courseResponse.data;

// 3. Enroll in course
await api.post(`/enrollments/courses/${courseId}/enroll`);

// 4. Verify enrollment
const enrolledResponse = await api.get("/enrollments/courses");
const enrolledCourses = enrolledResponse.data;
```

### Error Handling Example

```javascript
try {
  const response = await api.get("/dashboard");
  setData(response.data);
} catch (error) {
  if (error.response) {
    // Server responded with error
    console.error("Error:", error.response.status, error.response.data);
  } else if (error.request) {
    // Request made but no response
    console.error("Network error:", error.message);
  } else {
    // Something else happened
    console.error("Error:", error.message);
  }
}
```

---

## Testing with Postman

### Setup

1. **Base URL:** `http://localhost:8080`
2. **Authorization:** Bearer Token
3. **Get Token:** Use Firebase Auth or login endpoint

### Example Request

```
GET http://localhost:8080/dashboard
Headers:
  Authorization: Bearer <your-firebase-token>
```

---

## Rate Limiting

Currently no rate limiting is implemented. Consider implementing for production.

---

## CORS Configuration

Backend is configured to accept requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Alternative port)
- `http://127.0.0.1:5173` (IP variant)

---

## Notes

- All authenticated endpoints require a valid Firebase JWT token
- Tokens expire after 1 hour (Firebase default)
- Token refresh is handled automatically by axios interceptors
- Always handle errors appropriately in UI
- Use loading states for better UX


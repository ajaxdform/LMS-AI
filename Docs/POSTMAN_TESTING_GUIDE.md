# Postman Testing Guide for LMS Application

## Overview
This application uses **Firebase Authentication** for securing endpoints. Most endpoints require a valid Firebase ID token in the Authorization header.

## Prerequisites
1. **Postman** installed
2. **Firebase project** configured (you already have the Firebase config file)
3. **Application running** (typically on `http://localhost:8080`)

---

## Step 1: Get a Firebase ID Token

You have two options to get a Firebase token:

### Option A: Using Firebase Console (Recommended for Testing)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`lms-auth-3dbe0`)
3. Go to **Authentication** → **Users**
4. Create a test user or use an existing one
5. You'll need to use Firebase Admin SDK or Firebase Client SDK to get the token

### Option B: Using Firebase Client SDK (JavaScript/Web)
```javascript
// In browser console or a test HTML page
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  // Your Firebase config
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

signInWithEmailAndPassword(auth, 'user@example.com', 'password')
  .then((userCredential) => {
    userCredential.user.getIdToken().then(token => {
      console.log('Token:', token);
      // Copy this token to Postman
    });
  });
```

### Option C: Using Firebase REST API
```bash
# Step 1: Sign in with email/password
POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_API_KEY
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password",
  "returnSecureToken": true
}

# Response will contain "idToken" - use this in Postman
```

---

## Step 2: Set Up Postman Environment

1. **Create a new Environment** in Postman:
   - Click on "Environments" → "Create Environment"
   - Name it: `LMS Local`
   - Add variables:
     - `base_url`: `http://localhost:8080`
     - `firebase_token`: `YOUR_FIREBASE_ID_TOKEN_HERE`

2. **Set Authorization at Collection Level** (Optional but recommended):
   - Create a new Collection: "LMS API"
   - Go to Collection → Authorization tab
   - Type: `Bearer Token`
   - Token: `{{firebase_token}}`
   - This will apply to all requests in the collection

---

## Step 3: Testing Endpoints

### Public Endpoints (No Authentication Required)

#### 1. Sign Up (Create User)
```
POST {{base_url}}/public/signup
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "username": "newuser",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Postman Setup:**
- Method: `POST`
- URL: `http://localhost:8080/public/signup`
- Headers:
  - `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "email": "test@example.com",
  "password": "password123",
  "username": "testuser",
  "firstName": "Test",
  "lastName": "User"
}
```

---

### Protected Endpoints (Authentication Required)

For all protected endpoints, you need to add the Authorization header:

**Header:**
- Key: `Authorization`
- Value: `Bearer YOUR_FIREBASE_ID_TOKEN`

---

### Course Endpoints

#### 1. Get All Courses (Paginated)
```
GET {{base_url}}/courses?page=0&size=20
Authorization: Bearer {{firebase_token}}
```

#### 2. Get All Courses (List)
```
GET {{base_url}}/courses/all
Authorization: Bearer {{firebase_token}}
```

#### 3. Get Course by ID
```
GET {{base_url}}/courses/{courseId}
Authorization: Bearer {{firebase_token}}
```

#### 4. Search Courses
```
GET {{base_url}}/courses/search?q=keyword
Authorization: Bearer {{firebase_token}}
```

#### 5. Create Course
```
POST {{base_url}}/courses
Authorization: Bearer {{firebase_token}}
Content-Type: application/json

{
  "title": "Introduction to Java",
  "description": "Learn Java programming",
  "subject": "Programming",
  "instructor": "John Doe"
}
```

#### 6. Update Course
```
PUT {{base_url}}/courses/{courseId}
Authorization: Bearer {{firebase_token}}
Content-Type: application/json

{
  "title": "Updated Course Title",
  "description": "Updated description"
}
```

#### 7. Delete Course
```
DELETE {{base_url}}/courses/{courseId}
Authorization: Bearer {{firebase_token}}
```

---

### User Endpoints

#### 1. Get All Users (Paginated)
```
GET {{base_url}}/users/getAllUsers?page=0&size=20
Authorization: Bearer {{firebase_token}}
```

#### 2. Get All Users (List)
```
GET {{base_url}}/users/getAllUsersList
Authorization: Bearer {{firebase_token}}
```

#### 3. Get User by Username
```
GET {{base_url}}/users/getUserById/{username}
Authorization: Bearer {{firebase_token}}
```

#### 4. Update User
```
PUT {{base_url}}/users/updateUser/{username}
Authorization: Bearer {{firebase_token}}
Content-Type: application/json

{
  "firstName": "Updated",
  "lastName": "Name"
}
```

#### 5. Delete User
```
DELETE {{base_url}}/users/deleteUser/{username}
Authorization: Bearer {{firebase_token}}
```

---

### Enrollment Endpoints

#### 1. Enroll in Course
```
POST {{base_url}}/enrollments/courses/{courseId}/enroll
Authorization: Bearer {{firebase_token}}
```

#### 2. Enroll User in Course
```
POST {{base_url}}/enrollments/{firebaseUid}/courses/{courseId}/enroll
Authorization: Bearer {{firebase_token}}
```

#### 3. Unenroll from Course
```
DELETE {{base_url}}/enrollments/courses/{courseId}/enroll
Authorization: Bearer {{firebase_token}}
```

#### 4. Get User Enrollments
```
GET {{base_url}}/enrollments/courses
Authorization: Bearer {{firebase_token}}
```

---

### Chapter Endpoints

#### 1. Create Chapter
```
POST {{base_url}}/chapters/{courseId}
Authorization: Bearer {{firebase_token}}
Content-Type: application/json

{
  "title": "Chapter 1",
  "description": "Introduction"
}
```

#### 2. Get Chapters for Course
```
GET {{base_url}}/chapters/{courseId}/chapters
Authorization: Bearer {{firebase_token}}
```

#### 3. Update Chapter
```
PUT {{base_url}}/chapters/{id}/chapters
Authorization: Bearer {{firebase_token}}
Content-Type: application/json

{
  "title": "Updated Chapter Title"
}
```

#### 4. Delete Chapter
```
DELETE {{base_url}}/chapters/{id}
Authorization: Bearer {{firebase_token}}
```

---

### Topic Endpoints

#### 1. Create Topic
```
POST {{base_url}}/topics/{chapterId}/topics
Authorization: Bearer {{firebase_token}}
Content-Type: application/json

{
  "title": "Topic 1",
  "content": "Topic content here"
}
```

#### 2. Get Topics for Chapter
```
GET {{base_url}}/topics/{chapterId}/topics
Authorization: Bearer {{firebase_token}}
```

#### 3. Get Topic by ID
```
GET {{base_url}}/topics/{id}
Authorization: Bearer {{firebase_token}}
```

#### 4. Update Topic
```
PUT {{base_url}}/topics/{id}
Authorization: Bearer {{firebase_token}}
Content-Type: application/json

{
  "title": "Updated Topic"
}
```

#### 5. Delete Topic
```
DELETE {{base_url}}/topics/{id}
Authorization: Bearer {{firebase_token}}
```

---

### Quiz Endpoints

#### 1. Create Quiz
```
POST {{base_url}}/quizzes/{topicId}
Authorization: Bearer {{firebase_token}}
Content-Type: application/json

{
  "title": "Quiz 1",
  "description": "Test your knowledge"
}
```

#### 2. Get Quiz by Topic
```
GET {{base_url}}/quizzes/topicId/{topicId}
Authorization: Bearer {{firebase_token}}
```

#### 3. Add Questions to Quiz
```
POST {{base_url}}/quizzes/{quizzId}/questions
Authorization: Bearer {{firebase_token}}
Content-Type: application/json

{
  "questionText": "What is Java?",
  "options": ["Language", "Framework", "Library"],
  "correctAnswer": 0
}
```

#### 4. Submit Quiz
```
POST {{base_url}}/quizzes/{quizzId}/submit
Authorization: Bearer {{firebase_token}}
Content-Type: application/json

{
  "answers": [0, 1, 2]
}
```

---

### Dashboard Endpoints

#### 1. Get Dashboard
```
GET {{base_url}}/dashboard
Authorization: Bearer {{firebase_token}}
```

#### 2. Get User Dashboard
```
GET {{base_url}}/dashboard/{userId}
Authorization: Bearer {{firebase_token}}
```

---

### User Progress Endpoints

#### 1. Mark Chapter as Completed
```
POST {{base_url}}/user-progress/chapter/completed
Authorization: Bearer {{firebase_token}}
Content-Type: application/json

{
  "userId": "user123",
  "chapterId": "chapter456"
}
```

#### 2. Record Quiz Result
```
POST {{base_url}}/user-progress/quizz/record
Authorization: Bearer {{firebase_token}}
Content-Type: application/json

{
  "userId": "user123",
  "quizzId": "quiz789",
  "score": 85
}
```

#### 3. Get User Progress
```
GET {{base_url}}/user-progress
Authorization: Bearer {{firebase_token}}
```

#### 4. Get All Progress for User
```
GET {{base_url}}/user-progress/all/{userId}
Authorization: Bearer {{firebase_token}}
```

#### 5. Get Progress Percentage
```
GET {{base_url}}/user-progress/percentage/{userId}/{courseId}
Authorization: Bearer {{firebase_token}}
```

---

## Step 4: Common Issues & Solutions

### Issue 1: 401 Unauthorized
**Solution:** 
- Verify your Firebase token is valid and not expired
- Check that the token is prefixed with "Bearer " (with a space)
- Ensure the token is in the Authorization header

### Issue 2: 403 Forbidden (Admin endpoints)
**Solution:**
- Admin endpoints require `ROLE_ADMIN` in Firebase custom claims
- Set custom claims in Firebase:
  ```javascript
  // Using Firebase Admin SDK
  admin.auth().setCustomUserClaims(uid, { role: 'ADMIN' });
  ```

### Issue 3: Token Expired
**Solution:**
- Firebase tokens expire after 1 hour
- Get a new token using one of the methods in Step 1
- Consider using Postman's Pre-request Script to auto-refresh tokens

### Issue 4: CORS Errors
**Solution:**
- If testing from a browser, ensure CORS is configured in your Spring Boot app
- For Postman, CORS is not an issue

---

## Step 5: Postman Collection Setup (Advanced)

### Pre-request Script (Auto Token Refresh)
You can add this to your collection's Pre-request Script to automatically refresh tokens:

```javascript
// This is a placeholder - you'd need to implement actual token refresh
// For now, manually update the token when it expires
pm.environment.set("firebase_token", "YOUR_TOKEN_HERE");
```

### Test Scripts (Example)
Add this to test successful responses:

```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response time is less than 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});
```

---

## Quick Start Checklist

- [ ] Application is running on `http://localhost:8080`
- [ ] Firebase project is configured
- [ ] Created a test user in Firebase
- [ ] Obtained a Firebase ID token
- [ ] Created Postman environment with `base_url` and `firebase_token`
- [ ] Tested public endpoint: `/public/signup`
- [ ] Tested protected endpoint with Authorization header

---

## Testing Workflow Example

1. **First, create a user:**
   ```
   POST /public/signup
   ```

2. **Get Firebase token** for the created user

3. **Set token in Postman environment**

4. **Test authenticated endpoints:**
   ```
   GET /courses
   POST /courses
   GET /users/getAllUsers
   ```

5. **Test enrollment:**
   ```
   POST /enrollments/courses/{courseId}/enroll
   ```

6. **Test progress tracking:**
   ```
   POST /user-progress/chapter/completed
   GET /user-progress
   ```

---

## Additional Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Postman Documentation](https://learning.postman.com/docs/)
- [Spring Boot REST API Testing](https://spring.io/guides/tutorials/rest/)

---

**Note:** Replace `{{base_url}}` and `{{firebase_token}}` with actual values or set them as environment variables in Postman.


# LMS Backend - Complete Project Mapping

**Generated:** Auto-analyzed codebase structure  
**Purpose:** Comprehensive understanding of backend architecture, data models, and API flows

---

## 🏗️ Architecture Overview

### Technology Stack
- **Framework:** Spring Boot 3.5.6 (Java 24)
- **Database:** MongoDB (Cloud Atlas cluster)
- **Authentication:** Firebase Admin SDK (token-based)
- **Security:** Spring Security with custom filter chain
- **Documentation:** springdoc-openapi (Swagger UI)
- **Mapping:** MapStruct for DTO ↔ Entity conversions
- **PDF Generation:** Apache PDFBox for certificates
- **Email:** Spring Mail with SMTP
- **Build Tool:** Maven

### Data Model Pattern
**Reference-based architecture** (not embedded documents):
- `Course` → references `chapterIds` (List<String>)
- `Chapter` → references `topicIds` (List<String>)
- `Topic` → references `quizzIds` (List<String>)
- `Quizz` → embeds `Questions` (List<Questions>)
- `User` → references `enrolledCourseIds` (List<String>)

This avoids deeply nested JSON and improves scalability.

---

## 📦 Package Structure

### 1. **config/** - Application Configuration

#### `SecurityConfig.java`
- **Purpose:** Spring Security setup with CORS and authorization rules
- **Key Features:**
  - CORS allows `localhost:5173`, `localhost:3000` origins
  - Public endpoints: `/api/v1/public/signup`, swagger docs, health check
  - Protected: `/admin/**` (ROLE_ADMIN), all `/api/v1/**` (authenticated)
  - Registers `FirebaseAuthFilter` before username/password auth
  - Security headers: CSP, HSTS, XSS protection, frame deny

#### `FirebaseConfig.java`
- **Purpose:** Initialize Firebase Admin SDK on startup
- **Implementation:** Loads service account JSON from `resources/firebase/` and initializes FirebaseApp
- **Note:** Prevents re-initialization if already done

#### `OpenApiConfig.java` (if exists)
- **Purpose:** Swagger/OpenAPI configuration bean
- Exposes docs at `/swagger-ui/`, `/v3/api-docs`

---

### 2. **filter/** - Request Interceptors

#### `FirebaseAuthFilter.java`
- **Purpose:** Authenticate every request using Firebase token
- **Flow:**
  1. Extract `Authorization: Bearer <token>` header
  2. Verify token with `FirebaseAuth.getInstance().verifyIdToken(token)`
  3. Extract `uid` (principal) and `role` claim (defaults to "STUDENT")
  4. Create `UsernamePasswordAuthenticationToken` with authority `ROLE_<ROLE>`
  5. Set in `SecurityContextHolder`
- **Result:** All authenticated requests have `firebaseUid` as principal and role-based authorities

---

### 3. **entity/** - Domain Models (MongoDB Documents)

#### `User.java`
```java
@Document(collection = "users")
- id: String (MongoDB _id)
- firebaseUid: String (from Firebase Auth)
- username: String (@Indexed unique)
- email: String
- password: @Transient (stored in Firebase, not MongoDB)
- createdAt: LocalDateTime
- role: String ("STUDENT", "ADMIN")
- enrolledCourseIds: List<String> (course references)
```

#### `Course.java`
```java
@Document(collection = "courses")
- id: String
- title: String (@NonNull)
- description: String
- subject: String
- chapterIds: List<String> (references to chapters)
```

#### `Chapter.java`
```java
@Document(collection = "chapters")
- id: String
- title: String
- description: String
- courseId: String (parent reference)
- topicIds: List<String>
```

#### `Topic.java`
```java
@Document(collection = "topics")
- id: String (UUID generated)
- title: String
- content: String
- chapterId: String
- quizzIds: List<String>
```

#### `Quizz.java` (QuizzAndQuestions package)
```java
@Document(collection = "quizzes")
- id: String
- title: String
- topicId: String
- question: List<Questions> (embedded)
```

#### `Questions.java` (embedded in Quizz)
```java
- id: String
- questionText: String
- options: List<String>
- correctOptionIndex: int
```

#### `QuizzResult.java`
```java
@Document(collection = "quizz_results")
- id: String
- userId: String
- topicId: String
- score: int
- totalQuestions: int
- passed: boolean
- submittedAt: LocalDateTime
```

#### `UserProgress.java`
```java
@Document(collection = "user_progress")
- id: String
- userId: String
- courseId: String
- completedChapterIds: Set<String>
- quizzScore: Map<String, Integer> (quizzId → score)
- lastUpdated: Date
```

---

### 4. **repository/** - Data Access Layer

All extend `MongoRepository<T, String>`:

- **`UserRepository`** - `findByUsername`, `findByFirebaseUid`, `findByEmail`, `deleteByUsername`
- **`CourseRepository`** - `findByTitle`, `findBysubjectIgnoreCase`, `findByTitleContainingIgnoreCase`
- **`ChapterRepository`** - Standard CRUD (MongoRepository)
- **`TopicRepository`** - Standard CRUD
- **`QuizRepository`** - `findByTopicId`, `findByTitleContainingIgnoreCase`
- **`UserProgressRepository`** - `findByUserIdAndCourseId`, `findByUserId`
- **`QuizzResultRepo`** - Standard CRUD

---

### 5. **service/** - Business Logic

#### `UserService.java`
**Responsibilities:** User lifecycle, enrollment management
- `createUser(User, firebaseUid)` - creates user in MongoDB after Firebase signup
- `updateUser(username, User)` - update user details
- `deleteUserByUsername(username)` - delete user
- `enrollInCourse(firebaseUid, courseId)` - add course to user's `enrolledCourseIds`, send email
- `unenrollCourse(firebaseUid, courseId)` - remove course from enrollments
- `getEnrolledCourses(firebaseUid)` - fetch Course objects for enrolled IDs

**Dependencies:** `UserRepository`, `CourseRepository`, `EmailService`

#### `CourseService.java`
**Responsibilities:** Course CRUD and hierarchy management
- `getAllCourses()` / `getAllCourses(Pageable)` - list courses
- `getCourseById(id)`, `getCourseBySubject(subject)`, `searchCourses(keyword)`
- `createCourse(Course)`, `updateCourse(id, Course)`, `deleteCourse(id)`
- **Cascade delete:** when deleting course, also deletes all chapters → topics → quizzes and removes from user enrollments

**Dependencies:** `CourseRepository`, `ChapterRepository`, `TopicRepository`, `QuizRepository`, `UserRepository`

#### `ChapterService.java`
**Responsibilities:** Chapter CRUD and topic attachment
- `getChaptersForCourse(courseId)` - fetch chapters for a course
- `createChapterForCourse(courseId, Chapter)` - save chapter and add its ID to course
- `updateChapter(id, Chapter)`
- `deleteChapter(id)` - cascade delete topics/quizzes, remove from course

#### `TopicService.java`
**Responsibilities:** Topic CRUD and quiz attachment
- `getTopicsForChapter(chapterId)` - fetch topics for a chapter
- `createTopicForChapter(chapterId, Topic)` - save topic and add ID to chapter
- `updateTopic(id, Topic)`
- `deleteTopic(id)` - cascade delete quizzes, remove from chapter

#### `QuizzService.java`
**Responsibilities:** Quiz creation, question management, submission
- `createQuiz(topicId, Quizz)` - save quiz and add ID to topic
- `getQuizzByTopicId(topicId)`
- `addQuestionsToQuizz(quizzId, Questions)` - append question to quiz
- `submitQuizz(quizzId, QuizzSubmissionDTO)` - grade quiz, save result, record progress

**Grading Logic:** Compare user answers with `correctOptionIndex`, calculate score, mark passed if score ≥ 50%

#### `UserProgressService.java`
**Responsibilities:** Track chapter completion and quiz scores
- `markedChapterCompleted(userId, courseId, chapterId)` - add chapter to completed set, check course completion
- `recoredQuizzScore(userId, courseId, quizzId, score)` - store quiz score
- `getUserProgress(userId, courseId)`, `getAllProgressForUser(userId)`
- `getCourseProgressPercentage(userId, courseId, totalChapters)` - calculate % complete
- **Side effect:** Sends course completion email when all chapters are done

#### `CertificateService.java`
**Responsibilities:** Generate PDF certificates
- `isCourseCompleted(userId, courseId)` - check if all chapters completed
- `generateCertificate(userId, courseId)` - create PDF with user name, course title, completion date using PDFBox

#### `EmailService.java`
**Responsibilities:** Send transactional emails
- `sendEnrollmentNotification(email, name, courseTitle)` - welcome email on enrollment
- `sendCourseCompletionNotification(email, name, courseTitle)` - congrats email on completion

**Configuration:** Uses `spring.mail.*` properties (Gmail SMTP, app password)

#### `DashboardService.java`
**Responsibilities:** Aggregate user dashboard data
- `getUserDashBoard(userIdOrFirebaseUid)` - returns `UserDashboardDTO` with:
  - User info (username, email)
  - List of enrolled courses with:
    - Progress percentage (completed chapters / total)
    - Average quiz score

---

### 6. **controller/** - REST API Endpoints

#### `PublicController.java` (`/api/v1/public`)
- **POST `/signup`** - Create Firebase user + MongoDB user record (no auth required)

#### `UserController.java` (`/api/v1/users`)
- **GET `/getAllUsers`** - paginated user list
- **GET `/getAllUsersList`** - all users (no pagination)
- **GET `/getUserById/{username}`** - get user by username
- **PUT `/updateUser/{username}`** - update user
- **DELETE `/deleteUser/{username}`** - delete user

#### `CourseController.java` (`/api/v1/courses`)
- **GET `/`** - paginated courses
- **GET `/all`** - all courses
- **GET `/{id}`** - course by ID
- **GET `/subject/{subject}`** - courses by subject
- **GET `/search?q={keyword}`** - search courses
- **POST `/`** - create course
- **PUT `/{id}`** - update course
- **DELETE `/{id}`** - delete course (cascade)

#### `ChapterController.java` (`/api/v1/chapters`)
- **POST `/{courseId}`** - create chapter for course
- **GET `/{courseId}/chapters`** - get chapters for course
- **PUT `/{id}/chapters`** - update chapter
- **DELETE `/{id}`** - delete chapter

#### `TopicController.java` (`/api/v1/topics`)
- **POST `/{chapterId}/topics`** - create topic for chapter
- **GET `/{chapterId}/topics`** - get topics for chapter
- **GET `/{id}`** - get topic by ID
- **PUT `/{id}`** - update topic
- **DELETE `/{id}`** - delete topic

#### `QuizzController.java` (`/api/v1/quizzes`)
- **POST `/{topicId}`** - create quiz for topic
- **GET `/topicId/{topicId}`** - get quiz by topic
- **POST `/{quizzId}/questions`** - add question to quiz
- **POST `/{quizzId}/submit`** - submit quiz answers (grades and records)

#### `EnrollmentController.java` (`/api/v1/enrollments`)
- **POST `/courses/{courseId}/enroll`** - enroll current user
- **POST `/{firebaseUid}/courses/{courseId}/enroll`** - enroll specific user
- **DELETE `/courses/{courseId}/enroll`** - unenroll current user
- **DELETE `/{firebaseUid}/courses/{courseId}/enroll`** - unenroll specific user
- **GET `/courses`** - get current user's enrolled courses
- **GET `/{firebaseUid}/courses`** - get specific user's courses

#### `UserProgressController.java` (`/api/v1/user-progress`)
- **POST `/chapter/completed`** - mark chapter as completed
- **POST `/quizz/record`** - record quiz score
- **GET `/?userId={}&courseId={}`** - get progress for user+course
- **GET `/all/{userId}`** - get all progress for user
- **GET `/percentage/{userId}/{courseId}`** - get completion percentage

#### `DashboardController.java` (`/api/v1/dashboard`)
- **GET `/`** - get current user's dashboard
- **GET `/{userId}`** - get specific user's dashboard

#### `CertificateController.java` (`/api/v1/certificates`) (if exists)
- Certificate generation endpoints (download PDF)

---

### 7. **dto/** - Data Transfer Objects

All DTOs use `@Valid`, `@NotBlank`, `@Email`, `@Size` annotations for validation:

- **`UserDTO`** - username, email, password (for signup)
- **`CourseDTO`** - id, title, description, subject
- **`ChapterDTO`** - chapter details
- **`TopicDTO`** - topic details
- **`QuizzDTO`** - quiz details
- **`QuizzSubmissionDTO`** - userId, courseId, topicId, answers (Map<questionId, answer>)
- **`ApiResponse<T>`** - standardized wrapper (success, message, data, errorCode, requestId, timestamp)
- **`UserDashboardDTO`** - user info + list of `CourseDashBoardDTO`
- **`CourseDashBoardDTO`** - courseId, title, subject, progressPercentage, averageQuizScore

---

### 8. **mapper/** - DTO ↔ Entity Conversion

#### `AllMapper.java` (MapStruct interface)
- `toUserDTO(User)`, `toUserEntity(UserDTO)`
- `toCourseDTO(Course)`, `toCourseEntity(CourseDTO)`
- `toChapterDTO(Chapter)`, `toChapterEntity(ChapterDTO)`
- `toTopicDTO(Topic)`, `toTopicEntity(TopicDTO)`
- `toQuizzDTO(Quizz)`, `toQuizzEntity(QuizzDTO)`

MapStruct generates implementation at compile-time.

---

### 9. **exception/** - Error Handling

#### Custom Exceptions
- `UserNotFoundException`
- `CourseNotFoundException`
- `ChapterNotFoundException`
- `TopicNotFoundException`
- `QuizNotFoundException`
- `EnrollmentException`
- `UnauthorizedAccessException`

#### `GlobalExceptionHandler.java` (@ControllerAdvice)
Catches exceptions and returns standardized `ApiResponse` with:
- HTTP status codes (404, 400, 403, 500)
- Error codes (e.g., "USER_NOT_FOUND", "VALIDATION_ERROR")
- Request ID from MDC
- Field-level validation errors for `@Valid` failures

---

### 10. **util/** - Utility Classes

#### `AuthUtil.java`
Static helper methods:
- `getCurrentFirebaseUid()` - extract Firebase UID from SecurityContext
- `hasRole(String role)` - check if current user has role
- `verifyUserAccess(String requestedUid)` - verify user can access resource (self or admin)

---

## 🔄 Key Runtime Flows

### 1. **User Signup Flow**
```
Client → POST /api/v1/public/signup {username, email, password}
  → PublicController.signup()
    → FirebaseAuth.createUser() [Firebase]
    → UserService.createUser(user, firebaseUid)
      → UserRepository.save() [MongoDB]
  ← 201 Created {UserDTO}
```

### 2. **Authentication Flow**
```
Client → Request with Header: Authorization: Bearer <firebaseToken>
  → FirebaseAuthFilter.doFilterInternal()
    → FirebaseAuth.verifyIdToken(token)
    → Extract uid and role claim
    → Set Authentication in SecurityContext (principal=uid, authority=ROLE_<role>)
  → Proceed to controller
```

### 3. **Course Enrollment Flow**
```
Client → POST /api/v1/enrollments/courses/{courseId}/enroll
  → EnrollmentController.enrollInCourse()
    → AuthUtil.getCurrentFirebaseUid() [get uid from SecurityContext]
    → UserService.enrollInCourse(firebaseUid, courseId)
      → Verify user exists (UserRepository)
      → Verify course exists (CourseRepository)
      → Add courseId to user.enrolledCourseIds
      → UserRepository.save()
      → EmailService.sendEnrollmentNotification() [async email]
  ← 200 OK "User enrolled in course successfully"
```

### 4. **Course Creation with Chapters/Topics/Quizzes** (Option A - Separate Endpoints)
```
1. Create Course:
   POST /api/v1/courses {title, description, subject}
   → CourseService.createCourse() → save course with empty chapterIds

2. Create Chapter:
   POST /api/v1/chapters/{courseId} {title, description}
   → ChapterService.createChapterForCourse()
     → Save chapter with courseId
     → Add chapter.id to course.chapterIds

3. Create Topic:
   POST /api/v1/topics/{chapterId}/topics {title, content}
   → TopicService.createTopicForChapter()
     → Save topic with chapterId
     → Add topic.id to chapter.topicIds

4. Create Quiz:
   POST /api/v1/quizzes/{topicId} {title}
   → QuizzService.createQuiz()
     → Save quiz with topicId
     → Add quiz.id to topic.quizzIds

5. Add Questions:
   POST /api/v1/quizzes/{quizzId}/questions {questionText, options, correctOptionIndex}
   → QuizzService.addQuestionsToQuizz()
     → Append to quiz.question array
```

### 5. **Quiz Submission & Grading Flow**
```
Client → POST /api/v1/quizzes/{quizzId}/submit {userId, courseId, topicId, answers}
  → QuizzController.submitQuizz()
    → QuizzService.submitQuizz()
      1. Fetch quiz from QuizRepository
      2. Grade: foreach question, compare user answer with correctOptionIndex
      3. Calculate score (correct / total)
      4. Create QuizzResult (score, passed=score>=50%, submittedAt)
      5. Save to QuizzResultRepo
      6. UserProgressService.recoredQuizzScore() [update progress]
  ← 200 OK {QuizzResult}
```

### 6. **Dashboard Data Aggregation Flow**
```
Client → GET /api/v1/dashboard
  → DashboardController.getMyDashboard()
    → AuthUtil.getCurrentFirebaseUid()
    → DashboardService.getUserDashBoard(firebaseUid)
      1. Find user by firebaseUid (UserRepository)
      2. For each courseId in user.enrolledCourseIds:
         - Fetch course (CourseRepository)
         - Calculate progress % (completed chapters / total)
         - Calculate avg quiz score from UserProgress.quizzScore
         - Build CourseDashBoardDTO
      3. Return UserDashboardDTO
  ← 200 OK {userId, username, email, enrolledCourses[...]}
```

### 7. **Course Completion & Certificate Flow**
```
1. User completes final chapter:
   POST /api/v1/user-progress/chapter/completed
   → UserProgressService.markedChapterCompleted()
     → Add to completedChapterIds
     → Check if all chapters done: CertificateService.isCourseCompleted()
       → If yes: EmailService.sendCourseCompletionNotification()

2. User requests certificate:
   GET /api/v1/certificates/{userId}/{courseId}
   → CertificateService.generateCertificate()
     → Verify isCourseCompleted()
     → Generate PDF with PDFBox (user name, course title, date)
   ← 200 OK (PDF binary)
```

---

## 🔐 Security Model

### Authorization Rules (SecurityConfig)
| Endpoint Pattern | Access Rule |
|------------------|-------------|
| `/api/v1/public/signup` | Public (permitAll) |
| `/swagger-ui/**`, `/v3/api-docs/**` | Public |
| `/actuator/health` | Public |
| `/admin/**` | ROLE_ADMIN only |
| `/api/v1/**` | Authenticated (any logged-in user) |

### Role-Based Access
- Roles stored in Firebase custom claims (`role` field)
- `FirebaseAuthFilter` extracts role and creates `ROLE_<ROLE>` authority
- Default role: `STUDENT`
- `AuthUtil.verifyUserAccess()` ensures users can only access their own data (unless admin)

---

## 📊 Configuration (application.properties)

```properties
spring.data.mongodb.uri=mongodb+srv://...
spring.data.mongodb.database=lms03_db

logging.file.name=logs/lcm.log
logging.level.root=INFO

# Email (Gmail SMTP)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD} # App password
spring.mail.from=${MAIL_FROM:noreply@lms.com}
```

---

## ✅ Current Implementation Status

### ✓ Completed Features
- Firebase authentication integration
- User signup and management
- Course/Chapter/Topic/Quiz reference model
- Enrollment system with email notifications
- Quiz submission and auto-grading
- User progress tracking (chapters, quizzes)
- Dashboard aggregation (progress %, avg scores)
- Certificate generation (PDF)
- Global exception handling
- DTO validation
- Swagger/OpenAPI docs
- CORS configuration
- Role-based authorization

### ⚠️ Known Issues / Improvements Needed
1. **User.enrolledCourseIds normalization** - Currently clean (List<String>), no issues
2. **Email configuration** - Requires environment variables for production
3. **Pagination** - Implemented on some endpoints, not all
4. **Transactions** - MongoDB transactions not configured (recommend for multi-document operations)
5. **Caching** - No caching layer (consider Redis for course metadata)
6. **File storage** - Certificates generated in-memory (consider S3 for persistence)
7. **Tests** - Only basic context test exists; needs unit/integration tests
8. **API rate limiting** - Not implemented

---

## 🚀 Recommended Next Steps

### High Priority
1. **Add comprehensive unit tests** - Service layer, controller layer
2. **Configure MongoDB transactions** - For enrollment, cascade deletes
3. **Add API documentation examples** - Complete Swagger annotations
4. **Environment-based config** - Separate dev/staging/prod properties

### Medium Priority
5. **Implement caching** - Course/chapter metadata with Spring Cache
6. **Add API rate limiting** - Protect against abuse
7. **Enhance validation** - More business rule validations in services
8. **Add audit logging** - Track who created/modified entities

### Low Priority
9. **Add search service** - Full-text search with MongoDB Atlas Search
10. **Implement file uploads** - For course materials, profile images
11. **Add notification service** - Real-time notifications with WebSockets
12. **Create admin panel endpoints** - User management, analytics

---

## 📝 API Design Patterns Used

1. **RESTful conventions** - Standard HTTP methods, resource naming
2. **DTO pattern** - Separate API contracts from domain models
3. **Repository pattern** - Data access abstraction
4. **Service layer** - Business logic separation
5. **Global exception handling** - Consistent error responses
6. **Standardized API response** - `ApiResponse<T>` wrapper
7. **Reference-based relations** - IDs instead of embedded documents
8. **Cascade operations** - Parent delete triggers child cleanup
9. **Role-based security** - Spring Security with custom filter

---

**End of Mapping Document**  
*For questions or updates, refer to individual class JavaDocs or contact the dev team.*
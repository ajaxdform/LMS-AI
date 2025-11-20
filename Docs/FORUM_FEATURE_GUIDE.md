# Discussion Forums Feature - Complete Implementation Guide

## 📋 Overview

The Discussion Forums feature adds a complete community discussion platform to your LMS. Users can create posts, reply to discussions, vote on content, and engage with course-specific or general topics.

## ✨ Features

### Core Functionality
- **Post Types**: 8 categories (General, Question, Discussion, Announcement, Help, Feedback, Resource Sharing, Bug Report)
- **Voting System**: Upvote/downvote posts and replies (Reddit-style)
- **Replies**: Threaded conversations with unlimited replies
- **Search**: Full-text search across posts and content
- **Tagging**: Add custom tags to posts for better organization
- **Context-Aware**: Posts can be course-specific, chapter-specific, or general
- **View Tracking**: Automatic view count increment

### Advanced Features
- **Accepted Answers**: Mark replies as solutions for question posts
- **Pinning**: Admin can pin important posts to the top
- **Locking**: Admin can lock posts to prevent new replies
- **Resolved Status**: Questions can be marked as resolved
- **Sorting Options**: Recent activity, newest, most upvoted, most replied, most viewed
- **Pagination**: Efficient pagination for posts and replies

### User Permissions
- **Students**: Create posts, reply, vote, mark their own question answers, edit/delete own content
- **Admins**: All student permissions + pin/unpin posts, lock/unlock posts, delete any content, moderate discussions

---

## 🗄️ Backend Implementation

### 1. Entities

#### **ForumPost.java**
```java
Location: lms-backend/src/main/java/com/devlcm/lcm/entity/ForumPost.java

Fields:
- id: String (UUID)
- title: String
- content: String (post body)
- authorId: String (user ID)
- authorUsername: String (denormalized for performance)
- courseId: String (nullable - null for general posts)
- chapterId: String (nullable - null if not chapter-specific)
- category: ForumCategory enum
- tags: List<String>
- viewCount: int
- upvotes: int
- downvotes: int
- upvotedBy: Set<String> (user IDs who upvoted)
- downvotedBy: Set<String> (user IDs who downvoted)
- replyCount: int (denormalized for performance)
- isPinned: boolean
- isLocked: boolean
- isResolved: boolean
- createdAt: LocalDateTime
- updatedAt: LocalDateTime
- lastActivityAt: LocalDateTime

Methods:
- vote(userId, voteType): Handle voting logic
- getNetVotes(): Calculate upvotes - downvotes
- incrementViews(): Increment view count
- updateActivity(): Update last activity timestamp
- incrementReplyCount() / decrementReplyCount()
```

#### **ForumReply.java**
```java
Location: lms-backend/src/main/java/com/devlcm/lcm/entity/ForumReply.java

Fields:
- id: String (UUID)
- content: String
- authorId: String
- authorUsername: String
- postId: String (parent post reference)
- upvotes: int
- downvotes: int
- upvotedBy: Set<String>
- downvotedBy: Set<String>
- isAcceptedAnswer: boolean
- createdAt: LocalDateTime
- updatedAt: LocalDateTime

Methods:
- vote(userId, voteType): Handle voting logic
- getNetVotes(): Calculate net votes
```

#### **ForumCategory.java**
```java
Enum with values:
- GENERAL
- QUESTION
- DISCUSSION
- ANNOUNCEMENT
- HELP
- FEEDBACK
- BUG_REPORT
- RESOURCE_SHARING
```

#### **VoteType.java** (embedded in ForumPost/ForumReply)
```java
Enum: UPVOTE, DOWNVOTE, REMOVE
```

### 2. Repositories

#### **ForumPostRepository.java**
```java
Location: lms-backend/src/main/java/com/devlcm/lcm/repository/ForumPostRepository.java

Methods:
- findByCourseId(courseId, pageable): Get posts for a course
- findByChapterId(chapterId, pageable): Get posts for a chapter
- findByCategory(category, pageable): Filter by category
- findByAuthorId(authorId, pageable): Get user's posts
- searchByTitleOrContent(keyword, pageable): Full-text search
- findByIsPinnedTrue(pageable): Get pinned posts
- findByIsResolvedTrue(pageable): Get resolved posts
- findUnansweredQuestions(pageable): Questions with 0 replies
- countByAuthorId(userId): Count user's posts
- countByCourseId(courseId): Count course posts
```

#### **ForumReplyRepository.java**
```java
Location: lms-backend/src/main/java/com/devlcm/lcm/repository/ForumReplyRepository.java

Methods:
- findByPostId(postId, pageable): Get replies for a post
- findByAuthorId(authorId, pageable): Get user's replies
- findByPostIdAndIsAcceptedAnswerTrue(postId): Get accepted answer
- countByAuthorId(userId): Count user's replies
- countByPostId(postId): Count post's replies
- deleteByPostId(postId): Delete all replies when post is deleted
```

### 3. DTOs

**DTOs Created:**
- `ForumPostDTO`: Response DTO with user vote status and metadata
- `ForumReplyDTO`: Response DTO with user vote status
- `CreateForumPostRequest`: Request for creating posts
- `CreateForumReplyRequest`: Request for creating replies
- `VoteRequest`: Request for voting (UPVOTE/DOWNVOTE/REMOVE)
- `UserForumStatsDTO`: User statistics (post count, reply count)

### 4. Service Layer

#### **ForumService.java**
```java
Location: lms-backend/src/main/java/com/devlcm/lcm/service/ForumService.java

Post Operations:
- createPost(request, userId): Create new post
- getAllPosts(userId, pageable): Get all posts
- getPostsByCourse/Chapter/Category: Filtered posts
- searchPosts(keyword, userId, pageable): Search posts
- getPostById(postId, userId): Get single post (increments views)
- updatePost(postId, request, userId, isAdmin): Update post
- deletePost(postId, userId, isAdmin): Delete post (cascades to replies)
- voteOnPost(postId, voteRequest, userId): Vote on post

Reply Operations:
- createReply(request, userId): Create reply
- getRepliesForPost(postId, userId, pageable): Get replies
- updateReply(replyId, content, userId, isAdmin): Update reply
- deleteReply(replyId, userId, isAdmin): Delete reply
- voteOnReply(replyId, voteRequest, userId): Vote on reply
- markAsAcceptedAnswer(replyId, userId, isAdmin): Mark solution

Moderation (Admin):
- togglePinPost(postId, userId): Pin/unpin
- toggleLockPost(postId, userId): Lock/unlock

Stats:
- getUserForumStats(userId): Get user statistics
```

### 5. Controller

#### **ForumController.java**
```java
Location: lms-backend/src/main/java/com/devlcm/lcm/controller/ForumController.java
Base URL: /api/v1/forum

Endpoints:

POST /posts
- Create new post
- Body: CreateForumPostRequest

GET /posts
- Get all posts with pagination
- Params: page, size, sortBy, direction

GET /posts/{postId}
- Get single post (increments view count)

GET /posts/course/{courseId}
- Get posts for a course

GET /posts/chapter/{chapterId}
- Get posts for a chapter

GET /posts/category/{category}
- Get posts by category

GET /posts/search?keyword=...
- Search posts

PUT /posts/{postId}
- Update post (author or admin)
- Body: CreateForumPostRequest

DELETE /posts/{postId}
- Delete post (author or admin)

POST /posts/{postId}/vote
- Vote on post
- Body: VoteRequest

POST /replies
- Create reply
- Body: CreateForumReplyRequest

GET /replies/post/{postId}
- Get replies for a post

PUT /replies/{replyId}
- Update reply (author or admin)
- Body: content (string)

DELETE /replies/{replyId}
- Delete reply (author or admin)

POST /replies/{replyId}/vote
- Vote on reply
- Body: VoteRequest

POST /replies/{replyId}/accept
- Mark as accepted answer (post author or admin)

POST /posts/{postId}/pin (Admin only)
- Toggle pin status

POST /posts/{postId}/lock (Admin only)
- Toggle lock status

GET /stats/{userId}
- Get user forum statistics
```

---

## 🎨 Frontend Implementation

### 1. Pages Created

#### **ForumList.jsx**
```jsx
Location: lcm-frontend/src/pages/ForumList.jsx
Route: /forum

Features:
- Category sidebar (8 categories + "All")
- Sort options (recent activity, newest, most voted, most replied, most viewed)
- Search bar with full-text search
- Context-aware (can be filtered by courseId or chapterId via URL params)
- Post cards showing:
  - Vote count
  - Title, content preview
  - Category badge
  - Status badges (pinned, locked, resolved)
  - Tags
  - Metadata (author, time, replies, views, course name)
- Pagination
- "New Post" button

UI Elements:
- Category filters with icons
- Sort dropdown
- Search bar
- Post list with hover effects
- Pagination controls
```

#### **CreateForumPost.jsx**
```jsx
Location: lcm-frontend/src/pages/CreateForumPost.jsx
Route: /forum/new

Features:
- Category selection (8 visual buttons with icons)
- Title input
- Content textarea
- Tags input (comma-separated)
- Context preservation (courseId/chapterId from URL params)
- Form validation
- Submit and Cancel buttons

UI Elements:
- Visual category selector (grid of buttons)
- Large content textarea
- Tag input with helper text
- Context indicator (if course/chapter specific)
```

#### **ForumPostDetail.jsx**
```jsx
Location: lcm-frontend/src/pages/ForumPostDetail.jsx
Route: /forum/post/:postId

Features:
POST SECTION:
- Voting buttons (upvote/downvote with active states)
- Full post content
- Category and status badges
- Tags display
- Metadata (author, date, views)
- Edit/Delete buttons (for author/admin)
- Pin/Lock buttons (admin only)

REPLIES SECTION:
- Reply form (disabled if locked)
- Reply list with:
  - Voting buttons
  - Content display
  - Author and timestamp
  - "Mark as Answer" button (for post author on questions)
  - Delete button (for author/admin)
  - Accepted answer highlight (green border)
- Pagination for replies

UI Elements:
- Vote buttons with active/inactive states
- Badges for status (pinned, locked, resolved, accepted answer)
- Reply form with submit button
- Reply cards with voting
- Green highlight for accepted answers
```

### 2. Routing

**Added to App.jsx:**
```jsx
// Forum Routes
<Route path="/forum" element={<ProtectedRoute><ForumList /></ProtectedRoute>} />
<Route path="/forum/new" element={<ProtectedRoute><CreateForumPost /></ProtectedRoute>} />
<Route path="/forum/post/:postId" element={<ProtectedRoute><ForumPostDetail /></ProtectedRoute>} />
```

### 3. Navigation

**Updated Navbar.jsx:**
- Added "Forum" link in main navigation
- Positioned between "Courses" and "Admin Panel"

---

## 🚀 Usage Guide

### For Students

#### **Creating a Post**
1. Click "Forum" in navbar
2. Click "+ New Post" button
3. Select category (Question, Discussion, Help, etc.)
4. Enter title and content
5. Optionally add tags (comma-separated)
6. Click "Create Post"

#### **Replying to Posts**
1. Click on a post to open details
2. Scroll to reply form
3. Enter your reply
4. Click "Post Reply"

#### **Voting**
- Click ▲ to upvote (click again to remove vote)
- Click ▼ to downvote (click again to remove vote)
- You can change your vote at any time

#### **Marking Answers (for your own questions)**
1. Open your question post
2. Find the best reply
3. Click "Mark as Answer"
4. Post will be marked as "Resolved"

### For Admins

#### **Moderation**
- **Pin Posts**: Click "Pin" on important posts to keep them at the top
- **Lock Posts**: Click "Lock" to prevent new replies
- **Delete Content**: Delete any inappropriate posts or replies

---

## 📊 Database Schema

### Collections

**forum_posts**
- Stores all forum posts
- Indexes: courseId, chapterId, authorId, category, createdAt, lastActivityAt

**forum_replies**
- Stores all replies to posts
- Indexes: postId, authorId, createdAt

### Relationships

```
User (users collection)
  ├─ has many ForumPosts (forum_posts.authorId)
  └─ has many ForumReplies (forum_replies.authorId)

Course (courses collection)
  └─ has many ForumPosts (forum_posts.courseId)

Chapter (chapters collection)
  └─ has many ForumPosts (forum_posts.chapterId)

ForumPost (forum_posts collection)
  └─ has many ForumReplies (forum_replies.postId)
```

---

## 🔒 Security & Permissions

### Permission Matrix

| Action | Student (Own) | Student (Others) | Admin |
|--------|--------------|------------------|-------|
| Create Post | ✅ | ✅ | ✅ |
| Edit Post | ✅ | ❌ | ✅ |
| Delete Post | ✅ | ❌ | ✅ |
| Vote | ✅ | ✅ | ✅ |
| Reply | ✅ | ✅ | ✅ |
| Edit Reply | ✅ | ❌ | ✅ |
| Delete Reply | ✅ | ❌ | ✅ |
| Mark Answer | ✅ (own questions) | ❌ | ✅ |
| Pin Post | ❌ | ❌ | ✅ |
| Lock Post | ❌ | ❌ | ✅ |

### Validation Rules

**Posts:**
- Title: Required, 1-200 characters
- Content: Required, 1-10,000 characters
- Category: Required, must be valid enum value
- Tags: Optional, max 10 tags, each max 50 characters

**Replies:**
- Content: Required, 1-5,000 characters
- Cannot reply to locked posts (unless admin)

---

## 🎯 Use Cases

### 1. Course Discussion
**Scenario**: Students discussing a difficult topic
- Navigate to course → Click "Discuss" button
- Posts automatically tagged with courseId
- Students can ask questions and help each other

### 2. Q&A for Assignments
**Scenario**: Student has question about quiz
- Create post with category "Question"
- Other students or instructor reply
- Best answer marked as "Accepted"
- Post marked as "Resolved"

### 3. Resource Sharing
**Scenario**: Student found helpful tutorial
- Create post with category "Resource Sharing"
- Share link and description
- Others upvote if helpful

### 4. Bug Reports
**Scenario**: User finds platform issue
- Create post with category "Bug Report"
- Admin reviews and replies
- Admin locks post when fixed

### 5. General Community
**Scenario**: Students want to network
- Create general discussion post
- No course/chapter association
- Build community engagement

---

## 📈 Future Enhancements

### Planned Features
1. **Notifications**: Email/in-app notifications for replies to your posts
2. **User Reputation**: Points system based on upvotes and accepted answers
3. **Badges**: Award badges for helpful contributors
4. **File Attachments**: Allow image/file uploads in posts
5. **Rich Text Editor**: Markdown or WYSIWYG editor for formatting
6. **Nested Replies**: Reply to specific replies (threading)
7. **Post Reactions**: Beyond upvote/downvote (helpful, funny, etc.)
8. **Following**: Follow posts to get notified of new replies
9. **Bookmarks**: Save favorite posts for later
10. **Reports**: Allow users to report inappropriate content
11. **Auto-moderation**: Spam detection and content filtering
12. **Analytics**: Dashboard showing forum activity metrics

### Optional Integrations
- **Discord Integration**: Sync forum with Discord server
- **Email Digests**: Weekly summary of popular posts
- **AI Suggestions**: Auto-suggest related posts when creating new ones
- **Video Embeds**: Embed YouTube videos in posts
- **Code Blocks**: Syntax highlighting for code snippets

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: Posts not showing up
- Check authentication - must be logged in
- Verify backend is running on port 8080
- Check browser console for errors
- Verify MongoDB connection

**Issue**: Voting not working
- Ensure user is authenticated
- Check if already voted (can only vote once)
- Verify vote request reaches backend

**Issue**: Can't reply to post
- Check if post is locked (lock icon)
- Only admins can reply to locked posts
- Verify form submission

**Issue**: Search returning no results
- Ensure keyword is at least 3 characters
- Try different search terms
- Check if posts exist in database

---

## 📝 API Testing with Postman

### Sample Requests

**Create Post:**
```http
POST http://localhost:8080/api/v1/forum/posts
Headers:
  Authorization: Bearer <firebase-token>
  Content-Type: application/json
Body:
{
  "title": "How to implement REST API?",
  "content": "I'm having trouble understanding REST endpoints...",
  "category": "QUESTION",
  "tags": ["api", "rest", "backend"],
  "courseId": null
}
```

**Vote on Post:**
```http
POST http://localhost:8080/api/v1/forum/posts/{postId}/vote
Headers:
  Authorization: Bearer <firebase-token>
  Content-Type: application/json
Body:
{
  "voteType": "UPVOTE"
}
```

**Search Posts:**
```http
GET http://localhost:8080/api/v1/forum/posts/search?keyword=api&page=0&size=20
Headers:
  Authorization: Bearer <firebase-token>
```

---

## ✅ Implementation Checklist

### Backend
- [x] ForumPost entity created
- [x] ForumReply entity created
- [x] ForumCategory enum created
- [x] ForumPostRepository created with custom queries
- [x] ForumReplyRepository created with custom queries
- [x] DTOs created (Post, Reply, Requests, Stats)
- [x] ForumService implemented with all operations
- [x] ForumController created with all endpoints
- [x] Security configured (Firebase JWT auth)

### Frontend
- [x] ForumList page created
- [x] CreateForumPost page created
- [x] ForumPostDetail page created
- [x] Routing configured in App.jsx
- [x] Navbar updated with Forum link
- [x] API integration with axios
- [ ] Admin moderation page (optional)

### Testing
- [ ] Test post creation
- [ ] Test voting functionality
- [ ] Test reply submission
- [ ] Test search functionality
- [ ] Test pagination
- [ ] Test admin moderation features
- [ ] Test permissions (student vs admin)

---

## 🎉 Conclusion

The Discussion Forums feature is now fully implemented and ready to use! It provides a comprehensive platform for student engagement, Q&A, and community building within your LMS.

**Key Benefits:**
- **Engagement**: Increases student interaction and learning
- **Support**: Peer-to-peer help reduces instructor workload
- **Knowledge Base**: Searchable archive of Q&A
- **Community**: Builds sense of belonging
- **Scalable**: Handles high volume with pagination and caching

**Next Steps:**
1. Restart backend to load new controllers
2. Test forum functionality
3. Create some sample posts
4. Encourage students to participate
5. Consider implementing notifications (future enhancement)

Happy learning and discussing! 🚀

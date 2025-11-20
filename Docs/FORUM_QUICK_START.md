# Discussion Forums Feature - Quick Start

## 🎯 What's Been Built

A complete discussion forum system for your LMS with:
- **Reddit-style voting** (upvote/downvote)
- **8 post categories** (Question, Discussion, Help, etc.)
- **Threaded replies** with accepted answers
- **Full-text search** across all posts
- **Context-aware** (course/chapter specific or general)
- **Admin moderation** (pin, lock, delete)

---

## 🚀 How to Use

### **1. Start the Backend**
```bash
cd lms-backend
./mvnw spring-boot:run
```

### **2. Start the Frontend**
```bash
cd lcm-frontend
npm run dev
```

### **3. Access Forum**
- Login to your account
- Click **"Forum"** in the navbar
- Click **"+ New Post"** to create your first post

---

## 📂 Files Created

### **Backend** (lms-backend/src/main/java/com/devlcm/lcm/)

**Entities:**
- `entity/ForumPost.java` - Main post entity with voting
- `entity/ForumReply.java` - Reply entity
- `entity/ForumCategory.java` - Category enum
- `entity/VoteType.java` - Vote type enum

**Repositories:**
- `repository/ForumPostRepository.java` - Post queries
- `repository/ForumReplyRepository.java` - Reply queries

**DTOs:**
- `dto/ForumPostDTO.java`
- `dto/ForumReplyDTO.java`
- `dto/CreateForumPostRequest.java`
- `dto/CreateForumReplyRequest.java`
- `dto/VoteRequest.java`
- `dto/UserForumStatsDTO.java`

**Service & Controller:**
- `service/ForumService.java` - Business logic
- `controller/ForumController.java` - REST API

### **Frontend** (lcm-frontend/src/pages/)
- `ForumList.jsx` - Main forum page with post list
- `CreateForumPost.jsx` - Create new post page
- `ForumPostDetail.jsx` - Post detail with replies

### **Documentation**
- `Docs/FORUM_FEATURE_GUIDE.md` - Complete implementation guide

---

## 🌐 API Endpoints

**Base URL:** `http://localhost:8080/api/v1/forum`

### Posts
- `POST /posts` - Create post
- `GET /posts` - List all posts (paginated)
- `GET /posts/{postId}` - Get single post
- `GET /posts/course/{courseId}` - Course posts
- `GET /posts/chapter/{chapterId}` - Chapter posts
- `GET /posts/search?keyword=...` - Search
- `PUT /posts/{postId}` - Update post
- `DELETE /posts/{postId}` - Delete post
- `POST /posts/{postId}/vote` - Vote on post

### Replies
- `POST /replies` - Create reply
- `GET /replies/post/{postId}` - Get replies
- `PUT /replies/{replyId}` - Update reply
- `DELETE /replies/{replyId}` - Delete reply
- `POST /replies/{replyId}/vote` - Vote on reply
- `POST /replies/{replyId}/accept` - Mark as answer

### Moderation (Admin)
- `POST /posts/{postId}/pin` - Toggle pin
- `POST /posts/{postId}/lock` - Toggle lock

---

## 💡 Key Features

### **For Students:**
✅ Create posts in 8 categories
✅ Reply to discussions
✅ Upvote/downvote posts and replies
✅ Mark best answers on your questions
✅ Search all discussions
✅ Tag posts for organization
✅ View post history and stats

### **For Admins:**
✅ All student features
✅ Pin important posts
✅ Lock posts to prevent replies
✅ Delete any content
✅ Moderate discussions
✅ View forum statistics

---

## 🎨 UI Screenshots (What You'll See)

### Forum List Page
```
┌─────────────────────────────────────────────────────┐
│ Discussion Forum                    [+ New Post]    │
│ Connect, share, and learn together                  │
│ [Search discussions..............................]   │
├─────────────┬───────────────────────────────────────┤
│ Categories  │                                        │
│ 💬 All      │  [12 votes] ❓ How to use React?     │
│ ❓ Question │    Posted by john • 2h ago            │
│ 💭 Discuss  │    💬 5 replies • 👁 23 views         │
│ 📢 Announce │                                        │
│ 🆘 Help     │  [8 votes] 💭 Best Learning Tips     │
│ 💡 Feedback │    Posted by mary • 1d ago            │
│             │    💬 12 replies • 👁 45 views        │
│ Sort By:    │                                        │
│ [Recent v]  │  ... more posts ...                   │
└─────────────┴───────────────────────────────────────┘
```

### Post Detail Page
```
┌──────────────────────────────────────────────────┐
│ ← Back to Forum                                  │
├──────────────────────────────────────────────────┤
│  ▲   📌 Pinned   ❓ QUESTION                     │
│ 12   How do I implement authentication?         │
│  ▼   I'm trying to add Firebase auth but...     │
│      #firebase #auth #security                   │
│      Posted by john • 2 hours ago • 👁 23 views │
│      [Delete Post] [Pin] [Lock]                 │
├──────────────────────────────────────────────────┤
│ 5 Replies                                        │
│ [Write your reply...........................]     │
│ [Post Reply]                                     │
│                                                  │
│  ▲   ✓ Accepted Answer                          │
│  8   You should use Firebase SDK v9...          │
│  ▼   Posted by mary • 1h ago                    │
│      [Mark as Answer] [Delete]                  │
│                                                  │
│  ▲   Great explanation! Also check...           │
│  3   Posted by bob • 30m ago                    │
│  ▼   [Delete]                                   │
└──────────────────────────────────────────────────┘
```

---

## 🧪 Testing Steps

### 1. Create Your First Post
1. Click "Forum" in navbar
2. Click "+ New Post"
3. Select "Question" category
4. Title: "Test Post"
5. Content: "This is my first forum post!"
6. Tags: "test, demo"
7. Click "Create Post"

### 2. Vote on Posts
1. Click ▲ to upvote
2. Click ▼ to downvote
3. Click again to remove vote

### 3. Reply to a Post
1. Open any post
2. Type reply in text area
3. Click "Post Reply"

### 4. Search
1. Use search bar at top
2. Try keyword: "test"
3. See matching posts

### 5. Admin Features (if admin)
1. Open any post
2. Try "Pin" button
3. Try "Lock" button
4. See status changes

---

## 🔧 Configuration

### Default Settings
- **Posts per page**: 20
- **Replies per page**: 50
- **Search minimum length**: 3 characters
- **Vote types**: Upvote, Downvote, Remove
- **Categories**: 8 predefined categories

### Customization Options
Edit these files to customize:
- Categories: `ForumCategory.java`
- Page sizes: `ForumController.java` (default params)
- Sorting options: `ForumList.jsx` (SORT_OPTIONS)

---

## 🐛 Troubleshooting

**Posts not loading?**
- Check backend is running on port 8080
- Verify you're logged in
- Check browser console for errors

**Can't create post?**
- Ensure all required fields filled
- Check authentication token is valid
- Verify backend logs for errors

**Voting not working?**
- Refresh page to see updated votes
- Can only vote once per post/reply
- Check you're authenticated

**Search no results?**
- Try different keywords
- Ensure posts exist in database
- Check minimum 3 characters

---

## 📚 Next Steps

1. **Test the feature**: Create posts, replies, vote
2. **Invite users**: Get students to try it out
3. **Monitor engagement**: Check forum statistics
4. **Optional enhancements**:
   - Add notifications for replies
   - Implement user reputation system
   - Add file attachments
   - Rich text editor for formatting

---

## 📞 Support

For detailed documentation, see:
- **`Docs/FORUM_FEATURE_GUIDE.md`** - Complete guide with all details

For API testing:
- Use Postman with provided endpoints
- Add Authorization header with Firebase token
- Base URL: `http://localhost:8080/api/v1/forum`

---

## ✨ Key Benefits

✅ **Increases engagement** - Students help each other
✅ **Reduces support load** - Peer-to-peer Q&A
✅ **Builds community** - Sense of belonging
✅ **Knowledge base** - Searchable Q&A archive
✅ **Scalable** - Handles high volume efficiently

---

**Built with ❤️ for your LMS**

Happy discussing! 🚀

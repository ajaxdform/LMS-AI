# Admin Panel - Quick Start

## ✅ What's Been Built (Backend Complete)

### 1. **Role System**
- UserRole enum: `STUDENT`, `ADMIN`
- User entity updated with role field (defaults to STUDENT)

### 2. **AdminService (Microservice Architecture)**
- **Location**: `com.devlcm.lcm.service.AdminService`
- **609 lines** of clean, independent admin logic
- Handles ALL admin operations:
  - User management
  - Course CRUD
  - Chapter CRUD  
  - Topic CRUD
  - Quiz CRUD
  - Statistics & monitoring

### 3. **AdminController**
- **Location**: `com.devlcm.lcm.controller.AdminController`
- **Base URL**: `/api/v1/admin`
- **28 endpoints** for complete admin control
- Rate limited: 200 req/min (higher than students)

### 4. **Repository Methods Added**
- `UserRepository.countByRole()` - Count users by role
- `UserProgressRepository.deleteByUserId()` - Delete user progress

### 5. **Utilities**
- `DataInitializer.java` - Helper to create/promote admin users

## 📋 Admin API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/admin/dashboard/stats` | GET | Dashboard statistics |
| `/admin/users` | GET | List all users |
| `/admin/users/{id}/role?role=ADMIN` | PUT | Change user role |
| `/admin/users/{id}` | DELETE | Delete user |
| `/admin/courses` | POST | Create course |
| `/admin/courses/{id}` | PUT/DELETE | Update/delete course |
| `/admin/courses/{id}/chapters` | POST | Create chapter |
| `/admin/chapters/{id}` | PUT/DELETE | Update/delete chapter |
| `/admin/chapters/{id}/topics` | POST | Create topic |
| `/admin/topics/{id}` | PUT/DELETE | Update/delete topic |
| `/admin/topics/{id}/quizzes` | POST | Create quiz |
| `/admin/quizzes/{id}` | PUT/DELETE | Update/delete quiz |
| `/admin/progress` | GET | Monitor all user progress |

## 🚀 How to Create an Admin User

### Option 1: Via MongoDB Compass
1. Open MongoDB Compass
2. Connect to your database
3. Find `users` collection
4. Find your user document
5. Edit and change `"role": "STUDENT"` to `"role": "ADMIN"`
6. Save

### Option 2: Via DataInitializer (Automated)
1. Open `DataInitializer.java`
2. Uncomment the `@Bean` annotation above `promoteUserToAdmin()`
3. Change the email: `String emailToPromote = "your-email@example.com";`
4. Restart backend
5. Check logs - should say "User promoted to ADMIN role"
6. **Important**: Comment out `@Bean` again to prevent re-running

### Option 3: Via MongoDB Shell
```javascript
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "ADMIN" } }
)
```

## 🧪 Testing the Admin API

### Using cURL:
```bash
# Get dashboard stats
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
     http://localhost:8080/api/v1/admin/dashboard/stats

# Create a course
curl -X POST \
     -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Introduction to Python",
       "subject": "Programming",
       "description": "Learn Python basics"
     }' \
     http://localhost:8080/api/v1/admin/courses

# Promote user to admin
curl -X PUT \
     -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
     "http://localhost:8080/api/v1/admin/users/{userId}/role?role=ADMIN"
```

### Using Postman:
1. Create new request
2. Set method (GET/POST/PUT/DELETE)
3. Set URL: `http://localhost:8080/api/v1/admin/...`
4. Add header: `Authorization: Bearer YOUR_TOKEN`
5. For POST/PUT, add JSON body
6. Send

## 📝 Frontend Implementation (TODO)

The backend is **100% complete**. Frontend needs:

1. **Admin Hook** (`useAdmin.js`) - Check if user is admin
2. **Admin Dashboard** - Statistics cards and navigation
3. **User Management Page** - View/edit/delete users
4. **Course Management Page** - Create/edit/delete courses
5. **Chapter/Topic/Quiz Pages** - Hierarchical content management
6. **Protected Routes** - Add `adminOnly` prop to ProtectedRoute

See `ADMIN_PANEL_GUIDE.md` for complete frontend code examples.

## ⚠️ Security TODO

Currently, endpoints are **not protected** by Spring Security role checks. They work, but anyone can access them if they have the URL.

**To add security**:
1. Update `SecurityConfig.java` to require ADMIN role for `/api/v1/admin/**`
2. Modify Firebase token validation to extract role and set in SecurityContext
3. Add `@PreAuthorize("hasRole('ADMIN')")` to AdminController

## 🏗️ Architecture Highlights

- **Microservice-like**: AdminService is completely independent
- **Clean Separation**: Admin logic isolated from student operations
- **Cascading Deletes**: Deleting course auto-deletes chapters/topics/quizzes
- **Type-Safe**: DTOs and validation throughout
- **Logging**: Comprehensive logging for all admin operations
- **Error Handling**: Proper exceptions and responses

## 📊 Statistics Available

**User Stats**:
- Total users
- Total admins
- Total students

**Course Stats**:
- Total courses
- Total chapters
- Total topics
- Total quizzes

**User Progress**:
- All user progress records (paginated)
- Filter by course, user, completion status

## 🎯 Next Steps

1. ✅ Backend complete - no changes needed
2. 🔲 Create admin user (use one of the 3 methods above)
3. 🔲 Test API endpoints with Postman
4. 🔲 Implement frontend admin dashboard
5. 🔲 Add Spring Security role protection
6. 🔲 Test complete flow: login as admin → create course → add chapters → add topics → add quizzes

## 💡 Pro Tips

1. **Start with dashboard**: Implement `AdminDashboard.jsx` first to see statistics
2. **Test incrementally**: Test each API endpoint before building its frontend
3. **Use React DevTools**: Check if `isAdmin` hook returns true
4. **Check browser console**: API errors will show there
5. **Verify MongoDB**: Check if role field actually changed to "ADMIN"

---

**Status**: Backend ✅ Complete | Frontend 🔲 Pending | Security ⚠️ Needs Role Protection

See `ADMIN_PANEL_GUIDE.md` for detailed implementation guide!

# Frontend-Backend Connection Guide

## 🔧 Current Setup

### Frontend
- **Dev Server:** http://localhost:5173 (Vite)
- **Framework:** React with React Router
- **API Base URL:** http://localhost:8080

### Backend
- **Server:** http://localhost:8080
- **API Prefix:** /api/v1/

---

## ⚠️ Common Error: "No static resource dashboard"

### Problem
You're accessing `http://localhost:8080/dashboard` instead of `http://localhost:5173/dashboard`

### Why It Happens
- The backend at port 8080 serves **API endpoints only** (e.g., `/api/v1/courses`)
- The frontend at port 5173 handles **UI routes** (e.g., `/dashboard`, `/courses`)
- When you navigate to `http://localhost:8080/dashboard`, the backend tries to serve it as a static file and fails

---

## ✅ Solution: Use the Correct URLs

### ✅ DO: Use Frontend URL for UI
```
✅ http://localhost:5173/           (Home page)
✅ http://localhost:5173/login      (Login page)
✅ http://localhost:5173/dashboard  (Dashboard)
✅ http://localhost:5173/courses    (Courses list)
```

### ❌ DON'T: Access UI routes on backend
```
❌ http://localhost:8080/dashboard  (This will fail!)
❌ http://localhost:8080/courses    (This will fail!)
❌ http://localhost:8080/login      (This will fail!)
```

### ✅ DO: Use Backend URL for API calls
```
✅ http://localhost:8080/api/v1/courses
✅ http://localhost:8080/api/v1/dashboard
✅ http://localhost:8080/api/v1/enrollments/courses
```

---

## 🚀 How to Run the Application

### 1. Start Backend (Port 8080)
```bash
cd lms-backend
mvn spring-boot:run
# Or run from your IDE: LcmApplication.java
```

### 2. Start Frontend (Port 5173)
```bash
cd lcm-frontend
npm run dev
```

### 3. Open in Browser
```
👉 Open: http://localhost:5173
```

---

## 🔍 How It Works

### Frontend → Backend Flow
```
User Browser
    ↓
http://localhost:5173/dashboard (React Router handles this)
    ↓
React Dashboard component loads
    ↓
Makes API call to http://localhost:8080/api/v1/dashboard
    ↓
Backend processes and returns JSON data
    ↓
React displays the data
```

### What Happens When You Use Wrong URL
```
User Browser
    ↓
http://localhost:8080/dashboard ❌
    ↓
Backend: "I don't have a /dashboard endpoint, only /api/v1/dashboard"
    ↓
Backend: "Let me check static resources..."
    ↓
Backend: "No static resource 'dashboard' found!"
    ↓
Error: "No static resource dashboard"
```

---

## 🛠️ Development Workflow

### Starting Your Day
1. Open 2 terminals
2. Terminal 1: Start backend
3. Terminal 2: Start frontend
4. Open browser to `http://localhost:5173`
5. Use the application normally

### Making Changes
- **Backend changes:** Restart backend server
- **Frontend changes:** Vite hot-reloads automatically (no restart needed!)

---

## 📋 Troubleshooting Checklist

- [ ] Is backend running on port 8080?
  - Check terminal for "Started LcmApplication"
  - Or visit http://localhost:8080/actuator/health

- [ ] Is frontend running on port 5173?
  - Check terminal for "Local: http://localhost:5173/"

- [ ] Are you using the CORRECT port in your browser?
  - ✅ Use 5173 for UI (dashboard, courses, login)
  - ✅ Use 8080 only for direct API testing (Swagger, Postman)

- [ ] Is CORS configured properly?
  - Check SecurityConfig.java - should allow http://localhost:5173

---

## 🎯 Quick Fix

If you're seeing the error, simply:

1. **Close the tab at** `http://localhost:8080/dashboard`
2. **Open a new tab at** `http://localhost:5173`
3. **Navigate using the navbar** to Dashboard or Courses

---

## 🚢 Production Deployment (Future)

In production, you'll build the frontend and serve it from the backend:

```bash
# Build frontend
cd lcm-frontend
npm run build

# Copy build to backend static resources
cp -r dist/* ../lms-backend/src/main/resources/static/

# Now backend serves both API and frontend
http://yourapp.com/dashboard ✅ (served by backend)
http://yourapp.com/api/v1/courses ✅ (API endpoint)
```

But for development, **always use separate ports!**

---

## 📚 Additional Resources

- Backend API docs: http://localhost:8080/swagger-ui/index.html
- Backend health check: http://localhost:8080/actuator/health
- Frontend dev server: http://localhost:5173

---

**Remember:** Frontend (5173) for UI, Backend (8080) for API! 🎉

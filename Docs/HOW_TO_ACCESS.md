# ⚠️ IMPORTANT: How to Access the Application

## 🎯 Quick Start

1. **Start Backend:**
   ```bash
   # In lms-backend folder
   mvn spring-boot:run
   ```

2. **Start Frontend:**
   ```bash
   # In lcm-frontend folder
   npm run dev
   ```

3. **Open Browser:**
   ```
   👉 http://localhost:5173
   ```

---

## ✅ Correct Way to Use the App

**Always access the application through the frontend URL:**

```
✅ http://localhost:5173/
✅ http://localhost:5173/login
✅ http://localhost:5173/dashboard
✅ http://localhost:5173/courses
```

---

## ❌ Common Mistake

**DO NOT** navigate directly to the backend URL in your browser:

```
❌ http://localhost:8080/dashboard  ← This causes errors!
❌ http://localhost:8080/courses    ← This causes errors!
```

The backend (port 8080) only serves API endpoints like:
- `http://localhost:8080/api/v1/courses`
- `http://localhost:8080/api/v1/dashboard`

---

## 🔧 Why This Setup?

### Development Mode (Current)
- **Frontend (React):** Port 5173 - Handles UI and routing
- **Backend (Spring Boot):** Port 8080 - Handles API requests
- They communicate via CORS-enabled API calls

### Production Mode (Future)
- Frontend will be built and served from backend
- Single URL will serve everything

---

## 📝 If You See "No static resource" Error

This means you accidentally accessed `http://localhost:8080` instead of `http://localhost:5173`

**Fix:** Simply use `http://localhost:5173` instead!

---

See `FRONTEND_BACKEND_CONNECTION.md` in the root folder for detailed explanation.

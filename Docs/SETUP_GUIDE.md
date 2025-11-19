# Frontend Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   cd lcm-frontend
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Access the Application**
   - Open your browser to `http://localhost:5173`
   - The app should be running and ready to use

## What's Been Implemented

### ✅ Core Features
- **Authentication System**
  - Firebase Authentication integration
  - Login and Sign Up pages
  - Protected routes
  - Token management and auto-refresh

- **User Interface**
  - Modern, responsive design with Tailwind CSS
  - Navigation bar with user info
  - Loading states and error handling
  - Form validation

- **Pages**
  - **Home**: Landing page with feature highlights
  - **Login**: User authentication
  - **SignUp**: New user registration (improved with validation)
  - **Dashboard**: User dashboard showing:
    - Enrolled courses count
    - Completed topics
    - Quiz average score
    - List of enrolled courses
  - **Courses**: Browse all courses with search functionality
  - **Course Details**: View course information and enroll/unenroll

### ✅ Technical Implementation
- React Router for navigation
- Context API for global auth state
- Axios interceptors for automatic token injection
- Protected routes that require authentication
- Error handling throughout the application
- Responsive design for all screen sizes

## File Structure

```
src/
├── api/axios.js              # API configuration
├── components/
│   ├── Navbar.jsx            # Navigation component
│   └── ProtectedRoute.jsx    # Route protection
├── context/
│   └── AuthContext.jsx       # Auth state management
├── pages/
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── SignUp.jsx
│   ├── Dashboard.jsx
│   ├── Courses.jsx
│   └── CourseDetails.jsx
├── App.jsx                   # Main app with routes
├── firebase.js               # Firebase config
└── main.jsx                  # Entry point
```

## Backend Integration

The frontend is configured to connect to:
- **Backend URL**: `http://localhost:8080`
- All API calls automatically include Firebase authentication token
- Error handling for API failures

## Next Steps (Optional Enhancements)

1. **Course Content Pages**
   - Chapter/Topic viewing
   - Video/content player
   - Progress tracking

2. **Quiz Functionality**
   - Quiz taking interface
   - Results display
   - Score tracking

3. **User Profile**
   - Profile editing
   - Certificate viewing
   - Achievement badges

4. **Admin Features**
   - Course management
   - User management
   - Analytics dashboard

## Troubleshooting

### Linter Warning About SignUp.jsx
If you see a case sensitivity warning about `SignUp.jsx` vs `signup.jsx`, this is a Windows file system quirk. The code will work fine - it's just a linter warning that can be ignored.

### Tailwind CSS Not Working
Make sure you've installed dependencies:
```bash
npm install
```

The Tailwind plugin is configured in `vite.config.js` and should work automatically.

### API Connection Issues
- Ensure the backend is running on `http://localhost:8080`
- Check browser console for CORS errors
- Verify Firebase configuration in `src/firebase.js`

## Development Tips

- Use `npm run dev` for hot-reload development
- Check browser console for errors
- Use React DevTools for debugging
- Tailwind classes are available - check Tailwind docs for styling


# Frontend Structure

## Project Overview
This is a React + Vite frontend application for the Learning Management System (LMS).

## Tech Stack
- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router DOM** - Routing
- **Firebase Auth** - Authentication
- **Axios** - HTTP client
- **Tailwind CSS** - Styling

## Project Structure

```
src/
├── api/
│   └── axios.js              # Axios instance with interceptors
├── assets/                   # Static assets
├── components/               # Reusable components
│   ├── Navbar.jsx           # Navigation bar
│   └── ProtectedRoute.jsx   # Route protection wrapper
├── context/
│   └── AuthContext.jsx      # Authentication context provider
├── pages/                    # Page components
│   ├── Home.jsx             # Landing page
│   ├── Login.jsx            # Login page
│   ├── SignUp.jsx          # Sign up page
│   ├── Dashboard.jsx       # User dashboard
│   ├── Courses.jsx         # Courses listing
│   └── CourseDetails.jsx   # Course details page
├── App.jsx                  # Main app component with routing
├── firebase.js              # Firebase configuration
├── index.css                # Global styles (Tailwind)
└── main.jsx                 # Entry point

```

## Features

### Authentication
- Firebase Authentication integration
- Protected routes
- Token management
- Auto token refresh

### Pages
1. **Home** - Landing page with feature highlights
2. **Login** - User authentication
3. **SignUp** - New user registration
4. **Dashboard** - User dashboard with stats and enrolled courses
5. **Courses** - Browse and search all courses
6. **Course Details** - View course details and enroll/unenroll

### API Integration
- Base URL: `http://localhost:8080`
- Automatic token injection via axios interceptors
- Error handling throughout

## Available Scripts

```bash
npm run dev      # Start development server
npm run build   # Build for production
npm run preview # Preview production build
npm run lint    # Run ESLint
```

## Environment Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. The app will be available at `http://localhost:5173` (default Vite port)

## Backend API Endpoints Used

- `POST /public/signup` - User registration
- `GET /dashboard` - Get user dashboard data
- `GET /courses/all` - Get all courses
- `GET /courses/{id}` - Get course by ID
- `GET /courses/search?q={keyword}` - Search courses
- `GET /enrollments/courses` - Get enrolled courses
- `POST /enrollments/courses/{id}/enroll` - Enroll in course
- `DELETE /enrollments/courses/{id}/enroll` - Unenroll from course

## Notes

- All protected routes require authentication
- Firebase token is automatically included in API requests
- Tailwind CSS is used for all styling
- Responsive design for mobile and desktop


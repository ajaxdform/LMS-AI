# LMS Frontend - Comprehensive Documentation

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Architecture](#architecture)
6. [Components Documentation](#components-documentation)
7. [Pages Documentation](#pages-documentation)
8. [Authentication Flow](#authentication-flow)
9. [API Integration](#api-integration)
10. [Routing](#routing)
11. [Styling Guidelines](#styling-guidelines)
12. [State Management](#state-management)
13. [Error Handling](#error-handling)
14. [Development Workflow](#development-workflow)
15. [Testing](#testing)
16. [Deployment](#deployment)
17. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

This is the frontend application for a Learning Management System (LMS) built with React. It provides a modern, responsive interface for users to:

- Register and authenticate
- Browse and enroll in courses
- Track learning progress
- View dashboard statistics
- Complete quizzes and assessments

### Key Features

- ✅ Firebase Authentication integration
- ✅ Protected routes with role-based access
- ✅ Real-time token management
- ✅ Responsive design (mobile-first)
- ✅ Modern UI with Tailwind CSS
- ✅ Error handling and loading states
- ✅ RESTful API integration

---

## 🛠 Tech Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.1.1 | UI library |
| **Vite** | 7.1.7 | Build tool & dev server |
| **React Router DOM** | 7.9.5 | Client-side routing |
| **Firebase** | 12.5.0 | Authentication |
| **Axios** | 1.13.2 | HTTP client |
| **Tailwind CSS** | 4.1.17 | Utility-first CSS framework |

### Development Tools

- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

---

## 📁 Project Structure

```
lcm-frontend/
├── public/                 # Static assets
│   └── vite.svg
├── src/
│   ├── api/                # API configuration
│   │   └── axios.js       # Axios instance with interceptors
│   ├── assets/            # Images, icons, etc.
│   │   └── react.svg
│   ├── components/        # Reusable UI components
│   │   ├── Navbar.jsx    # Navigation bar
│   │   └── ProtectedRoute.jsx  # Route protection wrapper
│   ├── context/           # React Context providers
│   │   └── AuthContext.jsx  # Authentication state management
│   ├── pages/             # Page components
│   │   ├── Home.jsx       # Landing page
│   │   ├── Login.jsx      # Login page
│   │   ├── SignUp.jsx     # Registration page
│   │   ├── Dashboard.jsx  # User dashboard
│   │   ├── Courses.jsx     # Courses listing
│   │   └── CourseDetails.jsx  # Course detail view
│   ├── App.jsx            # Main app component
│   ├── firebase.js        # Firebase configuration
│   ├── index.css          # Global styles (Tailwind)
│   └── main.jsx           # Application entry point
├── .gitignore
├── eslint.config.js       # ESLint configuration
├── index.html             # HTML template
├── package.json           # Dependencies
├── vite.config.js         # Vite configuration
└── README.md              # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher) or **yarn**
- **Backend server** running on `http://localhost:8080`

### Installation

1. **Clone the repository** (if applicable)
   ```bash
   git clone <repository-url>
   cd lcm-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment** (if needed)
   - Firebase configuration is in `src/firebase.js`
   - API base URL is in `src/api/axios.js`

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   - Navigate to `http://localhost:5173`

### Available Scripts

```bash
npm run dev      # Start development server with HMR
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
```

---

## 🏗 Architecture

### Application Flow

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   React Router  │ ──── Routes to pages
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AuthContext    │ ──── Manages auth state
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ProtectedRoute │ ──── Guards routes
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Page Component │ ──── Renders UI
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Axios Client   │ ──── API calls
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Backend API    │
└─────────────────┘
```

### Data Flow

1. **User Action** → Component event handler
2. **API Call** → Axios interceptor adds token
3. **Backend** → Processes request, returns data
4. **Response** → Component updates state
5. **UI Re-render** → React updates DOM

---

## 🧩 Components Documentation

### `<Navbar />`

**Location:** `src/components/Navbar.jsx`

**Purpose:** Main navigation bar with authentication-aware links

**Props:** None (uses `useAuth` hook)

**Features:**
- Shows different links for authenticated/unauthenticated users
- Displays user email when logged in
- Logout functionality

**Usage:**
```jsx
import Navbar from "./components/Navbar";

function App() {
  return (
    <>
      <Navbar />
      {/* Rest of app */}
    </>
  );
}
```

---

### `<ProtectedRoute />`

**Location:** `src/components/ProtectedRoute.jsx`

**Purpose:** Wrapper component that protects routes requiring authentication

**Props:**
- `children` (ReactNode) - The component to render if authenticated

**Behavior:**
- Shows loading spinner while checking auth
- Redirects to `/login` if not authenticated
- Renders children if authenticated

**Usage:**
```jsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

---

## 📄 Pages Documentation

### Home Page

**File:** `src/pages/Home.jsx`

**Route:** `/`

**Access:** Public

**Features:**
- Landing page with feature highlights
- Call-to-action buttons
- Responsive hero section

**Components Used:**
- `Link` from React Router
- `useAuth` hook

---

### Login Page

**File:** `src/pages/Login.jsx`

**Route:** `/login`

**Access:** Public (redirects to dashboard if already logged in)

**Features:**
- Email/password authentication
- Form validation
- Error handling
- Link to signup page

**State:**
- `email` - User email
- `password` - User password
- `error` - Error message
- `loading` - Loading state

**API Calls:**
- Firebase `signInWithEmailAndPassword`

---

### Sign Up Page

**File:** `src/pages/SignUp.jsx`

**Route:** `/signup`

**Access:** Public

**Features:**
- Username, email, password registration
- Client-side validation
- Firebase user creation
- Backend user registration
- Error handling

**State:**
- `username` - Username
- `email` - Email address
- `password` - Password
- `error` - Error message
- `loading` - Loading state

**API Calls:**
- Firebase `createUserWithEmailAndPassword`
- `POST /public/signup`

---

### Dashboard Page

**File:** `src/pages/Dashboard.jsx`

**Route:** `/dashboard`

**Access:** Protected (requires authentication)

**Features:**
- User statistics cards
- Enrolled courses list
- Progress tracking
- Quick navigation

**State:**
- `dashboardData` - Dashboard data from API
- `loading` - Loading state
- `error` - Error message

**API Calls:**
- `GET /dashboard`

**Data Structure:**
```javascript
{
  enrolledCourses: Course[],
  completedTopics: number,
  averageQuizScore: number
}
```

---

### Courses Page

**File:** `src/pages/Courses.jsx`

**Route:** `/courses`

**Access:** Protected

**Features:**
- List all available courses
- Search functionality
- Course cards with details
- Navigation to course details

**State:**
- `courses` - Array of courses
- `loading` - Loading state
- `error` - Error message
- `searchTerm` - Search input value

**API Calls:**
- `GET /courses/all`
- `GET /courses/search?q={keyword}`

---

### Course Details Page

**File:** `src/pages/CourseDetails.jsx`

**Route:** `/courses/:id`

**Access:** Protected

**Features:**
- Course information display
- Enroll/unenroll functionality
- Enrollment status indicator
- Back navigation

**State:**
- `course` - Course details
- `loading` - Loading state
- `error` - Error message
- `isEnrolled` - Enrollment status
- `enrolling` - Enrollment action state

**API Calls:**
- `GET /courses/{id}`
- `GET /enrollments/courses`
- `POST /enrollments/courses/{id}/enroll`
- `DELETE /enrollments/courses/{id}/enroll`

---

## 🔐 Authentication Flow

### Registration Flow

```
1. User fills signup form
   ↓
2. Create Firebase user
   ↓
3. Get Firebase token
   ↓
4. Create user in backend (POST /public/signup)
   ↓
5. Store token in localStorage
   ↓
6. Redirect to dashboard
```

### Login Flow

```
1. User enters credentials
   ↓
2. Firebase authentication
   ↓
3. Get Firebase token
   ↓
4. Store token in localStorage
   ↓
5. Update AuthContext
   ↓
6. Redirect to dashboard
```

### Token Management

- **Storage:** `localStorage.getItem("token")`
- **Refresh:** Automatic via Firebase `getIdToken()`
- **Expiration:** Handled by Firebase SDK
- **Interceptor:** Axios automatically adds token to requests

### AuthContext API

```javascript
const {
  user,              // Firebase user object
  token,             // Current auth token
  loading,           // Auth loading state
  isAuthenticated,   // Boolean auth status
  logout             // Logout function
} = useAuth();
```

---

## 🌐 API Integration

### Axios Configuration

**File:** `src/api/axios.js`

**Base URL:** `http://localhost:8080`

**Features:**
- Automatic token injection
- Token refresh on 401 errors
- Request/response interceptors
- Error handling

### Request Interceptor

```javascript
// Automatically adds Bearer token to all requests
api.interceptors.request.use(async (config) => {
  const token = await getFreshToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### Response Interceptor

```javascript
// Handles 401 errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Refresh token and retry
    }
    return Promise.reject(error);
  }
);
```

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/public/signup` | User registration | No |
| GET | `/dashboard` | User dashboard data | Yes |
| GET | `/courses/all` | List all courses | Yes |
| GET | `/courses/{id}` | Get course details | Yes |
| GET | `/courses/search?q={keyword}` | Search courses | Yes |
| GET | `/enrollments/courses` | Get enrolled courses | Yes |
| POST | `/enrollments/courses/{id}/enroll` | Enroll in course | Yes |
| DELETE | `/enrollments/courses/{id}/enroll` | Unenroll from course | Yes |

---

## 🛣 Routing

### Route Configuration

**File:** `src/App.jsx`

**Routes:**

| Path | Component | Access |
|------|-----------|--------|
| `/` | Home | Public |
| `/login` | Login | Public |
| `/signup` | SignUp | Public |
| `/dashboard` | Dashboard | Protected |
| `/courses` | Courses | Protected |
| `/courses/:id` | CourseDetails | Protected |

### Route Protection

All protected routes are wrapped with `<ProtectedRoute />`:

```jsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### Navigation

Use React Router's `Link` component:

```jsx
import { Link } from "react-router-dom";

<Link to="/dashboard">Go to Dashboard</Link>
```

Programmatic navigation:

```jsx
import { useNavigate } from "react-router-dom";

const navigate = useNavigate();
navigate("/dashboard");
```

---

## 🎨 Styling Guidelines

### Tailwind CSS

**Version:** 4.1.17

**Configuration:** No config file needed (v4 uses CSS imports)

**Import:** `@import "tailwindcss";` in `index.css`

### Utility Classes

Common patterns:

```jsx
// Container
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

// Card
<div className="bg-white shadow rounded-lg p-6">

// Button
<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">

// Input
<input className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500">
```

### Responsive Design

- **Mobile-first** approach
- Breakpoints: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Example: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

### Color Scheme

- **Primary:** Blue (`blue-600`, `blue-700`)
- **Success:** Green (`green-500`, `green-600`)
- **Error:** Red (`red-600`, `red-700`)
- **Warning:** Yellow (`yellow-500`, `yellow-600`)

---

## 📊 State Management

### Local State

Use `useState` for component-specific state:

```jsx
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
```

### Global State

Use `AuthContext` for authentication state:

```jsx
import { useAuth } from "../context/AuthContext";

const { user, isAuthenticated, logout } = useAuth();
```

### Data Fetching

Pattern for API calls:

```jsx
useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/endpoint");
      setData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

---

## ⚠️ Error Handling

### API Errors

```jsx
try {
  const response = await api.get("/endpoint");
} catch (err) {
  if (err.code === 'ECONNREFUSED') {
    // Backend not running
  } else if (err.response?.status === 401) {
    // Unauthorized
  } else if (err.response?.status === 403) {
    // Forbidden
  } else {
    // Other errors
  }
}
```

### User Feedback

- **Error Messages:** Red alert boxes
- **Loading States:** Spinners
- **Success Messages:** Green notifications

### Error Display Pattern

```jsx
{error && (
  <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
    {error}
  </div>
)}
```

---

## 💻 Development Workflow

### Code Structure

1. **Components** - Reusable UI elements
2. **Pages** - Full page components
3. **Context** - Global state management
4. **API** - HTTP client configuration

### Best Practices

- ✅ Use functional components
- ✅ Use hooks for state and effects
- ✅ Keep components small and focused
- ✅ Extract reusable logic to hooks
- ✅ Handle loading and error states
- ✅ Use TypeScript (if migrating)

### Code Style

- **Naming:** PascalCase for components, camelCase for functions
- **File Structure:** One component per file
- **Imports:** Group by type (React, third-party, local)

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] User registration
- [ ] User login/logout
- [ ] Protected route access
- [ ] Dashboard data loading
- [ ] Course listing
- [ ] Course enrollment
- [ ] Error handling
- [ ] Responsive design

### Browser Testing

Test in:
- Chrome/Edge (Chromium)
- Firefox
- Safari (if on Mac)

---

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

Output: `dist/` directory

### Environment Variables

Create `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_FIREBASE_API_KEY=your-key
```

Access in code: `import.meta.env.VITE_API_BASE_URL`

### Deployment Options

- **Vercel** - Recommended for React apps
- **Netlify** - Easy deployment
- **AWS S3 + CloudFront** - Enterprise option
- **Docker** - Containerized deployment

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Tailwind CSS Not Working

**Solution:**
- Ensure `@import "tailwindcss";` is in `index.css`
- Restart dev server
- Clear browser cache

#### 2. API Connection Errors

**Solution:**
- Verify backend is running on `http://localhost:8080`
- Check CORS configuration in backend
- Verify Firebase token is valid

#### 3. Authentication Issues

**Solution:**
- Check browser console for errors
- Verify Firebase configuration
- Clear localStorage and re-login
- Check token expiration

#### 4. Routing Not Working

**Solution:**
- Ensure all routes are in `<Routes>` component
- Check route paths match exactly
- Verify `BrowserRouter` wraps the app

#### 5. Build Errors

**Solution:**
- Delete `node_modules` and reinstall
- Clear Vite cache: `rm -rf node_modules/.vite`
- Check for syntax errors

---

## 📚 Additional Resources

### Documentation Links

- [React Documentation](https://react.dev)
- [React Router](https://reactrouter.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Firebase Auth](https://firebase.google.com/docs/auth)
- [Axios](https://axios-http.com)
- [Vite](https://vite.dev)

### Project-Specific

- Backend API: See `POSTMAN_TESTING_GUIDE.md`
- Architecture: See `FRONTEND_STRUCTURE.md`
- Setup: See `SETUP_GUIDE.md`

---

## 📝 Development Notes

### Current Status

- ✅ Authentication system
- ✅ Basic routing
- ✅ Dashboard page
- ✅ Courses listing
- ✅ Course details
- ⏳ Course content viewing (TODO)
- ⏳ Quiz functionality (TODO)
- ⏳ Progress tracking (TODO)

### Future Enhancements

1. **Course Content**
   - Chapter/Topic viewer
   - Video player integration
   - PDF viewer
   - Progress tracking

2. **Quizzes**
   - Quiz taking interface
   - Timer functionality
   - Results display
   - Score history

3. **User Profile**
   - Profile editing
   - Certificate viewing
   - Achievement badges
   - Learning history

4. **Admin Panel**
   - Course management
   - User management
   - Analytics dashboard

---

## 👥 Contributing

### Development Guidelines

1. Create feature branch
2. Follow code style
3. Test thoroughly
4. Update documentation
5. Submit pull request

---

## 📄 License

[Add your license information here]

---

**Last Updated:** November 2024
**Version:** 1.0.0

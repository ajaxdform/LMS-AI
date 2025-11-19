import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";
import ChapterList from "./pages/ChapterList";
import TopicList from "./pages/TopicList";
import TopicDetails from "./pages/TopicDetails";
import QuizPage from "./pages/QuizPage";
import CertificatePage from "./pages/CertificatePage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminProgress from "./pages/admin/AdminProgress";
import AdminCache from "./pages/admin/AdminCache";
import AdminChapters from "./pages/admin/AdminChapters";
import AdminTopics from "./pages/admin/AdminTopics";
import AdminQuizzes from "./pages/admin/AdminQuizzes";
import EmailPreferences from "./pages/EmailPreferences";
import Profile from "./pages/Profile";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses"
              element={<Courses />}
            />
            <Route
              path="/courses/:id"
              element={<CourseDetails />}
            />
            <Route
              path="/courses/:courseId/chapters"
              element={<ChapterList />}
            />
            <Route
              path="/courses/:courseId/chapters/:chapterId/topics"
              element={
                <ProtectedRoute>
                  <TopicList />
                </ProtectedRoute>
              }
            />
            {/* Keep old route for backward compatibility */}
            <Route
              path="/chapters/:chapterId/topics"
              element={
                <ProtectedRoute>
                  <TopicList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/topics/:topicId"
              element={
                <ProtectedRoute>
                  <TopicDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chapters/:chapterId/quiz"
              element={
                <ProtectedRoute>
                  <QuizPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/email-preferences"
              element={
                <ProtectedRoute>
                  <EmailPreferences />
                </ProtectedRoute>
              }
            />
            <Route
              path="/certificates/:courseId"
              element={
                <ProtectedRoute>
                  <CertificatePage />
                </ProtectedRoute>
              }
            />
            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute adminOnly>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/courses"
              element={
                <ProtectedRoute adminOnly>
                  <AdminCourses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/progress"
              element={
                <ProtectedRoute adminOnly>
                  <AdminProgress />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/cache"
              element={
                <ProtectedRoute adminOnly>
                  <AdminCache />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/courses/:courseId/chapters"
              element={
                <ProtectedRoute adminOnly>
                  <AdminChapters />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/chapters/:chapterId/topics"
              element={
                <ProtectedRoute adminOnly>
                  <AdminTopics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/chapters/:chapterId/quiz"
              element={
                <ProtectedRoute adminOnly>
                  <AdminQuizzes />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await api.get(`/courses/${id}`);
        console.log("Course response:", response.data);
        setCourse(response.data.data);
        
        // Check if user is enrolled (only if logged in)
        if (user) {
          try {
            const enrollmentsResponse = await api.get("/enrollments/courses");
            console.log("Enrollments response:", enrollmentsResponse.data);
            const enrolledCourses = enrollmentsResponse.data.data || [];
            console.log("Checking enrollment for course ID:", id);
            console.log("Enrolled course IDs:", enrolledCourses.map(c => c.courseId || c.id));
            // Check both courseId and id fields to handle different API response formats
            const enrolled = enrolledCourses.some((c) => c.id === id || c.courseId === id);
            console.log("Is enrolled:", enrolled);
            setIsEnrolled(enrolled);
          } catch (enrollErr) {
            console.error("Error checking enrollment:", enrollErr);
            setIsEnrolled(false);
          }
        } else {
          setIsEnrolled(false);
        }
      } catch (err) {
        console.error("Error fetching course:", err);
        if (err.response?.status === 404) {
          setError("Course not found. It may have been deleted.");
        } else if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
          setError("Cannot connect to backend. Please ensure the backend server is running.");
        } else {
          setError(`Failed to load course details: ${err.message || 'Unknown error'}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, user]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      if (window.confirm("You need to log in to enroll in this course. Would you like to go to the login page?")) {
        navigate("/login", { state: { from: `/courses/${id}` } });
      }
      return;
    }

    setEnrolling(true);
    try {
      await api.post(`/enrollments/courses/${id}/enroll`);
      setIsEnrolled(true);
      alert("Successfully enrolled in course!");
    } catch (err) {
      console.error("Error enrolling:", err);
      alert("Failed to enroll in course. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async () => {
    if (!window.confirm("Are you sure you want to unenroll from this course?")) {
      return;
    }

    setEnrolling(true);
    try {
      await api.delete(`/enrollments/courses/${id}/enroll`);
      setIsEnrolled(false);
      alert("Successfully unenrolled from course!");
    } catch (err) {
      console.error("Error unenrolling:", err);
      alert("Failed to unenroll from course. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || "Course not found"}
        </div>
        <button
          onClick={() => navigate("/courses")}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Courses
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate("/courses")}
        className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Courses
      </button>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {course.subject && (
                <span className="inline-block bg-white/20 text-white text-sm font-semibold px-3 py-1 rounded-full mb-3">
                  {course.subject}
                </span>
              )}
              <h1 className="text-4xl font-bold text-white mb-4">
                {course.title}
              </h1>
              <div 
                className="text-blue-100 text-lg mb-6 quill-content"
                dangerouslySetInnerHTML={{ __html: course.description }}
              />
              
              {/* Quick Stats */}
              <div className="flex flex-wrap gap-6 text-white">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="font-semibold">{course.chapterIds?.length || 0} Chapters</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">~{(course.chapterIds?.length || 0) * 2}-{(course.chapterIds?.length || 0) * 3} hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="font-semibold">Self-paced</span>
                </div>
              </div>
            </div>
            
            {/* Enroll Button */}
            <div className="ml-8">
              {user ? (
                isEnrolled ? (
                  <button
                    onClick={handleUnenroll}
                    disabled={enrolling}
                    className="bg-white/10 hover:bg-white/20 text-white border-2 border-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 transition-all"
                  >
                    {enrolling ? "Unenrolling..." : "Unenroll"}
                  </button>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-3 rounded-lg font-semibold disabled:opacity-50 shadow-lg transition-all transform hover:-translate-y-1"
                  >
                    {enrolling ? "Enrolling..." : "Enroll Now"}
                  </button>
                )
              ) : (
                <Link
                  to="/login"
                  className="inline-block bg-white hover:bg-gray-100 text-blue-600 px-8 py-3 rounded-lg font-semibold shadow-lg transition-all transform hover:-translate-y-1"
                >
                  Log In to Enroll
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* What You'll Learn */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              What You'll Learn
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-gray-700">Master core concepts and fundamentals of {course.subject || 'the subject'}</p>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-gray-700">Apply practical skills through hands-on exercises and quizzes</p>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-gray-700">Build confidence with structured learning paths</p>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-gray-700">Earn a certificate upon successful completion</p>
              </div>
            </div>
          </div>

          {/* Course Overview */}
          <div className="mb-8 bg-gray-50 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Course Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Total Chapters</h3>
                  <p className="text-2xl font-bold text-blue-600">{course.chapterIds?.length || 0}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Estimated Time</h3>
                  <p className="text-2xl font-bold text-green-600">{(course.chapterIds?.length || 0) * 2}-{(course.chapterIds?.length || 0) * 3}h</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Difficulty</h3>
                  <p className="text-2xl font-bold text-purple-600">All Levels</p>
                </div>
              </div>
            </div>
          </div>

          {isEnrolled && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800 font-medium">
                  ✓ You are enrolled in this course
                </p>
              </div>
              <button
                onClick={() => navigate(`/courses/${id}/chapters`)}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-md font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                View Chapters & Start Learning
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


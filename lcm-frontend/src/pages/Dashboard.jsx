import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get("/dashboard");
        setDashboardData(response.data.data);
      } catch (err) {
        console.error("Error fetching dashboard:", err);
        if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
          setError("Cannot connect to backend. Please ensure the backend server is running on http://localhost:8080");
        } else if (err.response?.status === 401) {
          setError("Authentication failed. Please log in again.");
        } else if (err.response?.status === 403) {
          setError("Access denied. You don't have permission to access this resource.");
        } else if (err.response?.data) {
          setError(`Error: ${err.response.data.message || err.response.data}`);
        } else {
          setError(`Failed to load dashboard data: ${err.message || 'Unknown error'}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
          <p className="font-semibold mb-2">Troubleshooting Steps:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Ensure the backend server is running on http://localhost:8080</li>
            <li>Check browser console (F12) for detailed error messages</li>
            <li>Verify you are logged in and have a valid authentication token</li>
            <li>Try refreshing the page or logging out and back in</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-600">Welcome back, {user?.email}</p>
      </div>

      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">C</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Enrolled Courses
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardData.enrolledCourses?.length || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">P</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Average Progress
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardData.enrolledCourses?.length > 0
                        ? `${(dashboardData.enrolledCourses.reduce((sum, c) => sum + (c.progressPercentage || 0), 0) / dashboardData.enrolledCourses.length).toFixed(0)}%`
                        : "0%"}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">Q</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Quiz Average
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardData.enrolledCourses?.length > 0 && 
                       dashboardData.enrolledCourses.some(c => c.averageQuizScore > 0)
                        ? `${(dashboardData.enrolledCourses.reduce((sum, c) => sum + (c.averageQuizScore || 0), 0) / dashboardData.enrolledCourses.filter(c => c.averageQuizScore > 0).length).toFixed(1)}%`
                        : "N/A"}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            My Enrolled Courses
          </h2>
          {dashboardData?.enrolledCourses?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.enrolledCourses.map((course) => (
                <Link
                  key={course.courseId}
                  to={`/courses/${course.courseId}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {course.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {course.subject}
                  </p>
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Progress:</span>
                      <span className="font-medium text-blue-600">
                        {course.progressPercentage?.toFixed(0) || 0}%
                      </span>
                    </div>
                    {course.averageQuizScore > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Quiz Average:</span>
                        <span className="font-medium text-green-600">
                          {course.averageQuizScore?.toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet.</p>
              <Link
                to="/courses"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Browse Courses
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


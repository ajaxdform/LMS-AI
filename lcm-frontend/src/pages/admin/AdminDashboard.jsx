import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [courseStats, setCourseStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const isRefresh = !loading;
    if (isRefresh) setRefreshing(true);
    
    try {
      const [dashboardRes, userStatsRes, courseStatsRes] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/users/stats'),
        api.get('/admin/courses/stats')
      ]);
      
      setStats(dashboardRes.data.data);
      setUserStats(userStatsRes.data.data);
      setCourseStats(courseStatsRes.data.data);
      setError('');
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculatePercentage = (value, total) => {
    if (!total || total === 0) return 0;
    return ((value / total) * 100).toFixed(1);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Overview of your LMS platform</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={refreshing}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 transition-colors"
        >
          <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold mt-2">{stats?.userStats?.totalUsers || 0}</p>
              <p className="text-blue-100 text-xs mt-2">
                {stats?.userStats?.totalStudents || 0} students, {stats?.userStats?.totalAdmins || 0} admins
              </p>
            </div>
            <div className="bg-blue-400 bg-opacity-30 p-3 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Courses */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Courses</p>
              <p className="text-3xl font-bold mt-2">{stats?.courseStats?.totalCourses || 0}</p>
              <p className="text-green-100 text-xs mt-2">Active courses</p>
            </div>
            <div className="bg-green-400 bg-opacity-30 p-3 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Chapters */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Chapters</p>
              <p className="text-3xl font-bold mt-2">{stats?.courseStats?.totalChapters || 0}</p>
              <p className="text-purple-100 text-xs mt-2">Across all courses</p>
            </div>
            <div className="bg-purple-400 bg-opacity-30 p-3 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Quizzes */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Total Quizzes</p>
              <p className="text-3xl font-bold mt-2">{stats?.courseStats?.totalQuizzes || 0}</p>
              <p className="text-orange-100 text-xs mt-2">Assessment tools</p>
            </div>
            <div className="bg-orange-400 bg-opacity-30 p-3 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">User Statistics</h3>
            <Link to="/admin/users" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All →
            </Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Students</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(stats?.userStats?.totalStudents)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">of total users</p>
                <p className="text-sm font-semibold text-blue-600">
                  {calculatePercentage(stats?.userStats?.totalStudents, stats?.userStats?.totalUsers)}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Administrators</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(stats?.userStats?.totalAdmins)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">of total users</p>
                <p className="text-sm font-semibold text-purple-600">
                  {calculatePercentage(stats?.userStats?.totalAdmins, stats?.userStats?.totalUsers)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Course Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Content Overview</h3>
            <Link to="/admin/courses" className="text-green-600 hover:text-green-800 text-sm font-medium">
              Manage →
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 border-l-4 border-green-500 bg-gray-50 rounded">
              <div>
                <p className="text-xs text-gray-600 uppercase">Courses</p>
                <p className="text-xl font-bold text-gray-900">{formatNumber(stats?.courseStats?.totalCourses)}</p>
              </div>
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>

            <div className="flex justify-between items-center p-3 border-l-4 border-purple-500 bg-gray-50 rounded">
              <div>
                <p className="text-xs text-gray-600 uppercase">Chapters</p>
                <p className="text-xl font-bold text-gray-900">{formatNumber(stats?.courseStats?.totalChapters)}</p>
              </div>
              <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            <div className="flex justify-between items-center p-3 border-l-4 border-blue-500 bg-gray-50 rounded">
              <div>
                <p className="text-xs text-gray-600 uppercase">Topics</p>
                <p className="text-xl font-bold text-gray-900">{formatNumber(stats?.courseStats?.totalTopics)}</p>
              </div>
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>

            <div className="flex justify-between items-center p-3 border-l-4 border-orange-500 bg-gray-50 rounded">
              <div>
                <p className="text-xs text-gray-600 uppercase">Quizzes</p>
                <p className="text-xl font-bold text-gray-900">{formatNumber(stats?.courseStats?.totalQuizzes)}</p>
              </div>
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/admin/users"
            className="bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-500 p-6 rounded-lg transition-all duration-200 group"
          >
            <div className="flex items-center mb-3">
              <div className="bg-blue-100 group-hover:bg-blue-500 p-2 rounded-lg transition-colors">
                <svg className="w-6 h-6 text-blue-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Manage Users</h3>
            <p className="text-gray-600 text-sm">View, edit roles, and manage all users in the system</p>
          </Link>

          <Link
            to="/admin/courses"
            className="bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-green-500 p-6 rounded-lg transition-all duration-200 group"
          >
            <div className="flex items-center mb-3">
              <div className="bg-green-100 group-hover:bg-green-500 p-2 rounded-lg transition-colors">
                <svg className="w-6 h-6 text-green-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Manage Courses</h3>
            <p className="text-gray-600 text-sm">Create, edit, and delete courses and their content</p>
          </Link>

          <Link
            to="/admin/progress"
            className="bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-purple-500 p-6 rounded-lg transition-all duration-200 group"
          >
            <div className="flex items-center mb-3">
              <div className="bg-purple-100 group-hover:bg-purple-500 p-2 rounded-lg transition-colors">
                <svg className="w-6 h-6 text-purple-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Monitor Progress</h3>
            <p className="text-gray-600 text-sm">View student progress and learning analytics</p>
          </Link>

          <Link
            to="/admin/cache"
            className="bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-orange-500 p-6 rounded-lg transition-all duration-200 group"
          >
            <div className="flex items-center mb-3">
              <div className="bg-orange-100 group-hover:bg-orange-500 p-2 rounded-lg transition-colors">
                <svg className="w-6 h-6 text-orange-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Cache Management</h3>
            <p className="text-gray-600 text-sm">Monitor and manage application caches</p>
          </Link>
        </div>
      </div>

      {/* Platform Health & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Content Health */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Content Health</h3>
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Avg Chapters per Course</span>
                <span className="font-semibold text-gray-900">
                  {((stats?.courseStats?.totalChapters || 0) / (stats?.courseStats?.totalCourses || 1)).toFixed(1)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(((stats?.courseStats?.totalChapters || 0) / (stats?.courseStats?.totalCourses || 1)) * 10, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Avg Topics per Chapter</span>
                <span className="font-semibold text-gray-900">
                  {((stats?.courseStats?.totalTopics || 0) / (stats?.courseStats?.totalChapters || 1)).toFixed(1)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(((stats?.courseStats?.totalTopics || 0) / (stats?.courseStats?.totalChapters || 1)) * 10, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Quiz Coverage</span>
                <span className="font-semibold text-gray-900">
                  {calculatePercentage(stats?.courseStats?.totalQuizzes, stats?.courseStats?.totalChapters)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full" 
                  style={{ width: `${calculatePercentage(stats?.courseStats?.totalQuizzes, stats?.courseStats?.totalChapters)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* User Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">User Distribution</h3>
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Students</span>
                <span className="text-sm font-bold text-blue-600">
                  {formatNumber(stats?.userStats?.totalStudents)} ({calculatePercentage(stats?.userStats?.totalStudents, stats?.userStats?.totalUsers)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full" 
                  style={{ width: `${calculatePercentage(stats?.userStats?.totalStudents, stats?.userStats?.totalUsers)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Administrators</span>
                <span className="text-sm font-bold text-purple-600">
                  {formatNumber(stats?.userStats?.totalAdmins)} ({calculatePercentage(stats?.userStats?.totalAdmins, stats?.userStats?.totalUsers)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-purple-400 to-purple-600 h-3 rounded-full" 
                  style={{ width: `${calculatePercentage(stats?.userStats?.totalAdmins, stats?.userStats?.totalUsers)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* System Summary */}
        <div className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">System Summary</h3>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-gray-600">
              <span className="text-sm text-gray-300">Total Content Items</span>
              <span className="text-xl font-bold">
                {formatNumber((stats?.courseStats?.totalCourses || 0) + (stats?.courseStats?.totalChapters || 0) + (stats?.courseStats?.totalTopics || 0))}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-600">
              <span className="text-sm text-gray-300">Active Users</span>
              <span className="text-xl font-bold">{formatNumber(stats?.userStats?.totalUsers)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Assessment Tools</span>
              <span className="text-xl font-bold">{formatNumber(stats?.courseStats?.totalQuizzes)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

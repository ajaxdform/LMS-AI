import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Pagination from '../../components/Pagination';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../hooks/useConfirm.jsx';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [userDashboard, setUserDashboard] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  
  const toast = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (page = 0) => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/users?page=${page}&size=${pageSize}`);
      const pageData = response.data.data;
      setUsers(pageData.content || []);
      setCurrentPage(pageData.number || 0);
      setTotalPages(pageData.totalPages || 0);
      setTotalElements(pageData.totalElements || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchUsers(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRoleChange = async (userId, newRole, currentRole) => {
    if (currentRole === newRole) return;
    
    const confirmed = await confirm({
      title: 'Change User Role',
      message: `Are you sure you want to change this user's role to ${newRole}?`,
      confirmText: 'Change Role'
    });

    if (!confirmed) return;

    setUpdating(userId);
    try {
      await api.put(`/admin/users/${userId}/role?role=${newRole}`);
      toast.success('User role updated successfully');
      fetchUsers(currentPage);
      if (selectedUser?.id === userId) {
        fetchUserDetails(userId);
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update user role');
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    const confirmed = await confirm({
      title: 'Delete User',
      message: `Are you sure you want to delete "${username}"? This will permanently delete their account and all progress data. This action cannot be undone.`,
      confirmText: 'Delete User',
      confirmColor: 'red'
    });

    if (!confirmed) return;
    
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted successfully');
      if (selectedUser?.id === userId) {
        setShowDetails(false);
        setSelectedUser(null);
      }
      fetchUsers(currentPage);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      setSelectedUser(response.data.data);
      setShowDetails(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to load user details');
    }
  };

  const fetchUserDashboard = async (userId, username) => {
    setLoadingDashboard(true);
    setShowDashboard(true);
    try {
      console.log('Fetching dashboard for user:', userId);
      const response = await api.get(`/dashboard/${userId}`);
      console.log('Dashboard response:', response.data);
      
      if (!response.data || !response.data.data) {
        console.error('Invalid dashboard data structure:', response.data);
        toast.error('Invalid dashboard data received');
        setShowDashboard(false);
        return;
      }
      
      setUserDashboard({ ...response.data.data, username });
    } catch (error) {
      console.error('Error fetching user dashboard:', error);
      console.error('Error details:', error.response?.data);
      toast.error(`Failed to load user dashboard: ${error.response?.data?.message || error.message}`);
      setShowDashboard(false);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const handleSearch = () => {
    fetchUsers(0);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ConfirmDialog />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="mt-2 text-gray-600">Manage users, roles, and view detailed information</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by username or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="md:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="STUDENT">Students</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>
          
          {(searchTerm || roleFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium whitespace-nowrap"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Courses
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user.username.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.username}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value, user.role)}
                    disabled={updating === user.id}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user.role === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-800 border border-purple-300' 
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-medium">
                    {user.enrolledCourseIds?.length || 0}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => fetchUserDetails(user.id)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => fetchUserDashboard(user.id, user.username)}
                      className="text-green-600 hover:text-green-900 font-medium"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      className="text-red-600 hover:text-red-900 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && users.length > 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
          </div>
        )}

        {users.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users</h3>
            <p className="mt-1 text-sm text-gray-500">No users registered yet.</p>
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalElements={totalElements}
        pageSize={pageSize}
      />

      {/* User Details Modal */}
      {showDetails && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setShowDetails(false)}>
          <div className="relative top-20 mx-auto p-8 border w-full max-w-3xl shadow-lg rounded-lg bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">User Details</h3>
                <p className="text-sm text-gray-500 mt-1">Detailed information about {selectedUser.username}</p>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Profile Section */}
              <div className="flex items-center pb-6 border-b border-gray-200">
                <div className="flex-shrink-0 h-20 w-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {selectedUser.username.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="ml-6">
                  <h4 className="text-xl font-semibold text-gray-900">{selectedUser.username}</h4>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  <div className="mt-2">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedUser.role === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedUser.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">User ID</div>
                  <div className="text-sm font-mono text-gray-900 break-all">{selectedUser.id}</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Account Created</div>
                  <div className="text-sm font-medium text-gray-900">{formatDate(selectedUser.createdAt)}</div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-600 mb-1 font-medium">Enrolled Courses</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {selectedUser.enrolledCourseIds?.length || 0}
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-600 mb-1 font-medium">User Role</div>
                  <div className="text-lg font-semibold text-green-900">
                    {selectedUser.role === 'ADMIN' ? 'Administrator' : 'Student'}
                  </div>
                </div>
              </div>

              {/* Enrolled Courses Section */}
              {selectedUser.enrolledCourseIds && selectedUser.enrolledCourseIds.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <h5 className="text-lg font-semibold text-gray-900 mb-3">Enrolled Course IDs</h5>
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                    {selectedUser.enrolledCourseIds.map((courseId, index) => (
                      <div key={index} className="bg-gray-50 px-4 py-2 rounded text-sm font-mono text-gray-700 border border-gray-200">
                        {courseId}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    handleDeleteUser(selectedUser.id, selectedUser.username);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Dashboard Modal */}
      {showDashboard && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setShowDashboard(false)}>
          <div className="relative top-10 mx-auto p-8 border w-full max-w-6xl shadow-lg rounded-lg bg-white mb-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">User Dashboard</h3>
                <p className="text-sm text-gray-500 mt-1">Viewing dashboard for {userDashboard?.username}</p>
              </div>
              <button
                onClick={() => setShowDashboard(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingDashboard ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : userDashboard ? (
              <div className="space-y-6">
                {/* User Info Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Enrolled Courses</p>
                        <p className="text-3xl font-bold mt-2">{userDashboard.enrolledCourses?.length || 0}</p>
                      </div>
                      <svg className="w-12 h-12 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">Total Progress</p>
                        <p className="text-3xl font-bold mt-2">
                          {userDashboard.enrolledCourses?.reduce((sum, c) => sum + (c.overallProgress || 0), 0).toFixed(0)}%
                        </p>
                      </div>
                      <svg className="w-12 h-12 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">Avg Quiz Score</p>
                        <p className="text-3xl font-bold mt-2">
                          {userDashboard.enrolledCourses?.reduce((sum, c) => sum + (c.averageQuizScore || 0), 0) / (userDashboard.enrolledCourses?.length || 1) || 0}%
                        </p>
                      </div>
                      <svg className="w-12 h-12 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Enrolled Courses List */}
                {userDashboard.enrolledCourses && userDashboard.enrolledCourses.length > 0 ? (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Enrolled Courses</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userDashboard.enrolledCourses.map((course) => (
                        <div key={course.courseId} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h5 className="font-semibold text-gray-900">{course.title}</h5>
                              {course.subject && (
                                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded mt-1">
                                  {course.subject}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Overall Progress</span>
                                <span className="font-semibold text-gray-900">{course.overallProgress?.toFixed(1) || 0}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full transition-all" 
                                  style={{ width: `${course.overallProgress || 0}%` }}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="bg-gray-50 p-2 rounded">
                                <p className="text-gray-600 text-xs">Completed Chapters</p>
                                <p className="font-semibold text-gray-900">{course.completedChapters || 0} / {course.totalChapters || 0}</p>
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <p className="text-gray-600 text-xs">Quiz Score</p>
                                <p className="font-semibold text-gray-900">{course.averageQuizScore?.toFixed(1) || 0}%</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Enrolled Courses</h3>
                    <p className="mt-1 text-sm text-gray-500">This user hasn't enrolled in any courses yet.</p>
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
              <button
                onClick={() => setShowDashboard(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

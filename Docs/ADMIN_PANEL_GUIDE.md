# Admin Panel Implementation Guide

## Backend Implementation ✅ COMPLETE

### 1. User Roles
- **Location**: `com.devlcm.lcm.entity.UserRole`
- **Roles**: STUDENT (default), ADMIN
- **User entity** updated with UserRole enum field

### 2. AdminService (Microservice-like Architecture)
- **Location**: `com.devlcm.lcm.service.AdminService`
- **Purpose**: Independent service handling all admin operations
- **Features**:
  - ✅ User Management (view, update role, delete)
  - ✅ Course Management (create, update, delete)
  - ✅ Chapter Management (create, update, delete)
  - ✅ Topic Management (create, update, delete)
  - ✅ Quiz Management (create, update, delete)
  - ✅ Statistics & Monitoring (dashboard stats, user progress)

### 3. AdminController
- **Location**: `com.devlcm.lcm.controller.AdminController`
- **Base Path**: `/api/v1/admin`
- **Rate Limit**: 200 requests per minute (higher than regular users)
- **Endpoints**:

#### Dashboard & Statistics
- `GET /admin/dashboard/stats` - Get comprehensive dashboard statistics
- `GET /admin/users/stats` - Get user statistics
- `GET /admin/courses/stats` - Get course statistics

#### User Management  
- `GET /admin/users` - Get all users (paginated)
- `GET /admin/users/{userId}` - Get user by ID
- `PUT /admin/users/{userId}/role?role=ADMIN` - Update user role
- `DELETE /admin/users/{userId}` - Delete user

#### Course Management
- `POST /admin/courses` - Create new course
- `PUT /admin/courses/{courseId}` - Update course
- `DELETE /admin/courses/{courseId}` - Delete course (cascades to chapters/topics/quizzes)

#### Chapter Management
- `POST /admin/courses/{courseId}/chapters` - Create new chapter
- `PUT /admin/chapters/{chapterId}` - Update chapter
- `DELETE /admin/chapters/{chapterId}` - Delete chapter (cascades to topics/quizzes)

#### Topic Management
- `POST /admin/chapters/{chapterId}/topics` - Create new topic
- `PUT /admin/topics/{topicId}` - Update topic
- `DELETE /admin/topics/{topicId}` - Delete topic (cascades to quizzes)

#### Quiz Management
- `POST /admin/topics/{topicId}/quizzes` - Create new quiz
- `PUT /admin/quizzes/{quizId}` - Update quiz
- `DELETE /admin/quizzes/{quizId}` - Delete quiz

#### Monitoring
- `GET /admin/progress` - Get all user progress (paginated)

### 4. Repository Updates
- ✅ `UserRepository.countByRole()` added
- ✅ `UserProgressRepository.deleteByUserId()` added

## Frontend Implementation TODO

### 1. Admin Authentication Check
Create a hook to check if user is admin:

```javascript
// src/hooks/useAdmin.js
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Get current user details to check role
        const response = await api.get('/users/me');
        setIsAdmin(response.data.data.role === 'ADMIN');
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [user]);

  return { isAdmin, loading };
};
```

### 2. Update Navbar to Show Admin Panel
```javascript
// src/components/Navbar.jsx
import { useAdmin } from '../hooks/useAdmin';

const { isAdmin } = useAdmin();

// Add to navigation links
{isAdmin && (
  <Link
    to="/admin"
    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
  >
    Admin Panel
  </Link>
)}
```

### 3. Create Admin Dashboard Page
```javascript
// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/dashboard/stats');
        setStats(response.data.data);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
          <p className="text-3xl font-bold text-gray-900">{stats?.userStats.totalUsers || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Courses</h3>
          <p className="text-3xl font-bold text-blue-600">{stats?.courseStats.totalCourses || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Chapters</h3>
          <p className="text-3xl font-bold text-green-600">{stats?.courseStats.totalChapters || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Quizzes</h3>
          <p className="text-3xl font-bold text-purple-600">{stats?.courseStats.totalQuizzes || 0}</p>
        </div>
      </div>

      {/* Management Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/admin/users" className="bg-blue-50 hover:bg-blue-100 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-blue-900 mb-2">Manage Users</h3>
          <p className="text-blue-700">View, edit roles, and manage all users</p>
        </Link>
        <Link to="/admin/courses" className="bg-green-50 hover:bg-green-100 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-green-900 mb-2">Manage Courses</h3>
          <p className="text-green-700">Create, edit, and delete courses</p>
        </Link>
        <Link to="/admin/progress" className="bg-purple-50 hover:bg-purple-100 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-purple-900 mb-2">Monitor Progress</h3>
          <p className="text-purple-700">View all student progress and analytics</p>
        </Link>
      </div>
    </div>
  );
}
```

### 4. Create Admin Management Pages

#### User Management Page
```javascript
// src/pages/admin/AdminUsers.jsx
import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.data.content);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role?role=${newRole}`);
      alert('User role updated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await api.delete(`/admin/users/${userId}`);
      alert('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">User Management</h1>

      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

#### Course Management Page
```javascript
// src/pages/admin/AdminCourses.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', subject: '' });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses/all');
      setCourses(response.data.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/courses', formData);
      alert('Course created successfully');
      setShowForm(false);
      setFormData({ title: '', description: '', subject: '' });
      fetchCourses();
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Failed to create course');
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Delete this course and all its content?')) return;
    
    try {
      await api.delete(`/admin/courses/${courseId}`);
      alert('Course deleted successfully');
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Course Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Create New Course'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                rows="3"
              />
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Create Course
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
            <p className="text-gray-600 mb-4">{course.subject}</p>
            <div className="flex gap-2">
              <Link
                to={`/admin/courses/${course.id}/chapters`}
                className="text-blue-600 hover:text-blue-800"
              >
                Manage Chapters
              </Link>
              <button
                onClick={() => handleDelete(course.id)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5. Update App.jsx Routing
```javascript
// Add admin routes
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourses from './pages/admin/AdminCourses';

// Add routes in App.jsx
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
```

### 6. Update ProtectedRoute Component
```javascript
// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAdmin } from "../hooks/useAdmin";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  if (loading || (adminOnly && adminLoading)) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}
```

## Testing the Admin Panel

### 1. Create an Admin User
Use MongoDB Compass or mongo shell:
```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "ADMIN" } }
)
```

### 2. Test API Endpoints
Use Postman or cURL:
```bash
# Get dashboard stats
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8080/api/v1/admin/dashboard/stats

# Create a course
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"title":"New Course","subject":"Math","description":"Test"}' \
     http://localhost:8080/api/v1/admin/courses
```

## Security Notes

### TODO: Add Spring Security Role-Based Authorization
Currently, endpoints are not protected by Spring Security. You need to add:

1. Update `SecurityConfig.java`:
```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
            .requestMatchers("/api/v1/**").authenticated()
        );
    return http.build();
}
```

2. Update Firebase token validation to extract and set roles in SecurityContext

## Architecture Benefits

✅ **Microservice-like Independence**: AdminService is completely isolated
✅ **Clean Separation**: Admin operations separate from student operations  
✅ **Easy to Maintain**: All admin logic in one place
✅ **Scalable**: Can easily move to separate microservice if needed
✅ **Type-Safe**: Uses DTOs and validation throughout
✅ **Cascading Deletes**: Deleting parent entities automatically cleans up children

## Summary

- **Backend**: ✅ Complete with AdminService and AdminController
- **Frontend**: 🔲 Needs implementation (detailed guide provided above)
- **Security**: ⚠️ Needs Spring Security role checking
- **Testing**: 🔲 Needs admin user creation and testing

Next steps: Implement the frontend admin pages following the guide above!

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../hooks/useConfirm.jsx';
import Pagination from '../../components/Pagination';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', subject: '' });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(12);
  const [editorKey, setEditorKey] = useState(0);
  
  const toast = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  // Quill editor configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image'],
      ['code-block'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list',
    'color', 'background',
    'link', 'image',
    'code-block'
  ];

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    // Apply client-side search filter on paginated results
    let filtered = courses;
    if (searchTerm) {
      filtered = courses.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredCourses(filtered);
  }, [courses, searchTerm]);

  useEffect(() => {
    fetchCourses(0);
  }, [filterSubject]);

  const fetchCourses = async (page = 0) => {
    setLoading(true);
    try {
      let endpoint = `/courses?page=${page}&size=${pageSize}`;
      if (filterSubject !== 'all') {
        endpoint = `/courses/subject/${encodeURIComponent(filterSubject)}/paginated?page=${page}&size=${pageSize}`;
      }
      
      console.log('Admin fetching courses from:', endpoint);
      const response = await api.get(endpoint);
      console.log('Admin courses response:', response.data);
      const pageData = response.data.data;
      
      if (!pageData || !pageData.content) {
        console.error('Invalid page data structure:', pageData);
        toast.error('Invalid response from server');
        setCourses([]);
        setCurrentPage(0);
        setTotalPages(0);
        setTotalElements(0);
        return;
      }
      
      setCourses(pageData.content || []);
      setCurrentPage(pageData.number || 0);
      setTotalPages(pageData.totalPages || 0);
      setTotalElements(pageData.totalElements || 0);
    } catch (error) {
      console.error('Error fetching courses:', error);
      console.error('Error details:', error.response?.data);
      toast.error(`Failed to fetch courses: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchCourses(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const uniqueSubjects = [...new Set(courses.map(c => c.subject).filter(Boolean))];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (editingCourse) {
        await api.put(`/admin/courses/${editingCourse.id}`, formData);
        toast.success('Course updated successfully!');
      } else {
        await api.post('/admin/courses', formData);
        toast.success('Course created successfully!');
      }
      setShowForm(false);
      setEditingCourse(null);
      setFormData({ title: '', description: '', subject: '' });
      fetchCourses();
    } catch (error) {
      console.error(`Error ${editingCourse ? 'updating' : 'creating'} course:`, error);
      toast.error(error.response?.data?.message || `Failed to ${editingCourse ? 'update' : 'create'} course`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    // Scroll to top to see the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Clean up the description - if it's plain text, use it as-is
    // ReactQuill will automatically add proper HTML formatting
    let cleanDescription = course.description || '';
    
    // If the description doesn't contain HTML tags, ReactQuill will handle it
    // If it does contain HTML, ReactQuill will render it correctly
    setFormData({
      title: course.title || '',
      description: cleanDescription,
      subject: course.subject || ''
    });
    setEditorKey(prev => prev + 1);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingCourse(null);
    setFormData({ title: '', description: '', subject: '' });
    setEditorKey(prev => prev + 1);
  };

  const handleDelete = async (courseId, courseTitle) => {
    const confirmed = await confirm({
      title: 'Delete Course',
      message: `Are you sure you want to delete "${courseTitle}"? This will permanently delete ALL chapters, topics, and quizzes in this course. This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDangerous: true
    });
    
    if (!confirmed) return;
    
    try {
      await api.delete(`/admin/courses/${courseId}`);
      toast.success('Course deleted successfully');
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error(error.response?.data?.message || 'Failed to delete course');
    }
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
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
          <p className="mt-2 text-gray-600">{courses.length} total courses</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
        >
          {showForm ? 'Cancel' : '+ Create New Course'}
        </button>
      </div>

      {/* Search and Filter Bar */}
      {!showForm && courses.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
          <div className="md:w-64">
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Subjects</option>
              {uniqueSubjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
          {(searchTerm || filterSubject !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterSubject('all');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Create/Edit Course Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingCourse ? 'Edit Course' : 'Create New Course'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="e.g., Introduction to Python"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Programming, Mathematics, Science"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <ReactQuill
                key={`course-desc-${editorKey}`}
                theme="snow"
                value={formData.description || ''}
                onChange={(value) => setFormData({...formData, description: value})}
                modules={modules}
                formats={formats}
                className="bg-white"
                style={{ height: '200px', marginBottom: '50px' }}
                placeholder="Describe the course content and objectives..."
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (editingCourse ? 'Updating...' : 'Creating...') : (editingCourse ? 'Update Course' : 'Create Course')}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-md font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Results Count */}
      {!showForm && filteredCourses.length !== courses.length && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredCourses.length} of {courses.length} courses
        </div>
      )}

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div key={course.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
            {course.subject && (
              <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded mb-3">
                {course.subject}
              </span>
            )}
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">{course.description}</p>
            
            <div className="text-sm text-gray-500 mb-4">
              {course.chapterIds?.length || 0} chapters
            </div>

            <div className="flex flex-col gap-2">
              <Link
                to={`/admin/courses/${course.id}/chapters`}
                className="bg-blue-600 hover:bg-blue-700 text-white text-center px-4 py-2 rounded text-sm font-medium"
              >
                Manage Chapters
              </Link>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(course)}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(course.id, course.title)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && !showForm && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No courses</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new course.</p>
        </div>
      )}

      {/* Pagination */}
      {!showForm && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalElements={totalElements}
          pageSize={pageSize}
        />
      )}
    </div>
  );
}

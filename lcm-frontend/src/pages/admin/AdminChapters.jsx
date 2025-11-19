import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../hooks/useConfirm.jsx';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function AdminChapters() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    chapterNumber: '' 
  });
  const [submitting, setSubmitting] = useState(false);
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
    fetchCourseAndChapters();
  }, [courseId]);

  const fetchCourseAndChapters = async () => {
    try {
      // Fetch course details
      const courseResponse = await api.get(`/courses/${courseId}`);
      setCourse(courseResponse.data.data);

      // Fetch chapters
      const chaptersResponse = await api.get(`/courses/${courseId}/chapters`);
      const chaptersData = chaptersResponse.data.data || [];
      
      // Fetch quiz count and topics count for each chapter
      const chaptersWithQuizCount = await Promise.all(
        chaptersData.map(async (chapter) => {
          try {
            const quizResponse = await api.get(`/chapters/${chapter.id}/quizzes`);
            const quiz = quizResponse.data.data;
            const topicsCount = await fetchTopicsCount(chapter.id);
            return {
              ...chapter,
              questionCount: quiz?.question?.length || 0,
              hasQuiz: !!quiz,
              topicsCount: topicsCount
            };
          } catch (error) {
            const topicsCount = await fetchTopicsCount(chapter.id);
            return { ...chapter, questionCount: 0, hasQuiz: false, topicsCount: topicsCount };
          }
        })
      );
      
      setChapters(chaptersWithQuizCount);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopicsCount = async (chapterId) => {
    try {
      const topicsResponse = await api.get(`/chapters/${chapterId}/topics`);
      return topicsResponse.data.data?.length || 0;
    } catch (error) {
      console.error(`Error fetching topics for chapter ${chapterId}:`, error);
      return 0;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (editingChapter) {
        // Update existing chapter
        await api.put(`/admin/chapters/${editingChapter.id}`, formData);
        toast.success('Chapter updated successfully!');
      } else {
        // Create new chapter
        await api.post(`/admin/courses/${courseId}/chapters`, formData);
        toast.success('Chapter created successfully!');
      }
      
      setShowForm(false);
      setEditingChapter(null);
      setFormData({ title: '', description: '', chapterNumber: '' });
      fetchCourseAndChapters();
    } catch (error) {
      console.error('Error saving chapter:', error);
      toast.error(error.response?.data?.message || 'Failed to save chapter');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (chapter) => {
    setEditingChapter(chapter);
    // Scroll to top to see the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setFormData({
      title: chapter.title || '',
      description: chapter.description || '',
      chapterNumber: chapter.chapterNumber || ''
    });
    setEditorKey(prev => prev + 1);
    setShowForm(true);
  };

  const handleDelete = async (chapterId, chapterTitle) => {
    const confirmed = await confirm({
      title: 'Delete Chapter',
      message: `Delete "${chapterTitle}" and ALL its topics and quizzes? This cannot be undone.`,
      confirmText: 'Delete',
      isDangerous: true
    });
    
    if (!confirmed) return;
    
    try {
      await api.delete(`/admin/chapters/${chapterId}`);
      toast.success('Chapter deleted successfully');
      fetchCourseAndChapters();
    } catch (error) {
      console.error('Error deleting chapter:', error);
      toast.error(error.response?.data?.message || 'Failed to delete chapter');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingChapter(null);
    setFormData({ title: '', description: '', chapterNumber: '' });
    setEditorKey(prev => prev + 1);
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
      
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link to="/admin/courses" className="text-blue-600 hover:text-blue-800">
          ← Back to Courses
        </Link>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {course?.title} - Chapters
          </h1>
          <p className="mt-2 text-gray-600">Manage chapters for this course</p>
        </div>
        <button
          onClick={() => {
            handleCancel();
            setShowForm(!showForm);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add New Chapter'}
        </button>
      </div>

      {/* Create/Edit Chapter Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingChapter ? 'Edit Chapter' : 'Create New Chapter'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chapter Number *
              </label>
              <input
                type="number"
                value={formData.chapterNumber}
                onChange={(e) => setFormData({...formData, chapterNumber: e.target.value})}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="e.g., 1, 2, 3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chapter Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="e.g., Introduction to Variables"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <ReactQuill
                key={`chapter-desc-${editorKey}`}
                theme="snow"
                value={formData.description || ''}
                onChange={(value) => setFormData({...formData, description: value})}
                modules={modules}
                formats={formats}
                className="bg-white"
                style={{ height: '150px', marginBottom: '50px' }}
                placeholder="Describe what this chapter covers..."
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : editingChapter ? 'Update Chapter' : 'Create Chapter'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-md font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Chapters List */}
      {chapters.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No chapters yet</h3>
          <p className="mt-1 text-gray-500">Get started by creating a new chapter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {chapters.sort((a, b) => a.chapterNumber - b.chapterNumber).map((chapter) => (
            <div key={chapter.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                      Chapter {chapter.chapterNumber}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">{chapter.title}</h3>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>{chapter.topicsCount || 0} topics</span>
                    <span>•</span>
                    <span className={chapter.hasQuiz ? 'text-green-600 font-medium' : ''}>
                      {chapter.questionCount} quiz questions
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Link
                    to={`/admin/chapters/${chapter.id}/topics`}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-medium"
                  >
                    Manage Topics
                  </Link>
                  <Link
                    to={`/admin/chapters/${chapter.id}/quiz`}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
                  >
                    Manage Quiz
                  </Link>
                  <button
                    onClick={() => handleEdit(chapter)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(chapter.id, chapter.title)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

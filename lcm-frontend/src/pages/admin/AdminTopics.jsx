import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function AdminTopics() {
  const { chapterId } = useParams();
  const [chapter, setChapter] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '',
    content: '',
    topicNumber: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  // Quill editor configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image', 'video'],
      ['code-block'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list',
    'color', 'background',
    'link', 'image', 'video',
    'code-block'
  ];

  useEffect(() => {
    fetchChapterAndTopics();
  }, [chapterId]);

  const fetchChapterAndTopics = async () => {
    try {
      // Fetch chapter details
      const chapterResponse = await api.get(`/chapters/${chapterId}`);
      setChapter(chapterResponse.data.data);

      // Fetch topics
      const topicsResponse = await api.get(`/chapters/${chapterId}/topics`);
      setTopics(topicsResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load chapter data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (editingTopic) {
        // Update existing topic
        await api.put(`/admin/topics/${editingTopic.id}`, formData);
        alert('Topic updated successfully');
      } else {
        // Create new topic
        await api.post(`/admin/chapters/${chapterId}/topics`, formData);
        alert('Topic created successfully');
      }
      
      setShowForm(false);
      setEditingTopic(null);
      setFormData({ title: '', description: '', content: '', topicNumber: '' });
      fetchChapterAndTopics();
    } catch (error) {
      console.error('Error saving topic:', error);
      alert('Failed to save topic: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (topic) => {
    setEditingTopic(topic);
    // Scroll to top to see the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setFormData({
      title: topic.title || '',
      description: topic.description || '',
      content: topic.content || '',
      topicNumber: topic.topicNumber || ''
    });
    setEditorKey(prev => prev + 1); // Force re-render of editors
    setShowForm(true);
  };

  const handleDelete = async (topicId) => {
    if (!window.confirm('Delete this topic and ALL its quizzes?')) {
      return;
    }
    
    try {
      await api.delete(`/admin/topics/${topicId}`);
      alert('Topic deleted successfully');
      fetchChapterAndTopics();
    } catch (error) {
      console.error('Error deleting topic:', error);
      alert('Failed to delete topic');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTopic(null);
    setFormData({ title: '', description: '', content: '', topicNumber: '' });
    setEditorKey(prev => prev + 1); // Force re-render of editors
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
      {/* Breadcrumb */}
      <div className="mb-4 text-sm">
        <Link to="/admin/courses" className="text-blue-600 hover:text-blue-800">
          Courses
        </Link>
        <span className="mx-2 text-gray-500">/</span>
        <Link to={`/admin/courses/${chapter?.courseId}/chapters`} className="text-blue-600 hover:text-blue-800">
          Chapters
        </Link>
        <span className="mx-2 text-gray-500">/</span>
        <span className="text-gray-700">Topics</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {chapter?.title} - Topics
          </h1>
          <p className="mt-2 text-gray-600">Manage topics for this chapter</p>
        </div>
        <button
          onClick={() => {
            handleCancel();
            setShowForm(!showForm);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add New Topic'}
        </button>
      </div>

      {/* Create/Edit Topic Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingTopic ? 'Edit Topic' : 'Create New Topic'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic Number *
              </label>
              <input
                type="number"
                value={formData.topicNumber}
                onChange={(e) => setFormData({...formData, topicNumber: e.target.value})}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="e.g., 1, 2, 3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="e.g., What is a Variable?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <ReactQuill
                key={`desc-${editorKey}`}
                theme="snow"
                value={formData.description || ''}
                onChange={(value) => setFormData({...formData, description: value})}
                modules={modules}
                formats={formats}
                className="bg-white"
                placeholder="Brief description of the topic..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content *
              </label>
              <ReactQuill
                key={`content-${editorKey}`}
                theme="snow"
                value={formData.content || ''}
                onChange={(value) => setFormData({...formData, content: value})}
                modules={modules}
                formats={formats}
                className="bg-white"
                style={{ height: '300px', marginBottom: '50px' }}
                placeholder="Enter the full content of the topic with rich formatting..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Tip: Use the toolbar above for rich text formatting, images, videos, and code blocks
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : editingTopic ? 'Update Topic' : 'Create Topic'}
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

      {/* Topics List */}
      {topics.length === 0 ? (
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
          <h3 className="mt-2 text-lg font-medium text-gray-900">No topics yet</h3>
          <p className="mt-1 text-gray-500">Get started by creating a new topic.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topics.sort((a, b) => a.topicNumber - b.topicNumber).map((topic) => (
            <div key={topic.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                      Topic {topic.topicNumber}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">{topic.title}</h3>
                  </div>
                  {topic.description && (
                    <p className="text-gray-600 text-sm mb-2">{topic.description}</p>
                  )}
                  {topic.content && (
                    <p className="text-gray-500 text-xs mb-3 line-clamp-2">
                      {topic.content.substring(0, 150)}...
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(topic)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(topic.id)}
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

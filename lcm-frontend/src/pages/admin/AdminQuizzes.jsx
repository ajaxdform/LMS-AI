import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../hooks/useConfirm.jsx';

export default function AdminQuizzes() {
  const { chapterId } = useParams();
  const [chapter, setChapter] = useState(null);
  const [quiz, setQuiz] = useState(null); // Single quiz per chapter
  const [questions, setQuestions] = useState([]); // Questions inside the quiz
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({ 
    question: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0
  });
  const [submitting, setSubmitting] = useState(false);
  
  const toast = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    fetchChapterAndQuiz();
  }, [chapterId]);

  const fetchChapterAndQuiz = async () => {
    try {
      // Fetch chapter details
      const chapterResponse = await api.get(`/chapters/${chapterId}`);
      setChapter(chapterResponse.data.data);

      // Fetch quiz for this chapter (returns single quiz or null)
      const quizResponse = await api.get(`/chapters/${chapterId}/quizzes`);
      const quizData = quizResponse.data.data;
      
      console.log('Quiz data received:', quizData);
      console.log('Questions from quiz:', quizData?.question);
      
      if (quizData) {
        setQuiz(quizData);
        setQuestions(quizData.question || []); // Extract questions array
        console.log('Questions set:', quizData.question || []);
      } else {
        setQuiz(null);
        setQuestions([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load chapter data');
    } finally {
      setLoading(false);
    }
  };

  const createQuizForChapter = async () => {
    try {
      // Create the quiz container with empty questions array
      const response = await api.post(`/admin/chapters/${chapterId}/quizzes`, {
        title: `${chapter?.title} Quiz`,
        question: [] // Empty questions array
      });
      setQuiz(response.data.data);
      toast.success('Quiz created! Now add questions.');
      fetchChapterAndQuiz();
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast.error(error.response?.data?.message || 'Failed to create quiz');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that all options are filled
    if (formData.options.some(opt => !opt.trim())) {
      toast.warning('Please fill in all answer options');
      return;
    }

    setSubmitting(true);
    
    try {
      const newQuestion = {
        question: formData.question,
        options: formData.options,
        correctOptionIndex: parseInt(formData.correctOptionIndex)
      };

      if (editingQuestion) {
        // Update existing question - replace it in the questions array
        const updatedQuestions = questions.map(q => 
          q.id === editingQuestion.id ? { ...editingQuestion, ...newQuestion } : q
        );
        
        console.log('Updating quiz with questions:', updatedQuestions);
        
        // Update the entire quiz with modified questions
        const response = await api.put(`/admin/quizzes/${quiz.id}`, {
          title: quiz.title,
          question: updatedQuestions
        });
        console.log('Update response:', response.data);
        toast.success('Question updated successfully!');
      } else {
        // Add new question to the quiz questions array
        const updatedQuestions = [...questions, newQuestion];
        
        console.log('Adding question to quiz:', updatedQuestions);
        
        // Update the entire quiz with new question
        const response = await api.put(`/admin/quizzes/${quiz.id}`, {
          title: quiz.title,
          question: updatedQuestions
        });
        console.log('Add response:', response.data);
        toast.success('Question added successfully!');
      }
      
      setShowForm(false);
      setEditingQuestion(null);
      setFormData({ question: '', options: ['', '', '', ''], correctOptionIndex: 0 });
      fetchChapterAndQuiz();
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error(error.response?.data?.message || 'Failed to save question');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setFormData({
      question: question.question,
      options: [...question.options],
      correctOptionIndex: question.correctOptionIndex
    });
    setShowForm(true);
  };

  const handleDeleteQuestion = async (questionId) => {
    const confirmed = await confirm({
      title: 'Delete Question',
      message: 'Delete this question from the quiz?',
      confirmText: 'Delete',
      isDangerous: true
    });
    
    if (!confirmed) return;
    
    try {
      // Remove question from array and update the quiz
      const updatedQuestions = questions.filter(q => q.id !== questionId);
      
      await api.put(`/admin/quizzes/${quiz.id}`, {
        title: quiz.title,
        question: updatedQuestions
      });
      
      toast.success('Question deleted successfully');
      fetchChapterAndQuiz();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error(error.response?.data?.message || 'Failed to delete question');
    }
  };

  const handleDeleteQuiz = async () => {
    const confirmed = await confirm({
      title: 'Delete Entire Quiz',
      message: 'Delete the entire quiz with all its questions? This cannot be undone.',
      confirmText: 'Delete',
      isDangerous: true
    });
    
    if (!confirmed) return;
    
    try {
      await api.delete(`/admin/quizzes/${quiz.id}`);
      toast.success('Quiz deleted successfully');
      setQuiz(null);
      setQuestions([]);
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error(error.response?.data?.message || 'Failed to delete quiz');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingQuestion(null);
    setFormData({ question: '', options: ['', '', '', ''], correctOptionIndex: 0 });
  };

  const updateOption = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
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
      <div className="mb-4 text-sm">
        <Link to="/admin/courses" className="text-blue-600 hover:text-blue-800">
          Courses
        </Link>
        <span className="mx-2 text-gray-500">/</span>
        <Link to={`/admin/courses/${chapter?.courseId}/chapters`} className="text-blue-600 hover:text-blue-800">
          Chapters
        </Link>
        <span className="mx-2 text-gray-500">/</span>
        <span className="text-gray-700">Quiz</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {chapter?.title} - Quiz
          </h1>
          <p className="mt-2 text-gray-600">
            {quiz ? `Manage quiz questions (${questions.length} questions)` : 'No quiz created yet'}
          </p>
        </div>
        {!quiz ? (
          <button
            onClick={createQuizForChapter}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            + Create Quiz
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => {
                handleCancel();
                setShowForm(!showForm);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              {showForm ? 'Cancel' : '+ Add Question'}
            </button>
            <button
              onClick={handleDeleteQuiz}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Delete Quiz
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Question Form */}
      {showForm && quiz && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingQuestion ? 'Edit Question' : 'Add New Question'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question *
              </label>
              <textarea
                value={formData.question}
                onChange={(e) => setFormData({...formData, question: e.target.value})}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                required
                placeholder="Enter the question..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Answer Options *
              </label>
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-600 w-8">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correct Answer *
              </label>
              <select
                value={formData.correctOptionIndex}
                onChange={(e) => setFormData({...formData, correctOptionIndex: parseInt(e.target.value)})}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {formData.options.map((option, index) => (
                  <option key={index} value={index}>
                    {String.fromCharCode(65 + index)} - {option || '(empty)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : editingQuestion ? 'Update Question' : 'Add Question'}
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

      {/* Questions List */}
      {!quiz ? (
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
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No quiz created yet</h3>
          <p className="mt-1 text-gray-500">Create a quiz first, then add questions to it.</p>
        </div>
      ) : questions.length === 0 ? (
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No questions yet</h3>
          <p className="mt-1 text-gray-500">Add your first question to the quiz.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                      Question {index + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{question.question}</h3>
                  
                  <div className="space-y-2 mb-3">
                    {question.options.map((option, optIndex) => (
                      <div 
                        key={optIndex} 
                        className={`flex items-center gap-2 p-2 rounded ${
                          optIndex === question.correctOptionIndex 
                            ? 'bg-green-50 border border-green-300' 
                            : 'bg-gray-50'
                        }`}
                      >
                        <span className="font-medium text-sm text-gray-600 w-6">
                          {String.fromCharCode(65 + optIndex)}.
                        </span>
                        <span className="text-sm text-gray-700">{option}</span>
                        {optIndex === question.correctOptionIndex && (
                          <span className="ml-auto text-xs font-semibold text-green-700">✓ Correct</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(question)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(question.id)}
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

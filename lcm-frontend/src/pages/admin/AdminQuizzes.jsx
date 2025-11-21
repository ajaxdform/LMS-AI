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
    type: 'SINGLE_CHOICE',
    question: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0,
    correctOptionIndices: [],
    correctAnswer: null,
    points: 1,
    explanation: '',
    programmingLanguage: 'javascript',
    sampleCode: '',
    expectedOutput: '',
    testCases: ''
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
    
    // Validate based on question type
    const questionType = formData.type || 'SINGLE_CHOICE';
    
    if ((questionType === 'SINGLE_CHOICE' || questionType === 'MULTIPLE_CHOICE') && 
        formData.options.some(opt => !opt.trim())) {
      toast.warning('Please fill in all answer options');
      return;
    }

    if (questionType === 'MULTIPLE_CHOICE' && formData.correctOptionIndices.length === 0) {
      toast.warning('Please select at least one correct option');
      return;
    }

    if (questionType === 'TRUE_FALSE' && formData.correctAnswer === null) {
      toast.warning('Please select the correct answer (True or False)');
      return;
    }

    setSubmitting(true);
    
    try {
      const newQuestion = {
        type: questionType,
        question: formData.question,
        points: parseInt(formData.points) || 1,
        explanation: formData.explanation || null
      };

      // Add type-specific fields
      if (questionType === 'SINGLE_CHOICE') {
        newQuestion.options = formData.options;
        newQuestion.correctOptionIndex = parseInt(formData.correctOptionIndex);
      } else if (questionType === 'MULTIPLE_CHOICE') {
        newQuestion.options = formData.options;
        newQuestion.correctOptionIndices = formData.correctOptionIndices;
      } else if (questionType === 'TRUE_FALSE') {
        newQuestion.correctAnswer = formData.correctAnswer;
      } else if (questionType === 'CODE_EVALUATION') {
        newQuestion.programmingLanguage = formData.programmingLanguage;
        newQuestion.sampleCode = formData.sampleCode;
        newQuestion.expectedOutput = formData.expectedOutput;
        newQuestion.testCases = formData.testCases;
      }

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
      setFormData({ 
        type: 'SINGLE_CHOICE',
        question: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        correctOptionIndices: [],
        correctAnswer: null,
        points: 1,
        explanation: '',
        programmingLanguage: 'javascript',
        sampleCode: '',
        expectedOutput: '',
        testCases: ''
      });
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
    const questionType = question.type || 'SINGLE_CHOICE';
    setFormData({
      type: questionType,
      question: question.question,
      options: question.options ? [...question.options] : ['', '', '', ''],
      correctOptionIndex: question.correctOptionIndex || 0,
      correctOptionIndices: question.correctOptionIndices || [],
      correctAnswer: question.correctAnswer,
      points: question.points || 1,
      explanation: question.explanation || '',
      programmingLanguage: question.programmingLanguage || 'javascript',
      sampleCode: question.sampleCode || '',
      expectedOutput: question.expectedOutput || '',
      testCases: question.testCases || ''
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
    setFormData({ 
      type: 'SINGLE_CHOICE',
      question: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      correctOptionIndices: [],
      correctAnswer: null,
      points: 1,
      explanation: '',
      programmingLanguage: 'javascript',
      sampleCode: '',
      expectedOutput: '',
      testCases: ''
    });
  };

  const toggleMultipleChoiceOption = (index) => {
    const current = formData.correctOptionIndices || [];
    const updated = current.includes(index)
      ? current.filter(i => i !== index)
      : [...current, index];
    setFormData({ ...formData, correctOptionIndices: updated });
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
            {/* Question Type Selector */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'SINGLE_CHOICE', label: 'Single Choice', icon: '○' },
                { value: 'MULTIPLE_CHOICE', label: 'Multi-Select', icon: '☑' },
                { value: 'TRUE_FALSE', label: 'True/False', icon: '✓/✗' },
                { value: 'CODE_EVALUATION', label: 'Code', icon: '</>' }
              ].map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({...formData, type: type.value})}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    formData.type === type.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  {type.label}
                </button>
              ))}
            </div>

            {/* Question Text */}
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

            {/* Points */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Points
              </label>
              <input
                type="number"
                min="1"
                value={formData.points}
                onChange={(e) => setFormData({...formData, points: e.target.value})}
                className="w-32 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Single Choice Options */}
            {formData.type === 'SINGLE_CHOICE' && (
              <>
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
              </>
            )}

            {/* Multiple Choice Options */}
            {formData.type === 'MULTIPLE_CHOICE' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Answer Options * (Check all correct answers)
                </label>
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={formData.correctOptionIndices.includes(index)}
                      onChange={() => toggleMultipleChoiceOption(index)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
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
            )}

            {/* True/False Options */}
            {formData.type === 'TRUE_FALSE' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correct Answer *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="trueFalse"
                      checked={formData.correctAnswer === true}
                      onChange={() => setFormData({...formData, correctAnswer: true})}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="ml-3 font-medium text-green-700">True</span>
                  </label>
                  <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="trueFalse"
                      checked={formData.correctAnswer === false}
                      onChange={() => setFormData({...formData, correctAnswer: false})}
                      className="w-4 h-4 text-red-600"
                    />
                    <span className="ml-3 font-medium text-red-700">False</span>
                  </label>
                </div>
              </div>
            )}

            {/* Code Evaluation Fields */}
            {formData.type === 'CODE_EVALUATION' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Programming Language *
                  </label>
                  <select
                    value={formData.programmingLanguage}
                    onChange={(e) => setFormData({...formData, programmingLanguage: e.target.value})}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="csharp">C#</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sample/Starter Code
                  </label>
                  <textarea
                    value={formData.sampleCode}
                    onChange={(e) => setFormData({...formData, sampleCode: e.target.value})}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="6"
                    placeholder="function solution() {
  // Your code here
}"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Output
                  </label>
                  <textarea
                    value={formData.expectedOutput}
                    onChange={(e) => setFormData({...formData, expectedOutput: e.target.value})}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Expected output or pattern..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Cases (JSON)
                  </label>
                  <textarea
                    value={formData.testCases}
                    onChange={(e) => setFormData({...formData, testCases: e.target.value})}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder='[{"input": 5, "output": 120}]'
                  />
                </div>
              </>
            )}

            {/* Explanation/Hint */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Explanation/Hint (Optional)
              </label>
              <textarea
                value={formData.explanation}
                onChange={(e) => setFormData({...formData, explanation: e.target.value})}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="2"
                placeholder="Provide a hint or explanation for this question..."
              />
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
            <div key={question.id || index} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                      Question {index + 1}
                    </span>
                    <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                      {question.type || 'SINGLE_CHOICE'}
                    </span>
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                      {question.points || 1} {question.points === 1 ? 'point' : 'points'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{question.question}</h3>
                  
                  {/* Render based on question type */}
                  {(question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE') && question.options && (
                    <div className="space-y-2 mb-3">
                      {question.options.map((option, optIndex) => (
                        <div 
                          key={optIndex} 
                          className={`flex items-center gap-2 p-2 rounded ${
                            question.type === 'SINGLE_CHOICE' && optIndex === question.correctOptionIndex
                              ? 'bg-green-50 border border-green-300'
                              : question.type === 'MULTIPLE_CHOICE' && question.correctOptionIndices?.includes(optIndex)
                              ? 'bg-green-50 border border-green-300'
                              : 'bg-gray-50'
                          }`}
                        >
                          <span className="font-medium text-sm text-gray-600 w-6">
                            {String.fromCharCode(65 + optIndex)}.
                          </span>
                          <span className="text-sm text-gray-700">{option}</span>
                          {question.type === 'SINGLE_CHOICE' && optIndex === question.correctOptionIndex && (
                            <span className="ml-auto text-xs font-semibold text-green-700">✓ Correct</span>
                          )}
                          {question.type === 'MULTIPLE_CHOICE' && question.correctOptionIndices?.includes(optIndex) && (
                            <span className="ml-auto text-xs font-semibold text-green-700">✓ Correct</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {question.type === 'TRUE_FALSE' && (
                    <div className="space-y-2 mb-3">
                      <div className={`flex items-center gap-2 p-2 rounded ${
                        question.correctAnswer === true ? 'bg-green-50 border border-green-300' : 'bg-gray-50'
                      }`}>
                        <span className="font-medium text-sm text-gray-600">True</span>
                        {question.correctAnswer === true && (
                          <span className="ml-auto text-xs font-semibold text-green-700">✓ Correct</span>
                        )}
                      </div>
                      <div className={`flex items-center gap-2 p-2 rounded ${
                        question.correctAnswer === false ? 'bg-green-50 border border-green-300' : 'bg-gray-50'
                      }`}>
                        <span className="font-medium text-sm text-gray-600">False</span>
                        {question.correctAnswer === false && (
                          <span className="ml-auto text-xs font-semibold text-green-700">✓ Correct</span>
                        )}
                      </div>
                    </div>
                  )}

                  {question.type === 'CODE_EVALUATION' && (
                    <div className="space-y-2 mb-3">
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-xs text-gray-600 mb-1">Language: <span className="font-semibold">{question.programmingLanguage}</span></p>
                        {question.sampleCode && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-600 mb-1">Sample Code:</p>
                            <pre className="bg-gray-900 text-gray-100 p-2 rounded text-xs overflow-x-auto">{question.sampleCode}</pre>
                          </div>
                        )}
                        {question.expectedOutput && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-600 mb-1">Expected Output:</p>
                            <pre className="bg-gray-900 text-gray-100 p-2 rounded text-xs">{question.expectedOutput}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {question.explanation && (
                    <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                      <p className="text-xs font-semibold text-blue-800 mb-1">Explanation:</p>
                      <p className="text-sm text-blue-900">{question.explanation}</p>
                    </div>
                  )}
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

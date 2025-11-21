import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function EnhancedQuizPage() {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [quiz, setQuiz] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [answers, setAnswers] = useState({});
  const [multipleChoiceAnswers, setMultipleChoiceAnswers] = useState({});
  const [codeAnswers, setCodeAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showExplanations, setShowExplanations] = useState({});

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const chapterResponse = await api.get(`/chapters/${chapterId}`);
        setChapter(chapterResponse.data.data);

        const response = await api.get(`/chapters/${chapterId}/quizzes`);
        const quizData = response.data.data;
        setQuiz(quizData);

        // Initialize code answers with sample code
        const initialCodeAnswers = {};
        quizData.question.forEach(q => {
          if (q.type === 'CODE_EVALUATION' && q.sampleCode) {
            initialCodeAnswers[q.id] = q.sampleCode;
          }
        });
        setCodeAnswers(initialCodeAnswers);
      } catch (err) {
        console.error("Error fetching quiz:", err);
        setError(err.response?.data?.message || "Failed to load quiz");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [chapterId]);

  const handleSingleChoiceChange = (questionId, optionIndex) => {
    setAnswers({ ...answers, [questionId]: optionIndex.toString() });
  };

  const handleMultipleChoiceChange = (questionId, optionIndex) => {
    const current = multipleChoiceAnswers[questionId] || [];
    const updated = current.includes(optionIndex)
      ? current.filter(i => i !== optionIndex)
      : [...current, optionIndex];
    setMultipleChoiceAnswers({ ...multipleChoiceAnswers, [questionId]: updated });
  };

  const handleTrueFalseChange = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleCodeChange = (questionId, code) => {
    setCodeAnswers({ ...codeAnswers, [questionId]: code });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all questions are answered
    const unanswered = quiz.question.filter((q) => {
      switch (q.type) {
        case 'SINGLE_CHOICE':
        case 'TRUE_FALSE':
          return answers[q.id] === undefined;
        case 'MULTIPLE_CHOICE':
          return !multipleChoiceAnswers[q.id] || multipleChoiceAnswers[q.id].length === 0;
        case 'CODE_EVALUATION':
          return !codeAnswers[q.id] || codeAnswers[q.id].trim() === '';
        default:
          return true;
      }
    });

    if (unanswered.length > 0) {
      toast.error(`Please answer all questions. ${unanswered.length} question(s) remaining.`);
      return;
    }

    setSubmitting(true);
    try {
      // Format answers for single choice questions
      const formattedAnswers = {};
      quiz.question.forEach((q) => {
        if (q.type === 'SINGLE_CHOICE' && answers[q.id] !== undefined) {
          const selectedIndex = parseInt(answers[q.id]);
          formattedAnswers[q.id] = q.options[selectedIndex];
        } else if (q.type === 'TRUE_FALSE' && answers[q.id] !== undefined) {
          formattedAnswers[q.id] = answers[q.id];
        }
      });

      const response = await api.post(`/quizzes/${quiz.id}/submit`, {
        userId: user.uid,
        courseId: chapter.courseId,
        chapterId: chapterId,
        answers: formattedAnswers,
        multipleChoiceAnswers: multipleChoiceAnswers,
        codeAnswers: codeAnswers,
      });

      const quizResult = response.data.data;
      setResult(quizResult);
      toast.success('Quiz submitted successfully!');

      if (quizResult.passed) {
        await api.post("/user-progress/chapter/completed", null, {
          params: {
            userId: user.uid,
            courseId: chapter.courseId,
            chapterId: chapterId,
          },
        });
      }
    } catch (err) {
      console.error("Error submitting quiz:", err);
      toast.error(err.response?.data?.message || "Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question, qIndex) => {
    const questionType = question.type || 'SINGLE_CHOICE';

    return (
      <div key={question.id} className="bg-white shadow rounded-lg p-6">
        <div className="mb-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 flex-1">
              {qIndex + 1}. {question.question}
            </h3>
            <span className="ml-4 px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              {questionType.replace('_', ' ')}
            </span>
          </div>

          {question.points && question.points > 1 && (
            <div className="text-sm text-gray-500 mb-3">
              Worth {question.points} points
            </div>
          )}

          {/* Single Choice Questions */}
          {questionType === 'SINGLE_CHOICE' && (
            <div className="space-y-3">
              {question.options.map((option, oIndex) => (
                <label
                  key={oIndex}
                  className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    answers[question.id] === oIndex.toString()
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={oIndex}
                    checked={answers[question.id] === oIndex.toString()}
                    onChange={() => handleSingleChoiceChange(question.id, oIndex)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3 text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          )}

          {/* Multiple Choice Questions */}
          {questionType === 'MULTIPLE_CHOICE' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-3 italic">Select all that apply</p>
              {question.options.map((option, oIndex) => (
                <label
                  key={oIndex}
                  className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    multipleChoiceAnswers[question.id]?.includes(oIndex)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={multipleChoiceAnswers[question.id]?.includes(oIndex) || false}
                    onChange={() => handleMultipleChoiceChange(question.id, oIndex)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="ml-3 text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          )}

          {/* True/False Questions */}
          {questionType === 'TRUE_FALSE' && (
            <div className="space-y-3">
              <label
                className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  answers[question.id] === 'true'
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value="true"
                  checked={answers[question.id] === 'true'}
                  onChange={() => handleTrueFalseChange(question.id, 'true')}
                  className="w-4 h-4 text-green-600"
                />
                <span className="ml-3 text-gray-700 font-medium">True</span>
              </label>
              <label
                className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  answers[question.id] === 'false'
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value="false"
                  checked={answers[question.id] === 'false'}
                  onChange={() => handleTrueFalseChange(question.id, 'false')}
                  className="w-4 h-4 text-red-600"
                />
                <span className="ml-3 text-gray-700 font-medium">False</span>
              </label>
            </div>
          )}

          {/* Code Evaluation Questions */}
          {questionType === 'CODE_EVALUATION' && (
            <div className="space-y-3">
              {question.programmingLanguage && (
                <div className="text-sm text-gray-600 mb-2">
                  Language: <span className="font-mono font-medium">{question.programmingLanguage}</span>
                </div>
              )}
              <textarea
                value={codeAnswers[question.id] || ''}
                onChange={(e) => handleCodeChange(question.id, e.target.value)}
                placeholder="Write your code here..."
                className="w-full h-64 p-4 font-mono text-sm border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                style={{ tabSize: 2 }}
              />
              {question.expectedOutput && (
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Expected Output:</div>
                  <pre className="text-sm font-mono text-gray-800">{question.expectedOutput}</pre>
                </div>
              )}
            </div>
          )}

          {/* Show explanation if available */}
          {question.explanation && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowExplanations({
                  ...showExplanations,
                  [question.id]: !showExplanations[question.id]
                })}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showExplanations[question.id] ? '▼ Hide hint' : '▶ Show hint'}
              </button>
              {showExplanations[question.id] && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-gray-700">
                  {question.explanation}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="text-sm text-gray-500">
          {(questionType === 'SINGLE_CHOICE' || questionType === 'TRUE_FALSE') && answers[question.id] !== undefined && (
            <span className="text-green-600">✓ Answered</span>
          )}
          {questionType === 'MULTIPLE_CHOICE' && multipleChoiceAnswers[question.id]?.length > 0 && (
            <span className="text-green-600">✓ {multipleChoiceAnswers[question.id].length} option(s) selected</span>
          )}
          {questionType === 'CODE_EVALUATION' && codeAnswers[question.id]?.trim() && (
            <span className="text-green-600">✓ Code written</span>
          )}
          {!((questionType === 'SINGLE_CHOICE' || questionType === 'TRUE_FALSE') && answers[question.id] !== undefined) &&
           !(questionType === 'MULTIPLE_CHOICE' && multipleChoiceAnswers[question.id]?.length > 0) &&
           !(questionType === 'CODE_EVALUATION' && codeAnswers[question.id]?.trim()) && (
            <span className="text-gray-400">Not answered yet</span>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || "Quiz not found"}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  if (result) {
    const totalPoints = quiz.question.reduce((sum, q) => sum + (q.points || 1), 0);
    const percentage = (result.score / totalPoints) * 100;
    const passed = result.passed;

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <div
              className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-6 ${
                passed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
              }`}
            >
              <div>
                <div className="text-4xl font-bold">{Math.round(percentage)}%</div>
                <div className="text-sm">Score</div>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {passed ? "Congratulations! 🎉" : "Keep Learning! 📚"}
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              You earned {result.score} out of {totalPoints} points
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{result.totalQuestions}</div>
                <div className="text-sm text-gray-600">Questions</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{result.score}</div>
                <div className="text-sm text-gray-600">Points Earned</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">{totalPoints}</div>
                <div className="text-sm text-gray-600">Total Points</div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                  setMultipleChoiceAnswers({});
                  setCodeAnswers({});
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Retake Quiz
              </button>
              <button
                onClick={() => navigate(`/courses/${chapter.courseId}/chapters`)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium"
              >
                Back to Chapters
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const answeredCount = quiz.question.filter(q => {
    const qType = q.type || 'SINGLE_CHOICE';
    if (qType === 'SINGLE_CHOICE' || qType === 'TRUE_FALSE') {
      return answers[q.id] !== undefined;
    } else if (qType === 'MULTIPLE_CHOICE') {
      return multipleChoiceAnswers[q.id]?.length > 0;
    } else if (qType === 'CODE_EVALUATION') {
      return codeAnswers[q.id]?.trim();
    }
    return false;
  }).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/courses/${chapter.courseId}/chapters`)}
          className="text-blue-600 hover:text-blue-800 flex items-center mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Chapters
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
        <p className="text-sm text-gray-500 mt-2">
          {quiz.question.length} question{quiz.question.length !== 1 ? "s" : ""}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {quiz.question.map((question, qIndex) => renderQuestion(question, qIndex))}

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {answeredCount} of {quiz.question.length} questions answered
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  Submit Quiz
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

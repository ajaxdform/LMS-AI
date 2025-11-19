import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function QuizPage() {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        // Fetch chapter details to get courseId
        const chapterResponse = await api.get(`/chapters/${chapterId}`);
        setChapter(chapterResponse.data.data);

        // Fetch quiz for this chapter
        const response = await api.get(`/chapters/${chapterId}/quizzes`);
        setQuiz(response.data.data);
      } catch (err) {
        console.error("Error fetching quiz:", err);
        if (err.response?.status === 404) {
          setError("No quiz available for this chapter");
        } else if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError("Failed to load quiz");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [chapterId]);

  const handleAnswerChange = (questionId, optionIndex) => {
    setAnswers({
      ...answers,
      [questionId]: optionIndex,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all questions are answered
    const unanswered = quiz.question.filter((q) => answers[q.id] === undefined);
    if (unanswered.length > 0) {
      alert(`Please answer all questions. ${unanswered.length} question(s) remaining.`);
      return;
    }

    setSubmitting(true);
    try {
      // Format answers for submission - convert to Map<questionId, answerText>
      const formattedAnswers = {};
      quiz.question.forEach((q) => {
        const selectedIndex = answers[q.id];
        if (selectedIndex !== undefined) {
          formattedAnswers[q.id] = q.options[selectedIndex]; // Get the actual answer text
        }
      });

      // Submit quiz
      const response = await api.post(`/quizzes/${quiz.id}/submit`, {
        userId: user.uid,
        courseId: chapter.courseId,
        chapterId: chapterId,
        answers: formattedAnswers,
      });

      const quizResult = response.data.data;
      setResult(quizResult);

      // Record score in user progress
      try {
        await api.post("/user-progress/quizz/record", null, {
          params: {
            userId: user.uid,
            courseId: chapter.courseId,
            quizzId: quiz.id,
            score: quizResult.score,
          },
        });
      } catch (progressErr) {
        console.error("Failed to record progress:", progressErr);
      }

      // If quiz passed, mark chapter as complete
      if (quizResult.passed) {
        try {
          await api.post("/user-progress/chapter/completed", null, {
            params: {
              userId: user.uid,
              courseId: chapter.courseId,
              chapterId: chapterId,
            },
          });
        } catch (completeErr) {
          console.error("Failed to mark chapter complete:", completeErr);
        }
      }
    } catch (err) {
      console.error("Error submitting quiz:", err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to submit quiz. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
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

  // Show results if quiz has been submitted
  if (result) {
    const percentage = (result.score / result.totalQuestions) * 100;
    const passed = percentage >= 70;

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            {/* Score Display */}
            <div
              className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-6 ${
                passed
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
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
              You scored {result.score} out of {result.totalQuestions} questions correctly
            </p>

            {/* Results Summary */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {result.totalQuestions}
                </div>
                <div className="text-sm text-gray-600">Total Questions</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {result.score}
                </div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">
                  {result.totalQuestions - result.score}
                </div>
                <div className="text-sm text-gray-600">Incorrect</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Retake Quiz
              </button>
              <button
                onClick={() => navigate(`/courses/${chapter.courseId}/chapters/${chapterId}/topics`)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium"
              >
                Back to Chapter
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show quiz questions
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/courses/${chapter.courseId}/chapters/${chapterId}/topics`)}
          className="text-blue-600 hover:text-blue-800 flex items-center mb-4"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Chapter
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
        {quiz.description && (
          <p className="text-gray-600">{quiz.description}</p>
        )}
        <p className="text-sm text-gray-500 mt-2">
          {quiz.question.length} question{quiz.question.length !== 1 ? "s" : ""}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {quiz.question.map((question, qIndex) => (
          <div key={question.id} className="bg-white shadow rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {qIndex + 1}. {question.question}
              </h3>

              <div className="space-y-3">
                {question.options.map((option, oIndex) => (
                  <label
                    key={oIndex}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      answers[question.id] === oIndex
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={oIndex}
                      checked={answers[question.id] === oIndex}
                      onChange={() => handleAnswerChange(question.id, oIndex)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="ml-3 text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="text-sm text-gray-500">
              {answers[question.id] !== undefined ? (
                <span className="text-green-600">✓ Answered</span>
              ) : (
                <span className="text-gray-400">Not answered yet</span>
              )}
            </div>
          </div>
        ))}

        {/* Submit Button */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {Object.keys(answers).length} of {quiz.question.length} questions answered
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
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
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

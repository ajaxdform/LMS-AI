import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function TopicList() {
  const { chapterId, courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chapter, setChapter] = useState(null);
  const [topics, setTopics] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // 1. Fetch chapter details first to get courseId
        const chapterResponse = await api.get(`/chapters/${chapterId}`);
        const chapterData = chapterResponse.data.data;
        setChapter(chapterData);

        // 2. Fetch topics for this chapter
        const topicsResponse = await api.get(`/chapters/${chapterId}/topics`);
        setTopics(topicsResponse.data.data || []);

        // 3. Fetch user progress using the correct courseId from the chapter
        try {
          const progressResponse = await api.get(`/user-progress`, {
            params: {
              userId: user.uid,
              courseId: chapterData.courseId,
            },
          });
          setProgress(progressResponse.data.data);
        } catch (progressErr) {
          console.log("No progress yet for this course");
          setProgress(null);
        }
      } catch (err) {
        console.error("Error fetching chapter data:", err);
        if (err.response?.status === 401) {
          setError("Please log in to view topics");
        } else if (err.response?.status === 404) {
          setError("Chapter not found");
        } else if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError("Failed to load chapter details");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [chapterId, user]);

  const isChapterCompleted = () => {
    return progress?.completedChapterIds?.includes(chapterId) || false;
  };

  const handleTakeQuiz = () => {
    navigate(`/chapters/${chapterId}/quiz`);
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
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Chapter Topics
            </h1>
            <p className="text-gray-600">
              {topics.length} topic{topics.length !== 1 ? "s" : ""} in this chapter
            </p>
          </div>

          {/* Take Quiz Button */}
          {!isChapterCompleted() && topics.length > 0 && (
            <button
              onClick={handleTakeQuiz}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium flex items-center gap-2"
            >
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Take Chapter Quiz
            </button>
          )}

          {isChapterCompleted() && (
            <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">Chapter Completed</span>
            </div>
          )}
        </div>
      </div>

      {/* Topics List */}
      <div className="space-y-4">
        {topics.length > 0 ? (
          topics.map((topic, index) => (
            <Link
              key={topic.id}
              to={`/topics/${topic.id}`}
              className="block bg-white shadow rounded-lg hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold text-blue-600">
                        {index + 1}
                      </span>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {topic.title}
                      </h3>
                    </div>

                    {topic.content && (
                      <p className="text-gray-600 mt-2 ml-8 line-clamp-3">
                        {topic.content.substring(0, 200)}
                        {topic.content.length > 200 ? "..." : ""}
                      </p>
                    )}

                    {topic.videoUrl && (
                      <div className="flex items-center gap-2 mt-3 ml-8 text-sm text-blue-600">
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
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Video Available</span>
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="ml-4">
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-500 text-lg">
              No topics available yet for this chapter.
            </p>
          </div>
        )}
      </div>

      {/* Back Button */}
      <div className="mt-8">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-800 flex items-center"
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
          Back to Chapters
        </button>
      </div>
    </div>
  );
}

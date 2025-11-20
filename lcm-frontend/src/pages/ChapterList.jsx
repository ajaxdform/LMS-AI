import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

// Component to format content with headers, bullet points, and structure
function FormattedContent({ content }) {
  if (!content) return null;

  // Check if content is HTML (from ReactQuill)
  if (content.includes('<p>') || content.includes('<h1>') || content.includes('<ul>') || content.includes('<ol>')) {
    return (
      <div 
        className="quill-content"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Otherwise, format as plain text
  const formatContent = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let currentList = [];
    let listType = null;

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="my-4 ml-6 space-y-2">
            {currentList.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-blue-600 mt-1.5">•</span>
                <span className="flex-1">{item}</span>
              </li>
            ))}
          </ul>
        );
        currentList = [];
        listType = null;
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        flushList();
        elements.push(<div key={`space-${index}`} className="h-4" />);
        return;
      }

      if (trimmedLine.endsWith(':') || (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length < 50 && trimmedLine.length > 3)) {
        flushList();
        const headerText = trimmedLine.endsWith(':') ? trimmedLine.slice(0, -1) : trimmedLine;
        elements.push(
          <h3 key={`header-${index}`} className="text-xl font-bold text-gray-900 mt-6 mb-3 flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-600 rounded"></span>
            {headerText}
          </h3>
        );
        return;
      }

      const numberedMatch = trimmedLine.match(/^(\d+[\.)]\s+)(.+)$/);
      if (numberedMatch) {
        if (listType !== 'numbered') {
          flushList();
          listType = 'numbered';
        }
        currentList.push(numberedMatch[2]);
        return;
      }

      const bulletMatch = trimmedLine.match(/^[-•*]\s+(.+)$/);
      if (bulletMatch) {
        if (listType !== 'bullet') {
          flushList();
          listType = 'bullet';
        }
        currentList.push(bulletMatch[1]);
        return;
      }

      if (line.startsWith('  ') || line.startsWith('\t')) {
        if (currentList.length > 0) {
          currentList.push(trimmedLine);
        } else {
          elements.push(
            <p key={`indent-${index}`} className="ml-8 text-gray-600 my-2">
              {trimmedLine}
            </p>
          );
        }
        return;
      }

      if (trimmedLine.startsWith('```') || trimmedLine.match(/^[A-Z_]+\s*=/) || trimmedLine.includes('function') || trimmedLine.includes('const ') || trimmedLine.includes('let ')) {
        flushList();
        elements.push(
          <pre key={`code-${index}`} className="bg-gray-900 text-green-400 p-4 rounded-lg my-4 overflow-x-auto">
            <code>{trimmedLine.replace(/```/g, '')}</code>
          </pre>
        );
        return;
      }

      let formattedLine = trimmedLine;
      formattedLine = formattedLine.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');
      formattedLine = formattedLine.replace(/__(.+?)__/g, '<strong class="font-bold text-gray-900">$1</strong>');
      formattedLine = formattedLine.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
      formattedLine = formattedLine.replace(/_(.+?)_/g, '<em class="italic">$1</em>');

      flushList();
      elements.push(
        <p 
          key={`para-${index}`} 
          className="text-gray-700 leading-relaxed my-3 text-lg"
          dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      );
    });

    flushList();
    return elements;
  };

  return (
    <div className="formatted-content">
      {formatContent(content)}
    </div>
  );
}

export default function ChapterList() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [loadingTopic, setLoadingTopic] = useState(false);
  const [chapterTopicsMap, setChapterTopicsMap] = useState({}); // Store topics for each chapter

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch course details
        const courseResponse = await api.get(`/courses/${courseId}`);
        setCourse(courseResponse.data.data);

        // Fetch chapters for this course
        const chaptersResponse = await api.get(`/chapters/${courseId}/chapters`);
        const fetchedChapters = chaptersResponse.data.data || [];
        
        // Fetch topic counts for all chapters
        const chaptersWithTopicCount = await Promise.all(
          fetchedChapters.map(async (chapter) => {
            try {
              const topicsResponse = await api.get(`/chapters/${chapter.id}/topics`);
              const topicsList = topicsResponse.data.data || [];
              // Store topics in map
              setChapterTopicsMap(prev => ({
                ...prev,
                [chapter.id]: topicsList
              }));
              return {
                ...chapter,
                topicsCount: topicsList.length
              };
            } catch (err) {
              console.error(`Error fetching topics for chapter ${chapter.id}:`, err);
              return {
                ...chapter,
                topicsCount: 0
              };
            }
          })
        );
        
        setChapters(chaptersWithTopicCount);
        
        // Auto-select first chapter
        if (chaptersWithTopicCount.length > 0) {
          const firstChapter = chaptersWithTopicCount[0];
          setSelectedChapter(firstChapter);
          setExpandedChapters({ [firstChapter.id]: true });
          
          // Set topics from the map
          const firstChapterTopics = await (async () => {
            try {
              const topicsResponse = await api.get(`/chapters/${firstChapter.id}/topics`);
              return topicsResponse.data.data || [];
            } catch (err) {
              return [];
            }
          })();
          
          setTopics(firstChapterTopics);
          setChapterTopicsMap(prev => ({
            ...prev,
            [firstChapter.id]: firstChapterTopics
          }));  
        }

        // Fetch user progress for this course (only if user is logged in)
        if (user) {
          try {
            const progressResponse = await api.get(`/user-progress`, {
              params: {
                userId: user.uid,
                courseId: courseId,
              },
            });
            setProgress(progressResponse.data.data);
          } catch (progressErr) {
            console.log("No progress yet for this course");
            setProgress(null);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        // Don't show error for 401 if user is not logged in (they're just browsing)
        if (err.response?.status === 401 && !user) {
          console.log("User not logged in - showing preview mode");
        } else if (err.response?.status === 404) {
          setError("Course not found");
        } else if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError("Failed to load chapters");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, user]);

  const handleChapterClick = async (chapter) => {
    setSelectedChapter(chapter);
    setSelectedTopic(null); // Clear selected topic when changing chapters
    const wasExpanded = expandedChapters[chapter.id];
    
    setExpandedChapters(prev => ({
      ...prev,
      [chapter.id]: !prev[chapter.id]
    }));
    
    // Set topics from the stored map for this specific chapter
    const chapterTopics = chapterTopicsMap[chapter.id] || [];
    setTopics(chapterTopics);
    
    // Fetch fresh topics if not already in map or if expanding
    if (!wasExpanded && !chapterTopicsMap[chapter.id]) {
      setLoadingTopics(true);
      try {
        const response = await api.get(`/chapters/${chapter.id}/topics`);
        const fetchedTopics = response.data.data || [];
        console.log("Topics fetched for chapter:", chapter.id, fetchedTopics);
        setTopics(fetchedTopics);
        setChapterTopicsMap(prev => ({
          ...prev,
          [chapter.id]: fetchedTopics
        }));
      } catch (err) {
        console.error("Error fetching topics:", err);
        setTopics([]);
      } finally {
        setLoadingTopics(false);
      }
    }
  };

  const handleTopicClick = async (e, topic) => {
    e.preventDefault();
    setLoadingTopic(true);
    try {
      const response = await api.get(`/topics/${topic.id}`);
      console.log("Topic details fetched:", response.data.data);
      setSelectedTopic(response.data.data);
    } catch (err) {
      console.error("Error fetching topic details:", err);
    } finally {
      setLoadingTopic(false);
    }
  };

  const isChapterCompleted = (chapterId) => {
    return progress?.completedChapterIds?.includes(chapterId) || false;
  };

  const getProgressPercentage = () => {
    if (!chapters.length) return 0;
    const completedCount = chapters.filter((ch) => isChapterCompleted(ch.id)).length;
    return Math.round((completedCount / chapters.length) * 100);
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
          onClick={() => navigate("/courses")}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Courses
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-gray-200 px-6 py-4">
        <div className="max-w-full">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <button onClick={() => navigate("/courses")} className="hover:text-blue-600">
              Courses
            </button>
            <span className="mx-2">›</span>
            <button onClick={() => navigate(`/courses/${courseId}`)} className="hover:text-blue-600">
              {course?.title}
            </button>
            <span className="mx-2">›</span>
            <span className="text-gray-900">Chapters</span>
          </div>

          {/* Course Title & Progress */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{course?.title}</h1>
              {course?.subject && (
                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full mt-2">
                  {course.subject}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Progress</div>
                <div className="text-2xl font-bold text-blue-600">{getProgressPercentage()}%</div>
                <div className="text-xs text-gray-500">
                  {chapters.filter((ch) => isChapterCompleted(ch.id)).length} / {chapters.length} chapters
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Chapters List */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900">Course Chapters</h2>
            <p className="text-sm text-gray-600 mt-1">{chapters.length} chapters available</p>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {chapters.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {chapters.map((chapter, index) => {
                  const completed = isChapterCompleted(chapter.id);
                  const isExpanded = expandedChapters[chapter.id];
                  const isSelected = selectedChapter?.id === chapter.id;
                  
                  return (
                    <div key={chapter.id} className="bg-white">
                      <button
                        onClick={() => handleChapterClick(chapter)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                          isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-700">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-gray-900 truncate">{chapter.title}</h3>
                              {completed && (
                                <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                {chapter.topicsCount || 0} topics
                              </span>
                            </div>
                          </div>
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      
                      {/* Topics Dropdown */}
                      {isExpanded && (
                        <div className="bg-gray-50 border-t border-gray-200">
                          {loadingTopics ? (
                            <div className="p-4 text-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                            </div>
                          ) : (chapterTopicsMap[chapter.id] || []).length > 0 ? (
                            <div className="py-2">
                              {(chapterTopicsMap[chapter.id] || []).map((topic, idx) => (
                                <button
                                  key={topic.id}
                                  onClick={(e) => handleTopicClick(e, topic)}
                                  className={`w-full text-left block px-4 py-3 pl-16 hover:bg-white transition-colors group ${
                                    selectedTopic?.id === topic.id ? 'bg-blue-50' : ''
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm font-medium ${
                                      selectedTopic?.id === topic.id ? 'text-blue-600' : 'text-gray-700 group-hover:text-blue-600'
                                    }`}>
                                      {idx + 1}. {topic.title}
                                    </span>
                                    <svg className={`w-4 h-4 ${
                                      selectedTopic?.id === topic.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
                                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 text-sm text-gray-500 text-center">
                              No topics available
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500">No chapters available yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Content Area - Chapter/Topic Details */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {loadingTopic ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : selectedTopic ? (
            <div className="max-w-4xl mx-auto p-8">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Topic Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6">
                  <button
                    onClick={() => setSelectedTopic(null)}
                    className="text-white hover:text-purple-200 flex items-center gap-2 mb-3 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Chapter
                  </button>
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedTopic.title}</h2>
                  <p className="text-purple-100">From: {selectedChapter?.title}</p>
                </div>

                {/* Video Section */}
                {selectedTopic.videoUrl && (
                  <div className="aspect-w-16 aspect-h-9 bg-gray-900">
                    <iframe
                      src={selectedTopic.videoUrl}
                      title={selectedTopic.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-96"
                    ></iframe>
                  </div>
                )}

                {/* Topic Content */}
                <div className="p-8">
                  {selectedTopic.content ? (
                    <div className="prose max-w-none">
                      <FormattedContent content={selectedTopic.content} />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      {!user ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                          <svg className="w-12 h-12 text-blue-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Content Locked
                          </h3>
                          <p className="text-gray-600 mb-4">
                            Please log in and enroll in this course to access the full topic content.
                          </p>
                          <Link 
                            to="/login" 
                            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Log In
                          </Link>
                        </div>
                      ) : (
                        <p className="text-gray-500">No content available for this topic.</p>
                      )}
                    </div>
                  )}

                  {/* Additional Resources */}
                  {selectedTopic.pdfUrl && (
                    <div className="mt-8 pt-8 border-t border-gray-200">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        Additional Resources
                      </h3>
                      <a
                        href={selectedTopic.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download PDF Materials
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : selectedChapter ? (
            <div className="max-w-4xl mx-auto p-8">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Chapter Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedChapter.title}</h2>
                  <div className="flex items-center gap-4 text-blue-100">
                    <span className="flex items-center gap-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      {topics.length} Topics
                    </span>
                    {isChapterCompleted(selectedChapter.id) && (
                      <span className="flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Completed
                      </span>
                    )}
                  </div>
                </div>

                {/* Chapter Content */}
                <div className="p-8">
                  {selectedChapter.content && (
                    <div className="prose max-w-none mb-8">
                      <FormattedContent content={selectedChapter.content} />
                    </div>
                  )}

                  {/* Topics Section */}
                  {topics.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-gray-200">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Topics in this Chapter</h3>
                      <div className="grid gap-3">
                        {topics.map((topic, idx) => (
                          <button
                            key={topic.id}
                            onClick={(e) => handleTopicClick(e, topic)}
                            className="flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all group text-left w-full"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                {idx + 1}
                              </div>
                              <span className="font-medium text-gray-900 group-hover:text-blue-600">
                                {topic.title}
                              </span>
                            </div>
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p className="text-lg font-medium">Select a chapter to view details</p>
                <p className="text-sm mt-2">Click on any chapter from the list to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

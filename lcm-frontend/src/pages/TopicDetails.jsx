import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

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

      // Skip empty lines
      if (!trimmedLine) {
        flushList();
        elements.push(<div key={`space-${index}`} className="h-4" />);
        return;
      }

      // Headers (lines ending with : or all caps with reasonable length)
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

      // Numbered lists
      const numberedMatch = trimmedLine.match(/^(\d+[\.)]\s+)(.+)$/);
      if (numberedMatch) {
        if (listType !== 'numbered') {
          flushList();
          listType = 'numbered';
        }
        currentList.push(numberedMatch[2]);
        return;
      }

      // Bullet points
      const bulletMatch = trimmedLine.match(/^[-•*]\s+(.+)$/);
      if (bulletMatch) {
        if (listType !== 'bullet') {
          flushList();
          listType = 'bullet';
        }
        currentList.push(bulletMatch[1]);
        return;
      }

      // Sub-points (indented)
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

      // Code blocks (lines starting with specific indicators or surrounded by backticks)
      if (trimmedLine.startsWith('```') || trimmedLine.match(/^[A-Z_]+\s*=/) || trimmedLine.includes('function') || trimmedLine.includes('const ') || trimmedLine.includes('let ')) {
        flushList();
        elements.push(
          <pre key={`code-${index}`} className="bg-gray-900 text-green-400 p-4 rounded-lg my-4 overflow-x-auto">
            <code>{trimmedLine.replace(/```/g, '')}</code>
          </pre>
        );
        return;
      }

      // Bold text (**text** or __text__)
      let formattedLine = trimmedLine;
      formattedLine = formattedLine.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');
      formattedLine = formattedLine.replace(/__(.+?)__/g, '<strong class="font-bold text-gray-900">$1</strong>');

      // Italic text (*text* or _text_)
      formattedLine = formattedLine.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
      formattedLine = formattedLine.replace(/_(.+?)_/g, '<em class="italic">$1</em>');

      // Regular paragraph
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

export default function TopicDetails() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTopic = async () => {
      try {
        const response = await api.get(`/topics/${topicId}`);
        setTopic(response.data.data);
      } catch (err) {
        console.error("Error fetching topic:", err);
        if (err.response?.status === 401) {
          setError("Please log in to view this topic");
        } else if (err.response?.status === 404) {
          setError("Topic not found");
        } else if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError("Failed to load topic details");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTopic();
  }, [topicId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || "Topic not found"}
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
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
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
          Back to Topics
        </button>

        <h1 className="text-4xl font-bold text-gray-900 mb-2">{topic.title}</h1>
      </div>

      {/* Main Content */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Video Section */}
        {topic.videoUrl && (
          <div className="aspect-w-16 aspect-h-9 bg-gray-900">
            <iframe
              src={topic.videoUrl}
              title={topic.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-96"
            ></iframe>
          </div>
        )}

        {/* Content Section */}
        <div className="p-8">
          <div className="prose max-w-none">
            <FormattedContent content={topic.content} />
          </div>

          {/* Additional Resources */}
          {topic.pdfUrl && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Additional Resources
              </h3>
              <a
                href={topic.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-lg transition-colors"
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download PDF Materials
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
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
          Back to Topics
        </button>
      </div>
    </div>
  );
}

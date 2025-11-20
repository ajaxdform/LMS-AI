import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "../api/axios";
import { useToast } from "../context/ToastContext";

const CATEGORIES = [
  { value: "ALL", label: "All Discussions", icon: "💬" },
  { value: "QUESTION", label: "Questions", icon: "❓" },
  { value: "DISCUSSION", label: "Discussions", icon: "💭" },
  { value: "ANNOUNCEMENT", label: "Announcements", icon: "📢" },
  { value: "HELP", label: "Help", icon: "🆘" },
  { value: "FEEDBACK", label: "Feedback", icon: "💡" },
  { value: "RESOURCE_SHARING", label: "Resources", icon: "📚" },
];

const SORT_OPTIONS = [
  { value: "lastActivityAt,DESC", label: "Recent Activity" },
  { value: "createdAt,DESC", label: "Newest First" },
  { value: "upvotes,DESC", label: "Most Upvoted" },
  { value: "replyCount,DESC", label: "Most Replies" },
  { value: "viewCount,DESC", label: "Most Viewed" },
];

export default function ForumList() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState("lastActivityAt,DESC");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  
  // Get courseId/chapterId from URL params if accessing from course/chapter context
  const courseId = searchParams.get("courseId");
  const chapterId = searchParams.get("chapterId");

  useEffect(() => {
    fetchPosts();
  }, [page, selectedCategory, sortBy, searchQuery, courseId, chapterId]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      let endpoint = "/forum/posts";
      const [sortField, sortDirection] = sortBy.split(",");
      
      const params = {
        page,
        size: 20,
        sortBy: sortField,
        direction: sortDirection,
      };
      
      // Determine endpoint based on filters
      if (searchQuery) {
        endpoint = "/forum/posts/search";
        params.keyword = searchQuery;
      } else if (chapterId) {
        endpoint = `/forum/posts/chapter/${chapterId}`;
      } else if (courseId) {
        endpoint = `/forum/posts/course/${courseId}`;
      } else if (selectedCategory !== "ALL") {
        endpoint = `/forum/posts/category/${selectedCategory}`;
      }
      
      const response = await axios.get(endpoint, { params });
      
      setPosts(response.data.data.content);
      setTotalPages(response.data.data.totalPages);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to load forum posts");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(0);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setPage(0);
    setSearchQuery("");
    setSearchInput("");
  };

  const getCategoryColor = (category) => {
    const colors = {
      QUESTION: "bg-blue-100 text-blue-700",
      DISCUSSION: "bg-purple-100 text-purple-700",
      ANNOUNCEMENT: "bg-red-100 text-red-700",
      HELP: "bg-orange-100 text-orange-700",
      FEEDBACK: "bg-green-100 text-green-700",
      RESOURCE_SHARING: "bg-teal-100 text-teal-700",
      GENERAL: "bg-gray-100 text-gray-700",
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">💬 Discussion Forum</h1>
              <p className="text-blue-100 mt-1 text-sm">
                {courseId || chapterId ? "Course Discussions" : "Connect, share, and learn together"}
              </p>
            </div>
            <button
              onClick={() => navigate("/forum/new")}
              className="bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg font-bold flex items-center gap-1 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm">
            >
              <span className="text-lg">+</span> New Post
            </button>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mt-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 text-sm">🔍</span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search discussions..."
                className="w-full bg-white/95 backdrop-blur-sm border-2 border-white/50 rounded-lg px-9 py-2 pr-24 focus:outline-none focus:ring-2 focus:ring-white focus:border-white shadow-lg placeholder-blue-300 text-sm"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 text-white px-4 py-1.5 rounded-md text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-200">
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex gap-4">
          {/* Sidebar */}
          <div className="w-56 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-xl p-3 border border-blue-100">
              <h3 className="font-bold text-gray-900 mb-2 text-sm flex items-center gap-1.5">
                <span className="text-blue-600">📂</span> Categories
              </h3>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => handleCategoryChange(cat.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                      selectedCategory === cat.value
                        ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white font-semibold shadow-lg transform scale-105"
                        : "hover:bg-blue-50 text-gray-700 hover:shadow-md"
                    }`}>
                  >
                    <span className="text-sm">{cat.icon}</span>
                    <span className="text-xs">{cat.label}</span>
                  </button>
                ))}
              </div>

              <h3 className="font-bold text-gray-900 mt-4 mb-2 text-sm flex items-center gap-1.5">
                <span className="text-blue-600">🔄</span> Sort By
              </h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border-2 border-blue-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gradient-to-br from-white to-blue-50 font-medium shadow-md hover:shadow-lg transition-all duration-200">
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Posts List */}
          <div className="flex-1">
            {loading ? (
              <div className="bg-white rounded-xl shadow-xl p-6 text-center border border-purple-100">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
                <p className="mt-3 text-gray-600 text-sm font-medium">Loading discussions...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-gradient-to-br from-white to-purple-50 rounded-xl shadow-xl p-6 text-center border border-purple-100">
                <div className="text-4xl mb-2">💬</div>
                <p className="text-gray-700 text-sm font-medium">No discussions found. Be the first to start one!</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => navigate(`/forum/post/${post.id}`)}
                      className="bg-white rounded-xl shadow-lg p-4 hover:shadow-2xl transition-all duration-300 cursor-pointer border border-purple-100 hover:border-purple-300 transform hover:-translate-y-1"
                    >
                      <div className="flex gap-3">
                        {/* Vote Count */}
                        <div className="flex flex-col items-center gap-0.5 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg px-3 py-2 border-2 border-purple-200">
                          <div className="text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                            {post.netVotes}
                          </div>
                          <div className="text-[10px] text-purple-600 font-semibold uppercase">votes</div>
                        </div>

                        {/* Post Content */}
                        <div className="flex-1">
                          <div className="flex items-start gap-2 mb-2">
                            {/* Badges */}
                            {post.isPinned && (
                              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-[10px] px-2 py-1 rounded-full font-semibold shadow-md">
                                📌 Pinned
                              </span>
                            )}
                            {post.isLocked && (
                              <span className="bg-gradient-to-r from-gray-400 to-gray-500 text-white text-[10px] px-2 py-1 rounded-full font-semibold shadow-md">
                                🔒 Locked
                              </span>
                            )}
                            {post.isResolved && (
                              <span className="bg-gradient-to-r from-green-400 to-emerald-500 text-white text-[10px] px-2 py-1 rounded-full font-semibold shadow-md">
                                ✓ Resolved
                              </span>
                            )}
                            <span className={`text-[10px] px-2 py-1 rounded-full font-semibold shadow-sm ${getCategoryColor(post.category)}`}>
                              {post.category}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-gray-900 hover:text-purple-600 mb-1.5 transition-colors duration-200">
                            {post.title}
                          </h3>

                          <p className="text-gray-600 text-xs line-clamp-1 mb-2">
                            {post.content}
                          </p>

                          {/* Tags */}
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {post.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium border border-indigo-200"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="flex items-center gap-2 text-[10px] text-gray-600 font-medium">
                            <span className="flex items-center gap-0.5">
                              <span className="text-purple-500">👤</span> {post.authorUsername}
                            </span>
                            <span className="text-purple-300">•</span>
                            <span className="flex items-center gap-0.5">
                              <span className="text-purple-500">🕒</span> {formatDate(post.lastActivityAt)}
                            </span>
                            <span className="text-purple-300">•</span>
                            <span className="flex items-center gap-0.5 text-indigo-600">
                              💬 <strong>{post.replyCount}</strong>
                            </span>
                            <span className="text-purple-300">•</span>
                            <span className="flex items-center gap-0.5 text-purple-600">
                              👁 <strong>{post.viewCount}</strong>
                            </span>
                            {post.courseName && (
                              <>
                                <span className="text-purple-300">•</span>
                                <span className="flex items-center gap-0.5 text-pink-600">
                                  📚 {post.courseName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4 flex justify-center items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="px-4 py-2 bg-white border-2 border-purple-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-600 hover:text-white hover:border-transparent font-semibold shadow-md hover:shadow-lg transition-all duration-200 text-xs"
                    >
                      ← Prev
                    </button>
                    <span className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-bold shadow-lg text-xs">
                      {page + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="px-4 py-2 bg-white border-2 border-purple-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-600 hover:text-white hover:border-transparent font-semibold shadow-md hover:shadow-lg transition-all duration-200 text-xs"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

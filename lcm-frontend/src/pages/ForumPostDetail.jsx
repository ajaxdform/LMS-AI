import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useAdmin } from "../hooks/useAdmin";

export default function ForumPostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [repliesPage, setRepliesPage] = useState(0);
  const [repliesTotalPages, setRepliesTotalPages] = useState(0);

  useEffect(() => {
    fetchPost();
    fetchReplies();
  }, [postId]);

  useEffect(() => {
    if (repliesPage > 0) {
      fetchReplies();
    }
  }, [repliesPage]);

  const fetchPost = async () => {
    try {
      const response = await axios.get(`/forum/posts/${postId}`);
      setPost(response.data.data);
    } catch (error) {
      console.error("Error fetching post:", error);
      toast.error("Failed to load post");
      navigate("/forum");
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async () => {
    try {
      const response = await axios.get(`/forum/replies/post/${postId}`, {
        params: { page: repliesPage, size: 20, sortBy: "createdAt", direction: "ASC" },
      });
      setReplies(response.data.data.content);
      setRepliesTotalPages(response.data.data.totalPages);
    } catch (error) {
      console.error("Error fetching replies:", error);
    }
  };

  const handleVotePost = async (voteType) => {
    try {
      const response = await axios.post(`/forum/posts/${postId}/vote`, { voteType });
      setPost(response.data.data);
      toast.success("Vote recorded");
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to vote");
    }
  };

  const handleVoteReply = async (replyId, voteType) => {
    try {
      const response = await axios.post(`/forum/replies/${replyId}/vote`, { voteType });
      setReplies(replies.map((r) => (r.id === replyId ? response.data.data : r)));
      toast.success("Vote recorded");
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to vote");
    }
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    
    if (!replyContent.trim()) {
      toast.warning("Please enter a reply");
      return;
    }
    
    if (post.isLocked && !isAdmin) {
      toast.error("This post is locked");
      return;
    }
    
    try {
      setSubmittingReply(true);
      await axios.post("/forum/replies", {
        content: replyContent,
        postId,
      });
      
      setReplyContent("");
      toast.success("Reply posted!");
      fetchPost(); // Refresh to update reply count
      fetchReplies();
    } catch (error) {
      console.error("Error posting reply:", error);
      toast.error(error.response?.data?.message || "Failed to post reply");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleMarkAsAnswer = async (replyId) => {
    try {
      await axios.post(`/forum/replies/${replyId}/accept`);
      toast.success("Marked as accepted answer!");
      fetchPost();
      fetchReplies();
    } catch (error) {
      console.error("Error marking answer:", error);
      toast.error(error.response?.data?.message || "Failed to mark as answer");
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    
    try {
      await axios.delete(`/forum/posts/${postId}`);
      toast.success("Post deleted");
      navigate("/forum");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!window.confirm("Are you sure you want to delete this reply?")) return;
    
    try {
      await axios.delete(`/forum/replies/${replyId}`);
      toast.success("Reply deleted");
      fetchPost();
      fetchReplies();
    } catch (error) {
      console.error("Error deleting reply:", error);
      toast.error("Failed to delete reply");
    }
  };

  const handleTogglePin = async () => {
    try {
      const response = await axios.post(`/forum/posts/${postId}/pin`);
      setPost(response.data.data);
      toast.success(response.data.data.isPinned ? "Post pinned" : "Post unpinned");
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast.error("Failed to toggle pin");
    }
  };

  const handleToggleLock = async () => {
    try {
      const response = await axios.post(`/forum/posts/${postId}/lock`);
      setPost(response.data.data);
      toast.success(response.data.data.isLocked ? "Post locked" : "Post unlocked");
    } catch (error) {
      console.error("Error toggling lock:", error);
      toast.error("Failed to toggle lock");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-blue-600 font-semibold">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
          <p className="text-gray-600 text-lg">Post not found</p>
        </div>
      </div>
    );
  }

  const canEdit = user && (post.authorId === user.uid || isAdmin);
  const canMarkAnswer = user && (post.authorId === user.uid || isAdmin) && post.category === "QUESTION";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 py-3">
      <div className="max-w-5xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate("/forum")}
          className="mb-3 bg-white text-blue-600 hover:text-blue-700 px-4 py-2 rounded-lg flex items-center gap-1 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold border border-blue-200 text-sm"
        >
          <span className="text-lg">←</span> Back to Forum
        </button>

        {/* Post */}
        <div className="bg-white rounded-xl shadow-xl p-4 mb-4 border border-blue-100">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            {/* Voting */}
            <div className="flex flex-col items-center gap-1 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl px-3 py-3 border-2 border-blue-200 shadow-lg">
              <button
                onClick={() => handleVotePost(post.userVoteStatus === "UPVOTED" ? "REMOVE" : "UPVOTE")}
                className={`p-2 rounded-lg hover:bg-white transition-all duration-200 text-lg ${
                  post.userVoteStatus === "UPVOTED" ? "text-blue-600 bg-white shadow-md" : "text-gray-400"
                }`}
              >
                ▲
              </button>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{post.netVotes}</span>
              <button
                onClick={() => handleVotePost(post.userVoteStatus === "DOWNVOTED" ? "REMOVE" : "DOWNVOTE")}
                className={`p-2 rounded-lg hover:bg-white transition-all duration-200 text-lg ${
                  post.userVoteStatus === "DOWNVOTED" ? "text-red-600 bg-white shadow-md" : "text-gray-400"
                }`}
              >
                ▼
              </button>
            </div>

            {/* Content */}
            <div className="flex-1">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <span className={`text-[10px] px-2 py-1 rounded-full font-semibold shadow-md ${getCategoryColor(post.category)}`}>
                  {post.category}
                </span>
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
              </div>

              <h1 className="text-lg font-bold text-gray-900 mb-2 leading-tight">{post.title}</h1>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 mb-2 border border-blue-200 shadow-inner">
                <p className="text-gray-800 whitespace-pre-wrap text-sm leading-snug">{post.content}</p>
              </div>

              {/* Attachments */}
              {post.attachments && post.attachments.length > 0 && (
                <div className="mb-2">
                  <h3 className="text-xs font-bold text-blue-700 mb-1.5 flex items-center gap-1.5">
                    <span>📎</span> Attachments ({post.attachments.length})
                  </h3>
                  <div className="space-y-1.5">
                    {post.attachments.map((attachment, idx) => (
                      <a
                        key={idx}
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-white border border-blue-200 rounded-lg px-3 py-2 hover:border-blue-400 hover:shadow-lg transition-all duration-200 group"
                      >
                        <span className="text-2xl">
                          {attachment.isImage ? '🖼️' : 
                           attachment.fileType === 'application/pdf' ? '📄' :
                           attachment.fileType?.includes('presentation') ? '📊' : '📝'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-blue-700">
                            {attachment.fileName}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {attachment.formattedFileSize || `${(attachment.fileSize / 1024).toFixed(1)} KB`}
                          </p>
                        </div>
                        <span className="text-blue-600 text-lg group-hover:text-blue-800">⬇</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {post.tags.map((tag, idx) => (
                    <span key={idx} className="text-[9px] bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium border border-indigo-200 shadow-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-2 text-[10px] text-gray-600 font-medium bg-gradient-to-r from-blue-50 to-indigo-50 px-2 py-1.5 rounded-lg border border-blue-100">
                <span className="flex items-center gap-1">
                  <span className="text-blue-600">👤</span> <strong className="text-blue-700">{post.authorUsername}</strong>
                </span>
                <span className="text-blue-300">•</span>
                <span className="flex items-center gap-1">
                  <span className="text-blue-600">🕒</span> {formatDate(post.createdAt)}
                </span>
                <span className="text-blue-300">•</span>
                <span className="flex items-center gap-1 text-blue-700">
                  <span>👁</span> <strong>{post.viewCount}</strong>
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-2">
                {canEdit && (
                  <button
                    onClick={handleDeletePost}
                    className="bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    🗑️ Delete
                  </button>
                )}
                {isAdmin && (
                  <>
                    <button
                      onClick={handleTogglePin}
                      className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {post.isPinned ? "Unpin" : "Pin"}
                    </button>
                    <button
                      onClick={handleToggleLock}
                      className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {post.isLocked ? "Unlock" : "Lock"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Replies Section */}
        <div className="bg-white rounded-xl shadow-xl p-4 border border-blue-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-lg shadow-lg text-sm">
              {post.replyCount}
            </span>
            <span>{post.replyCount === 1 ? "Reply" : "Replies"}</span>
          </h2>

          {/* Reply Form */}
          {!post.isLocked || isAdmin ? (
            <form onSubmit={handleSubmitReply} className="mb-3">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-2 border-2 border-blue-200 shadow-lg">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write your reply..."
                  rows="3"
                  className="w-full border-2 border-blue-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-md text-xs"
                />
                <button
                  type="submit"
                  disabled={submittingReply}
                  className="mt-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 text-white px-4 py-1.5 rounded-lg disabled:opacity-50 font-bold shadow-lg hover:shadow-xl transition-all duration-200 text-xs"
                >
                  {submittingReply ? "Posting..." : "✉️ Post Reply"}
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-3 p-2 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg text-gray-700 border-2 border-gray-300 shadow-lg font-semibold flex items-center gap-2 text-xs">
              <span className="text-base">🔒</span> This post is locked and cannot accept new replies.
            </div>
          )}

          {/* Replies List */}
          <div className="space-y-2">
            {replies.map((reply) => (
              <div key={reply.id} className={`rounded-lg p-2 shadow-lg border-l-4 ${
                reply.isAcceptedAnswer 
                  ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-green-200" 
                  : "border-blue-300 bg-gradient-to-br from-white to-blue-50"
              }`}>
                <div className="flex gap-2">
                  {/* Vote Buttons */}
                  <div className="flex flex-col items-center gap-0.5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg px-1.5 py-1.5 border-2 border-blue-200 shadow-md h-fit">
                    <button
                      onClick={() => handleVoteReply(reply.id, reply.userVoteStatus === "UPVOTED" ? "REMOVE" : "UPVOTE")}
                      className={`text-xs p-0.5 rounded-md hover:bg-white transition-all duration-200 ${
                        reply.userVoteStatus === "UPVOTED" ? "text-blue-600 bg-white shadow-md" : "text-gray-400"
                      }`}
                    >
                      ▲
                    </button>
                    <span className="text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{reply.netVotes}</span>
                    <button
                      onClick={() => handleVoteReply(reply.id, reply.userVoteStatus === "DOWNVOTED" ? "REMOVE" : "DOWNVOTE")}
                      className={`text-xs p-0.5 rounded-md hover:bg-white transition-all duration-200 ${
                        reply.userVoteStatus === "DOWNVOTED" ? "text-red-600 bg-white shadow-md" : "text-gray-400"
                      }`}
                    >
                      ▼
                    </button>
                  </div>

                  <div className="flex-1">
                    {reply.isAcceptedAnswer && (
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-[9px] mb-1.5 px-1.5 py-0.5 rounded-lg inline-block shadow-lg">
                        ✓ Accepted Answer
                      </div>
                    )}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-2 mb-1.5 border border-gray-200 shadow-inner">
                      <p className="text-gray-800 whitespace-pre-wrap leading-snug text-xs">{reply.content}</p>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-gray-600 font-medium bg-white px-2 py-1 rounded-lg border border-blue-100 shadow-sm">
                      <span className="flex items-center gap-0.5">
                        <span className="text-blue-600">👤</span> <strong className="text-blue-700">{reply.authorUsername}</strong>
                      </span>
                      <span className="text-blue-300">•</span>
                      <span className="flex items-center gap-0.5">
                        <span className="text-blue-600">🕒</span> {formatDate(reply.createdAt)}
                      </span>
                      {canMarkAnswer && !reply.isAcceptedAnswer && (
                        <>
                          <span className="text-blue-300">•</span>
                          <button
                            onClick={() => handleMarkAsAnswer(reply.id)}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-2 py-1 rounded-md font-semibold shadow-md hover:shadow-lg transition-all duration-200">
                          >
                            ✓ Answer
                          </button>
                        </>
                      )}
                      {(user && (reply.authorId === user.uid || isAdmin)) && (
                        <>
                          <span className="text-blue-300">•</span>
                          <button
                            onClick={() => handleDeleteReply(reply.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md font-semibold shadow-md hover:shadow-lg transition-all duration-200">
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {repliesTotalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-3">
              <button
                onClick={() => setRepliesPage((p) => Math.max(0, p - 1))}
                disabled={repliesPage === 0}
                className="px-6 py-3 bg-white border-2 border-blue-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gradient-to-r hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 hover:text-white hover:border-transparent font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                ← Previous
              </button>
              <span className="px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white rounded-xl font-bold shadow-lg">
                Page {repliesPage + 1} of {repliesTotalPages}
              </span>
              <button
                onClick={() => setRepliesPage((p) => Math.min(repliesTotalPages - 1, p + 1))}
                disabled={repliesPage >= repliesTotalPages - 1}
                className="px-6 py-3 bg-white border-2 border-blue-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gradient-to-r hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 hover:text-white hover:border-transparent font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

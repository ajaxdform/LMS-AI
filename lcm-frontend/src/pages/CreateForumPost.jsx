import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "../api/axios";
import { useToast } from "../context/ToastContext";

const CATEGORIES = [
  { value: "GENERAL", label: "General", icon: "💬" },
  { value: "QUESTION", label: "Question", icon: "❓" },
  { value: "DISCUSSION", label: "Discussion", icon: "💭" },
  { value: "ANNOUNCEMENT", label: "Announcement", icon: "📢" },
  { value: "HELP", label: "Help Request", icon: "🆘" },
  { value: "FEEDBACK", label: "Feedback", icon: "💡" },
  { value: "RESOURCE_SHARING", label: "Resource Sharing", icon: "📚" },
  { value: "BUG_REPORT", label: "Bug Report", icon: "🐛" },
];

export default function CreateForumPost() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  
  const courseId = searchParams.get("courseId");
  const chapterId = searchParams.get("chapterId");
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "GENERAL",
    tags: "",
    courseId: courseId || "",
    chapterId: chapterId || "",
  });
  
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const validFiles = files.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast.warning(`${file.name} is too large (max 10MB)`);
        return false;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.warning(`${file.name} has an unsupported file type`);
        return false;
      }
      return true;
    });
    
    setAttachments([...attachments, ...validFiles]);
  };
  
  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.warning("Please fill in all required fields");
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Upload files first if there are any
      let uploadedAttachments = [];
      if (attachments.length > 0) {
        const formDataForFiles = new FormData();
        attachments.forEach(file => {
          formDataForFiles.append('files', file);
        });
        
        try {
          const uploadResponse = await axios.post("/forum/upload", formDataForFiles, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          uploadedAttachments = uploadResponse.data.data || [];
        } catch (uploadError) {
          console.error("Error uploading files:", uploadError);
          toast.error("Failed to upload attachments");
          setSubmitting(false);
          return;
        }
      }
      
      const postData = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
        courseId: formData.courseId || null,
        chapterId: formData.chapterId || null,
        attachments: uploadedAttachments,
      };
      
      const response = await axios.post("/forum/posts", postData);
      
      toast.success("Post created successfully!");
      navigate(`/forum/post/${response.data.data.id}`);
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error(error.response?.data?.message || "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 py-3">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-2xl p-3 border border-purple-100">
          {/* Header */}
          <div className="mb-3 text-center">
            <div className="inline-block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white px-3 py-1.5 rounded-lg shadow-lg mb-1.5">
              <span className="text-xl">✏️</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 bg-clip-text text-transparent mb-0.5">Create New Post</h1>
            <p className="text-gray-600 text-xs">Share your thoughts, ask questions, or start a discussion</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                <span className="text-blue-600">📂</span> Category *
              </label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.value })}
                    className={`p-2 rounded-lg border-2 text-xs transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${
                      formData.category === cat.value
                        ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-700 font-bold shadow-xl scale-105"
                        : "border-blue-200 hover:border-blue-400 bg-white"
                    }`}>
                  >
                    <div className="text-2xl mb-1">{cat.icon}</div>
                    <div className="text-[10px] font-semibold">{cat.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5 flex items-center gap-1.5">
                <span className="text-blue-600">📝</span> Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter a clear and descriptive title"
                className="w-full border-2 border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gradient-to-br from-white to-blue-50 font-medium shadow-md hover:shadow-lg transition-all duration-200 text-sm"
                required
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5 flex items-center gap-1.5">
                <span className="text-blue-600">✉️</span> Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your post content here..."
                rows="10"
                className="w-full border-2 border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs bg-gradient-to-br from-white to-blue-50 shadow-md hover:shadow-lg transition-all duration-200"
                required
              />
              <p className="text-xs text-blue-600 mt-1 font-medium flex items-center gap-1.5">
                <span>✨</span> Supports plain text. Be clear and respectful.
              </p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5 flex items-center gap-1.5">
                <span className="text-blue-600">🏷️</span> Tags (Optional)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="javascript, react, bug, question (comma separated)"
                className="w-full border-2 border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gradient-to-br from-white to-blue-50 font-medium shadow-md hover:shadow-lg transition-all duration-200 text-xs"
              />
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5 flex items-center gap-1.5">
                <span className="text-blue-600">📎</span> Attachments (Optional)
              </label>
              <div className="border-2 border-dashed border-blue-300 rounded-lg p-3 bg-gradient-to-br from-white to-blue-50 hover:border-blue-500 transition-all duration-200">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.ppt,.pptx,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center py-2"
                >
                  <div className="text-3xl mb-1">📁</div>
                  <p className="text-sm font-semibold text-blue-700 mb-0.5">
                    Click to upload files
                  </p>
                  <p className="text-xs text-gray-600">
                    Images, PDFs, PowerPoint, Word (Max 10MB each)
                  </p>
                </label>
              </div>

              {/* Attachments Preview */}
              {attachments.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 shadow-sm">
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xl">
                          {file.type.startsWith('image/') ? '🖼️' : 
                           file.type === 'application/pdf' ? '📄' :
                           file.type.includes('presentation') ? '📊' : '📝'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-red-500 hover:text-red-700 font-bold text-lg ml-2"
                        title="Remove attachment"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Context Info (if from course/chapter) */}
            {(courseId || chapterId) && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-3 shadow-lg">
                <p className="text-xs text-blue-800 font-semibold flex items-center gap-2">
                  <span className="text-lg">📚</span> This post will be associated with the current course/chapter
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-3 border-t-2 border-blue-100">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 text-white px-6 py-2.5 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 text-sm"
              >
                {submitting ? "⏳ Creating..." : "✨ Create Post"}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2.5 bg-white border-2 border-blue-300 hover:bg-blue-50 text-gray-800 rounded-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

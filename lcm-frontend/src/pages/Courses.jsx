import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Pagination from "../components/Pagination";

// Helper function to strip HTML tags from text
const stripHtmlTags = (html) => {
  if (!html) return '';
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
};

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(12);
  const [allSubjects, setAllSubjects] = useState([]);

  useEffect(() => {
    fetchCourses(null, 0);
  }, []);

  const fetchCourses = async (subject = null, page = 0) => {
    setLoading(true);
    setError("");
    try {
      let endpoint = `/courses?page=${page}&size=${pageSize}`;
      if (subject && subject !== "all") {
        endpoint = `/courses/subject/${encodeURIComponent(subject)}/paginated?page=${page}&size=${pageSize}`;
      }
      console.log('Fetching courses from:', endpoint);
      const response = await api.get(endpoint);
      console.log('Response:', response.data);
      const pageData = response.data.data;
      
      if (!pageData || !pageData.content) {
        console.error('Invalid page data structure:', pageData);
        setCourses([]);
        setCurrentPage(0);
        setTotalPages(0);
        setTotalElements(0);
        return;
      }
      
      setCourses(pageData.content || []);
      setCurrentPage(pageData.number || 0);
      setTotalPages(pageData.totalPages || 0);
      setTotalElements(pageData.totalElements || 0);
      
      // Fetch all courses to get unique subjects if not already loaded
      if (allSubjects.length === 0) {
        const allResponse = await api.get('/courses/all');
        const subjects = [...new Set((allResponse.data.data || []).map(c => c.subject).filter(Boolean))];
        setAllSubjects(subjects);
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
      if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
        setError("Cannot connect to backend. Please ensure the backend server is running on http://localhost:8080");
      } else if (err.response?.data) {
        setError(`Error: ${err.response.data.message || err.response.data}`);
      } else {
        setError(`Failed to load courses: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchCourses(filterSubject === "all" ? null : filterSubject, 0);
      return;
    }

    setLoading(true);
    setError("");
    setCurrentPage(0);
    try {
      const response = await api.get(`/courses/search/paginated?q=${encodeURIComponent(searchTerm)}&page=0&size=${pageSize}`);
      const pageData = response.data.data;
      let results = pageData.content || [];
      
      if (filterSubject !== "all") {
        results = results.filter(course => course.subject === filterSubject);
      }
      
      setCourses(results);
      setTotalPages(pageData.totalPages || 0);
      setTotalElements(results.length);
    } catch (err) {
      console.error("Error searching courses:", err);
      setError("Failed to search courses");
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = (subject) => {
    setFilterSubject(subject);
    setSearchTerm("");
    setCurrentPage(0);
    fetchCourses(subject, 0);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterSubject("all");
    setCurrentPage(0);
    fetchCourses(null, 0);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchCourses(filterSubject === "all" ? null : filterSubject, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const uniqueSubjects = allSubjects.length > 0 ? allSubjects : [...new Set(courses.map(c => c.subject).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">All Courses</h1>
        
        {/* Search and Filter Bar */}
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
              >
                Search
              </button>
            </div>
            
            <div className="md:w-64">
              <select
                value={filterSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Subjects</option>
                {uniqueSubjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
            
            {(searchTerm || filterSubject !== 'all') && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium whitespace-nowrap"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
        
        {/* Results Count */}
        {filterSubject !== 'all' && courses.length > 0 && (
          <div className="text-sm text-gray-600 mb-4">
            Showing {courses.length} {courses.length === 1 ? 'course' : 'courses'} in {filterSubject}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {courses.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {course.title}
                    </h3>
                  </div>
                  {course.subject && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded mb-2">
                      {course.subject}
                    </span>
                  )}
                  {course.description && (
                    <p className="text-gray-600 text-sm mt-2 line-clamp-3">
                      {stripHtmlTags(course.description)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
          
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalElements={totalElements}
            pageSize={pageSize}
          />
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No courses found</p>
        </div>
      )}
    </div>
  );
}


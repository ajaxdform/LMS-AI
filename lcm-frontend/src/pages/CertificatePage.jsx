import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function CertificatePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [eligible, setEligible] = useState(false);
  const [eligibilityDetails, setEligibilityDetails] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch course details
        const courseResponse = await api.get(`/courses/${courseId}`);
        setCourse(courseResponse.data.data);

        // Check certificate eligibility
        const eligibilityResponse = await api.get(
          `/certificates/course/${courseId}/check`
        );
        const eligibilityData = eligibilityResponse.data.data;
        setEligibilityDetails(eligibilityData);
        setEligible(eligibilityData.eligible || false);
      } catch (err) {
        console.error("Error fetching certificate data:", err);
        if (err.response?.status === 401) {
          setError("Please log in to view certificate");
        } else if (err.response?.status === 404) {
          setError("Course not found");
        } else if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError("Failed to load certificate information");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, user]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/certificates/course/${courseId}`, {
        responseType: "blob",
      });

      // Create download link
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Certificate_${course?.title || "Course"}_${user.email}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading certificate:", err);
      alert("Failed to download certificate. Please try again.");
    } finally {
      setDownloading(false);
    }
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
          onClick={() => navigate(`/courses/${courseId}`)}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Course
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/courses/${courseId}`)}
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
          Back to Course
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Course Certificate
        </h1>
        <p className="text-gray-600">{course?.title}</p>
      </div>

      {eligible ? (
        /* Eligible for Certificate */
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Success Banner */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-white text-center">
            <div className="mb-4">
              <svg
                className="w-20 h-20 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-2">Congratulations! 🎉</h2>
            <p className="text-lg">
              You've successfully completed this course and are eligible for a
              certificate!
            </p>
          </div>

          {/* Certificate Preview */}
          <div className="p-8">
            <div className="border-4 border-gray-300 rounded-lg p-12 text-center bg-gradient-to-br from-gray-50 to-blue-50">
              <div className="mb-6">
                <div className="text-4xl font-serif text-gray-700">
                  Certificate of Completion
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  This certifies that
                </div>
              </div>

              <div className="my-8">
                <div className="text-3xl font-bold text-gray-900 border-b-2 border-gray-400 inline-block pb-2 px-8">
                  {user.displayName || user.email}
                </div>
              </div>

              <div className="mb-6">
                <div className="text-sm text-gray-500 mb-2">
                  has successfully completed the course
                </div>
                <div className="text-2xl font-semibold text-gray-800">
                  {course?.title}
                </div>
              </div>

              {eligibilityDetails && (
                <div className="grid grid-cols-2 gap-4 mt-8 max-w-md mx-auto">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-xs text-gray-500">Progress</div>
                    <div className="text-lg font-bold text-green-600">
                      {eligibilityDetails.progressPercentage || 100}%
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-xs text-gray-500">Completed</div>
                    <div className="text-lg font-bold text-blue-600">
                      {new Date().toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Download Button */}
            <div className="mt-8 text-center">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium text-lg disabled:opacity-50 inline-flex items-center gap-3"
              >
                {downloading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Generating Certificate...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-6 h-6"
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
                    Download Certificate
                  </>
                )}
              </button>
              <p className="text-sm text-gray-500 mt-3">
                Certificate will be downloaded as a PDF file
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Not Eligible for Certificate */
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-12 h-12 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Certificate Not Yet Available
            </h2>
            <p className="text-gray-600 mb-8">
              Complete the course requirements to unlock your certificate
            </p>

            {/* Requirements */}
            <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="font-semibold text-gray-900 mb-4">
                Requirements to Complete:
              </h3>
              <ul className="space-y-3 text-left">
                {eligibilityDetails && (
                  <>
                    <li className="flex items-start gap-3">
                      {eligibilityDetails.progressPercentage >= 100 ? (
                        <svg
                          className="w-6 h-6 text-green-500 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-6 h-6 text-gray-400 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          Complete all chapters
                        </div>
                        <div className="text-sm text-gray-500">
                          Progress: {eligibilityDetails.progressPercentage || 0}%
                        </div>
                      </div>
                    </li>

                    {eligibilityDetails.reason && (
                      <li className="text-sm text-gray-600 pt-4 border-t border-gray-200">
                        {eligibilityDetails.reason}
                      </li>
                    )}
                  </>
                )}
              </ul>
            </div>

            {/* Action Button */}
            <div className="mt-8">
              <button
                onClick={() => navigate(`/courses/${courseId}/chapters`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Continue Learning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

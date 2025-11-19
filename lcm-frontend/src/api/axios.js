import axios from "axios";
import { auth } from "../firebase";

const api = axios.create({
  baseURL: "http://localhost:8080/api/v1",
  withCredentials: true, // Enable CSRF cookie support
});

// Helper function to get CSRF token from cookie
const getCsrfToken = () => {
  const name = 'XSRF-TOKEN=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length, cookie.length);
    }
  }
  return null;
};

// Request interceptor to add token and CSRF
api.interceptors.request.use(
  async (config) => {
    try {
      // Add CSRF token from cookie to header
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers['X-XSRF-TOKEN'] = csrfToken;
      }
      
      // Get fresh token from Firebase if user is logged in
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
        localStorage.setItem("token", token);
      } else {
        // Fallback to stored token
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error("Error getting token:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    
    // Handle 401 Unauthorized and 403 Forbidden for unauthenticated users
    if (status === 401 || status === 403) {
      const currentUser = auth.currentUser;
      
      // Only try to refresh and redirect if user is actually logged in
      if (currentUser && status === 401) {
        // Token expired, try to refresh
        try {
          const newToken = await currentUser.getIdToken(true); // Force refresh
          localStorage.setItem("token", newToken);
          // Retry the original request
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api.request(error.config);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          // Redirect to login only if token refresh fails for logged-in user
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      }
      // If no current user, don't redirect - just return the error
      // This allows unauthenticated users to browse public content
    }
    return Promise.reject(error);
  }
);

export default api;

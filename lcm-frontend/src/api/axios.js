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
      // For non-GET requests, ensure we have a CSRF token
      if (config.method && config.method.toLowerCase() !== 'get') {
        let csrfToken = getCsrfToken();
        
        // If no CSRF token exists, fetch it first
        if (!csrfToken) {
          try {
            // Use dedicated CSRF endpoint
            await axios.get('http://localhost:8080/api/v1/csrf', {
              withCredentials: true
            });
            csrfToken = getCsrfToken();
          } catch (err) {
            console.warn('Failed to fetch CSRF token:', err);
          }
        }
        
        // Add CSRF token to header
        if (csrfToken) {
          config.headers['X-XSRF-TOKEN'] = csrfToken;
        }
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
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized and 403 Forbidden for authenticated users
    if (status === 401 || status === 403) {
      const currentUser = auth.currentUser;
      
      // Handle 403 CSRF token issues for authenticated users
      if (currentUser && status === 403 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          // Fetch a fresh CSRF token using dedicated endpoint
          await axios.get('http://localhost:8080/api/v1/csrf', {
            withCredentials: true
          });
          
          const csrfToken = getCsrfToken();
          if (csrfToken) {
            originalRequest.headers['X-XSRF-TOKEN'] = csrfToken;
          }
          
          // Also refresh the Firebase token
          const newToken = await currentUser.getIdToken(true);
          localStorage.setItem("token", newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Retry the original request
          return api.request(originalRequest);
        } catch (retryError) {
          console.error("Retry failed:", retryError);
          // If retry fails, redirect to login
          localStorage.removeItem("token");
          window.location.href = "/login";
          return Promise.reject(retryError);
        }
      }
      
      // Handle 401 for authenticated users (token expired)
      if (currentUser && status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const newToken = await currentUser.getIdToken(true); // Force refresh
          localStorage.setItem("token", newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api.request(originalRequest);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          localStorage.removeItem("token");
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      }
      
      // If no current user, don't redirect - just return the error
      // This allows unauthenticated users to browse public content
    }
    return Promise.reject(error);
  }
);

export default api;

import axios from "axios";
import { auth } from "../firebase";

const api = axios.create({
  baseURL: "http://localhost:8080/api/v1",
  withCredentials: true, // Enable credentials for CORS
});

// Request interceptor to add Firebase authentication token
api.interceptors.request.use(
  async (config) => {
    try {
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
    
    // Handle 401 Unauthorized for authenticated users
    if (status === 401) {
      const currentUser = auth.currentUser;
      
      // Try to refresh token for authenticated users
      if (currentUser && !originalRequest._retry) {
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
    }
    
    // For 403 errors, log but don't redirect (could be permission issue)
    if (status === 403) {
      const currentUser = auth.currentUser;
      if (currentUser) {
        console.error("Access forbidden - you may not have the required permissions");
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

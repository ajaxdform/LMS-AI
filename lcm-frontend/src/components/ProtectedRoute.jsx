import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAdmin } from "../hooks/useAdmin";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  // Show loading spinner while checking authentication
  if (authLoading || (adminOnly && adminLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to dashboard if admin-only route but user is not admin
  if (adminOnly && !isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Access Denied</p>
          <p>You don't have permission to access this page. Admin privileges required.</p>
        </div>
      </div>
    );
  }

  return children;
}


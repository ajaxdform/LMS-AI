import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

/**
 * Custom hook to check if the current user has ADMIN role
 * @returns {Object} { isAdmin: boolean, loading: boolean, checkAdmin: function }
 */
export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminRole();
  }, [user]);

  const checkAdminRole = async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      // Get current user details to check role
      const response = await api.get('/users/me');
      const userRole = response.data.data.role;
      setIsAdmin(userRole === 'ADMIN');
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  return { isAdmin, loading, checkAdmin: checkAdminRole };
};

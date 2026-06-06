// ProtectedRoute — wraps any route that requires authentication
// If user is not logged in they get redirected to /login automatically
// Outlet renders whatever child route is being protected

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = () => {
  // Get current user and loading state from AuthContext
  const { user, loading } = useAuth();

  // Wait for auth check to complete before deciding
  // This prevents a flash redirect while localStorage is being read
  if (loading) {
    return <div>Loading...</div>;
  }

  // If no user is logged in redirect to login page
  // Otherwise render the protected page via Outlet
  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
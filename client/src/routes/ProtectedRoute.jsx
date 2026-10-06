import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/ui';

/**
 * ProtectedRoute — Slice D
 *
 * Protects routes that require authentication.
 *
 * Default:
 *   Any authenticated user may access the route.
 *
 * requireStaff:
 *   Only authenticated staff users may access the route.
 */
export default function ProtectedRoute({
  children,
  requireStaff = false,
}) {
  const {
    authLoading,
    isAuthenticated,
    isStaff,
  } = useAuth();

  const location = useLocation();

  // Wait until AuthContext has restored authentication state.
  if (authLoading) {
    return (
      <LoadingSpinner
        fullPage
        label="Checking authentication..."
      />
    );
  }

  // Guest -> login page.
  // Save the attempted location so LoginPage can return them there later.
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Customer trying to access a staff-only route.
  if (requireStaff && !isStaff) {
    return <Navigate to="/" replace />;
  }

  return children;
}
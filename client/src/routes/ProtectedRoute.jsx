
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
 *
 * requireCustomer:
 *   Staff are redirected to /staff. For customer-owned records.
 *
 * requireAdmin:
 *   Only authenticated staff users with the admin role
 *   may access the route.
 */
export default function ProtectedRoute({
  children,
  requireStaff = false,
  requireAdmin = false,
  requireCustomer = false,
}) {
  const {
    user,
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

  // Staff have no profile, address book or order history: those are
  // customer records. Send them to their own dashboard.
  if (requireCustomer && isStaff) {
    return <Navigate to="/staff" replace />;
  }

  // Only staff administrators may access admin-only routes.
  if (
    requireAdmin &&
    (user?.userType !== 'staff' || user?.role !== 'admin')
  ) {
    return <Navigate to="/staff" replace />;
  }

  return children;
}

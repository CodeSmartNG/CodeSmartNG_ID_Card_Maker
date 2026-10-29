import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Requires an authenticated user with one of the given roles.
 * Assumes it's nested inside <ProtectedRoute /> (auth already checked).
 */
export default function RoleRoute({ roles = [], fallback = '/dashboard' }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (roles.length && !roles.includes(user.role)) {
    return <Navigate to={fallback} replace />;
  }
  return <Outlet />;
}

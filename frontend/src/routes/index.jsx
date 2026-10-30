// frontend/src/routes/index.jsx
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuth } from '../hooks/useAuth';

// Load pages
const Home = lazy(() => import('../pages/Home'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Protect dashboard routes
function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

const wrap = (el) => (
  <Suspense fallback={<div style={{ padding: '2rem' }}>Loading...</div>}>
    {el}
  </Suspense>
);

export const router = createBrowserRouter([
  { path: '/', element: wrap(<Home />) },
  { path: '/login', element: wrap(<Login />) },
  { path: '/register', element: wrap(<Register />) },
  { 
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard', element: wrap(<Dashboard />) },
    ]
  },
  { path: '*', element: wrap(<NotFound />) },
]);

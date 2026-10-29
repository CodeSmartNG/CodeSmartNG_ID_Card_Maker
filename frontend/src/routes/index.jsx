// frontend/src/routes/index.jsx
import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Lazy load pages (Vite will only load them when visited)
const Home = lazy(() => import('../pages/Home'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Members = lazy(() => import('../pages/Members'));
const CardDesigner = lazy(() => import('../pages/CardDesigner'));
const CardHistory = lazy(() => import('../pages/CardHistory'));
const NotFound = lazy(() => import('../pages/NotFound'));

// ProtectedRoute component inline
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

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
      { path: '/members', element: wrap(<Members />) },
      { path: '/cards/new', element: wrap(<CardDesigner />) },
      { path: '/cards/history', element: wrap(<CardHistory />) },
    ]
  },
  { path: '*', element: wrap(<NotFound />) },
]);

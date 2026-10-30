// frontend/src/routes/index.jsx
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuth } from '../hooks/useAuth';

// Exactly matches the 10 files in your pages folder
const Home = lazy(() => import('../pages/Home'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Members = lazy(() => import('../pages/Members'));
const AddMember = lazy(() => import('../pages/AddMember'));
const EditMember = lazy(() => import('../pages/EditMember'));
const CardDesigner = lazy(() => import('../pages/CardDesigner'));
const PaymentSuccess = lazy(() => import('../pages/PaymentSuccess')); // Capital P!
const NotFound = lazy(() => import('../pages/NotFound'));

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
  { path: '/payment/success', element: wrap(<PaymentSuccess />) },
  { 
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard', element: wrap(<Dashboard />) },
      { path: '/members', element: wrap(<Members />) },
      { path: '/members/new', element: wrap(<AddMember />) },
      { path: '/members/:id/edit', element: wrap(<EditMember />) },
      { path: '/cards/new', element: wrap(<CardDesigner />) },
    ]
  },
  { path: '*', element: wrap(<NotFound />) },
]);

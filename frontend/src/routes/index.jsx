// frontend/src/routes/index.jsx
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuth } from '../hooks/useAuth';

/* =========================================================
   1. LAZY LOAD PAGES
   ========================================================= */

import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuth } from '../hooks/useAuth';

const Home = lazy(() => import('../pages/Home'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Members = lazy(() => import('../pages/Members'));
const AddMember = lazy(() => import('../pages/AddMember'));
const EditMember = lazy(() => import('../pages/EditMember'));
const CardDesigner = lazy(() => import('../pages/CardDesigner'));
const CardPayment = lazy(() => import('../pages/CardPayment'));
const PaymentSuccess = lazy(() => import('../pages/PaymentSuccess'));
const CardHistory = lazy(() => import('../pages/CardHistory'));
const VerifyCard = lazy(() => import('../pages/VerifyCard')); // 👈 MAKE SURE THIS IS HERE
const NotFound = lazy(() => import('../pages/NotFound'));


/* =========================================================
   2. PROTECTED ROUTE WRAPPER
   ========================================================= */
function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

/* =========================================================
   3. SUSPENSE WRAPPER
   ========================================================= */
const wrap = (el) => (
  <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
    {el}
  </Suspense>
);

/* =========================================================
   4. ROUTER CONFIGURATION
   ========================================================= */
export const router = createBrowserRouter([
  /* --- PUBLIC ROUTES --- */
  { path: '/', element: wrap(<Home />) },
  { path: '/login', element: wrap(<Login />) },
  { path: '/register', element: wrap(<Register />) },
  { path: '/payment/success', element: wrap(<PaymentSuccess />) },

  /* --- PROTECTED ROUTES (Require Login) --- */
  { 
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard', element: wrap(<Dashboard />) },
      { path: '/members', element: wrap(<Members />) },
      { path: '/members/new', element: wrap(<AddMember />) },
      { path: '/members/:id/edit', element: wrap(<EditMember />) },
      { path: '/cards/new', element: wrap(<CardDesigner />) },
      { path: '/cards/pay/:cardId', element: wrap(<CardPayment />) },
      { path: '/cards/history', element: wrap(<CardHistory />) },
       { path: '/verify/:id', element: wrap(<VerifyCard />) },
    ]
  },

  /* --- 404 FALLBACK --- */
  { path: '*', element: wrap(<NotFound />) },
]);

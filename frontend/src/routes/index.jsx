// frontend/src/routes/index.jsx
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuth } from '../hooks/useAuth';
import DashboardLayout from '../components/layout/DashboardLayout'; // 👈 Import the new Layout

/* =========================================================
   1. LAZY LOAD PAGES
   ========================================================= */

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
const VerifyCard = lazy(() => import('../pages/VerifyCard')); 
const NotFound = lazy(() => import('../pages/NotFound'));
const OrganizationProfile = lazy(() => import('../pages/OrganizationProfile'));
const Staff = lazy(() => import('../pages/Staff'));


/* =========================================================
   2. PROTECTED ROUTE WRAPPER
   ========================================================= */
function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-sans">Loading...</div>;
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
  <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-sans text-slate-500">Loading...</div>}>
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
  
  // 👈 Moved VerifyCard here so security guards can scan cards without logging in
  { path: '/verify/:id', element: wrap(<VerifyCard />) }, 

  /* --- PROTECTED ROUTES (Require Login & Use Dashboard Layout) --- */
  { 
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />, // 👈 This wraps all pages below with the Sidebar/Bottom Nav
        children: [
          { path: '/dashboard', element: wrap(<Dashboard />) },
          { path: '/members', element: wrap(<Members />) },
          { path: '/members/new', element: wrap(<AddMember />) },
          { path: '/members/:id/edit', element: wrap(<EditMember />) },
          { path: '/cards/new', element: wrap(<CardDesigner />) },
          { path: '/cards/pay/:cardId', element: wrap(<CardPayment />) },
          { path: '/cards/history', element: wrap(<CardHistory />) },
          { path: '/organization', element: wrap(<OrganizationProfile />) },
          { path: '/staff', element: wrap(<Staff />) },
        ]
      }
    ]
  },

  /* --- 404 FALLBACK --- */
  { path: '*', element: wrap(<NotFound />) },
]);

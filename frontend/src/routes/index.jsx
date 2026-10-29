import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import RoleRoute from '../components/layout/RoleRoute';
import Spinner from '../components/ui/Spinner';
import ErrorBoundary from '../components/ErrorBoundary';

/* =========================================================
   LAZY PAGES
   ========================================================= */

// Public
const Home = lazy(() => import('../pages/Home'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const VerifyCard = lazy(() => import('../pages/VerifyCard'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Authed — general
const Dashboard = lazy(() => import('../pages/Dashboard'));
const OrganizationProfile = lazy(() => import('../pages/OrganizationProfile'));
const Members = lazy(() => import('../pages/Members'));
const AddMember = lazy(() => import('../pages/AddMember'));
const EditMember = lazy(() => import('../pages/EditMember'));
const CardDesigner = lazy(() => import('../pages/CardDesigner'));
const CardPayment = lazy(() => import('../pages/CardPayment'));
const PaymentSuccess = lazy(() => import('../pages/PaymentSuccess'));
const CardHistory = lazy(() => import('../pages/CardHistory'));

/* =========================================================
   HELPERS
   ========================================================= */

// Wrap lazy component in Suspense + ErrorBoundary
const wrap = (el) => (
  <ErrorBoundary>
    <Suspense fallback={<Spinner fullScreen />}>{el}</Suspense>
  </ErrorBoundary>
);

/* =========================================================
   ROUTER
   ========================================================= */

export const router = createBrowserRouter([
  /* ───────────── PUBLIC ───────────── */
  { path: '/', element: wrap(<Home />), errorElement: wrap(<NotFound />) },
  { path: '/login', element: wrap(<Login />) },
  { path: '/register', element: wrap(<Register />) },
  { path: '/verify/:id', element: wrap(<VerifyCard />) },

  /* ───────────── PROTECTED (auth required) ───────────── */
  {
    element: <ProtectedRoute />,
    errorElement: wrap(<NotFound />),
    children: [
      // Redirect authenticated users from /app → /dashboard (optional convenience)
      { path: '/app', element: <Navigate to="/dashboard" replace /> },

      // Dashboard & profile
      { path: '/dashboard', element: wrap(<Dashboard />) },
      { path: '/organization', element: wrap(<OrganizationProfile />) },

      // Members
      { path: '/members', element: wrap(<Members />) },
      { path: '/members/new', element: wrap(<AddMember />) },
      { path: '/members/:id/edit', element: wrap(<EditMember />) },

      // Cards
      { path: '/cards/new', element: wrap(<CardDesigner />) },
      { path: '/cards/pay/:cardId', element: wrap(<CardPayment />) },
      { path: '/cards/history', element: wrap(<CardHistory />) },

      // Payment result page (Paystack callback lands here)
      { path: '/payment/success', element: wrap(<PaymentSuccess />) },

      // Admin-only examples (uncomment once RoleRoute exists)
      // {
      //   element: <RoleRoute roles={['ADMIN']} />,
      //   children: [
      //     { path: '/admin/settings', element: wrap(<AdminSettings />) },
      //   ],
      // },
    ],
  },

  /* ───────────── 404 ───────────── */
  { path: '*', element: wrap(<NotFound />) },
]);

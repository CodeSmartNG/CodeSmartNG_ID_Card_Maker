import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import Spinner from '../components/ui/Spinner';

const Home = lazy(() => import('../pages/Home'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Members = lazy(() => import('../pages/Members'));
const AddMember = lazy(() => import('../pages/AddMember'));
const CardDesigner = lazy(() => import('../pages/CardDesigner'));
const CardPayment = lazy(() => import('../pages/CardPayment'));
const VerifyCard = lazy(() => import('../pages/VerifyCard'));
const CardHistory = lazy(() => import('../pages/CardHistory'));

const wrap = (el) => <Suspense fallback={<Spinner />}>{el}</Suspense>;

export const router = createBrowserRouter([
  { path: '/', element: wrap(<Home />) },
  { path: '/login', element: wrap(<Login />) },
  { path: '/register', element: wrap(<Register />) },
  { path: '/verify/:id', element: wrap(<VerifyCard />) },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard', element: wrap(<Dashboard />) },
      { path: '/members', element: wrap(<Members />) },
      { path: '/members/new', element: wrap(<AddMember />) },
      { path: '/cards/new', element: wrap(<CardDesigner />) },
      { path: '/cards/pay/:cardId', element: wrap(<CardPayment />) },
      { path: '/cards/history', element: wrap(<CardHistory />) },
    ],
  },
]);

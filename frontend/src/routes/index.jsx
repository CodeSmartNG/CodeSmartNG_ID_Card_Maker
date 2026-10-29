// frontend/src/routes/index.jsx
import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const Home = lazy(() => import('../pages/Home'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const NotFound = lazy(() => import('../pages/NotFound'));

const wrap = (el) => (
  <Suspense fallback={<div style={{ padding: '2rem' }}>Loading...</div>}>
    {el}
  </Suspense>
);

export const router = createBrowserRouter([
  { path: '/', element: wrap(<Home />) },
  { path: '/login', element: wrap(<Login />) },
  { path: '/register', element: wrap(<Register />) },
  { path: '*', element: wrap(<NotFound />) },
]);

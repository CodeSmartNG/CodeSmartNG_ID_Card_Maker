// frontend/src/routes/index.jsx
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '*',
    element: (
      <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🚀 Frontend is Live!</h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Vercel build passed successfully.</p>
        <p style={{ color: '#94a3b8', marginTop: '1rem' }}>Next step: Deploy the backend.</p>
      </div>
    ),
  },
]);

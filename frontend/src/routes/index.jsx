// frontend/src/routes/index.jsx
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1>🚀 Frontend is Live!</h1>
        <p>Connected to: {import.meta.env.VITE_API_URL}</p>
        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f0f0', borderRadius: '8px' }}>
          <h2>Backend Test</h2>
          <button 
            onClick={() => {
              fetch(`${import.meta.env.VITE_API_URL}/health`)
                .then(r => r.json())
                .then(d => alert('Backend says: ' + JSON.stringify(d)))
                .catch(e => alert('Error: ' + e.message));
            }}
            style={{ padding: '10px 20px', cursor: 'pointer' }}
          >
            Test Backend Connection
          </button>
        </div>
      </div>
    ),
  },
]);

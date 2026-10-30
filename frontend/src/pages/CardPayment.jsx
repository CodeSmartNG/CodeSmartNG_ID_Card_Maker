import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function CardPayment() {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initPayment = async () => {
      try {
        console.log("Initializing payment for card:", cardId);
        const { data } = await api.post('/payments/initialize', { cardId });
        
        if (data.authorizationUrl) {
          window.location.href = data.authorizationUrl;
        } else {
          setError('No payment link returned from the server.');
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to initialize payment. Check Render logs.');
        setLoading(false);
      }
    };

    if (cardId) {
      initPayment();
    }
  }, [cardId]);

  if (error) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h2 style={{ color: 'red' }}>Payment Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => navigate('/dashboard')} 
          style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer', background: '#333', color: '#fff', border: 'none', borderRadius: '4px' }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2>Redirecting to Paystack...</h2>
      <p>Please do not close this page.</p>
      <div style={{ marginTop: '2rem' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

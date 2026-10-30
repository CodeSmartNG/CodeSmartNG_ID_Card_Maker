import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../hooks/useToast';

export default function CardPayment() {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initPayment = async () => {
      try {
        // Call backend to initialize payment
        const { data } = await api.post('/payments/initialize', { cardId });
        
        // Redirect to Paystack Checkout
        if (data.authorizationUrl) {
          window.location.href = data.authorizationUrl;
        } else {
          toast.error('Failed to get payment link');
          navigate('/dashboard');
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to initialize payment');
        navigate('/dashboard');
      }
    };

    initPayment();
  }, [cardId, navigate, toast]);

  return (
    <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2>Redirecting to Payment Gateway...</h2>
      <p style={{ color: '#666' }}>Please do not close this page.</p>
      <div style={{ marginTop: '2rem' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

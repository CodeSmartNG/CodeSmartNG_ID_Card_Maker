// frontend/src/pages/PaymentSuccess.jsx
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const reference = params.get('ref');
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    if (!reference) return setState({ status: 'error', message: 'Missing reference' });

    api
      .get(`/payments/verify/${reference}`)
      .then(({ data }) => setState({ status: data.status, data }))
      .catch((err) =>
        setState({
          status: 'error',
          message: err.response?.data?.message || 'Verification failed',
        })
      );
  }, [reference]);

  if (state.status === 'loading') return <p>Verifying payment…</p>;
  if (state.status === 'error') return <p>⚠️ {state.message}</p>;

  return (
    <div>
      <h1>✅ Payment successful</h1>
      <p>Reference: {state.data.reference}</p>
      <p>Your card is being generated. You'll receive an email shortly.</p>
      <Link to="/cards/history">View my cards</Link>
    </div>
  );
}

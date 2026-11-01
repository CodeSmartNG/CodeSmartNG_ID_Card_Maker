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
          // Redirect to Paystack checkout
          window.location.href = data.authorizationUrl;
        } else {
          setError('No payment link returned from the server.');
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to initialize payment. Please try again.');
        setLoading(false);
      }
    };

    if (cardId) {
      initPayment();
    }
  }, [cardId]);

  /* ── Error State ── */
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 sm:p-6 font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border-t-8 border-red-500 text-center p-8 animate-slide-up">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Payment Initialization Failed</h1>
          <p className="text-slate-500 mb-8">{error}</p>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="w-full px-6 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-sm"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ── Loading / Redirecting State ── */
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/50 p-4 sm:p-6 font-sans">
      
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] p-8 sm:p-12 text-center relative overflow-hidden animate-slide-up">
        
        {/* Decorative background blobs */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-100 rounded-full blur-3xl opacity-50"></div>

        {/* Loading Spinner Container */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          {/* Outer pulsing ring */}
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full animate-ping opacity-20"></div>
          {/* Spinning ring */}
          <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
          {/* Center Icon */}
          <div className="absolute inset-2 bg-indigo-50 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-indigo-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
        </div>

        {/* Text Content */}
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">Connecting to Paystack</h2>
        <p className="text-slate-500 text-sm">
          Please wait while we secure your checkout session. Do not close or refresh this page.
        </p>

        {/* Trust Badges */}
        <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            256-bit SSL Encrypted
          </div>
          <div className="text-[10px] text-slate-400 font-medium">
            Powered securely by <span className="text-slate-600 font-bold">Paystack</span>
          </div>
        </div>

      </div>
    </div>
  );
}

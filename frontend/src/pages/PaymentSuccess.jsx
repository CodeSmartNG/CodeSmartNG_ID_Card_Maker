import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const reference = params.get('ref');
  const [state, setState] = useState({ status: 'loading', data: null, message: null });

  useEffect(() => {
    if (!reference) {
      setState({ status: 'error', message: 'No payment reference provided.', data: null });
      return;
    }

    api.get(`/payments/verify/${reference}`)
      .then(({ data }) => setState({ status: 'success', data, message: null }))
      .catch((err) => {
        setState({
          status: 'error',
          data: null,
          message: err.response?.data?.message || 'We could not verify this payment.',
        });
      });
  }, [reference]);

  /* ── Loading State ── */
  if (state.status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 font-sans">
        <div className="relative flex items-center justify-center w-20 h-20 mb-6">
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
          <svg className="w-8 h-8 text-indigo-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Verifying Payment</h2>
        <p className="text-slate-500">Please do not close this page...</p>
      </div>
    );
  }

  /* ── Error State ── */
  if (state.status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 sm:p-6 font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border-t-8 border-red-500 text-center p-8 animate-slide-up">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Payment Issue</h1>
          <p className="text-slate-500 mb-8">{state.message}</p>
          <Link to="/cards/history" className="inline-block w-full px-6 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  /* ── Success State ── */
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 sm:p-6 font-sans overflow-hidden relative">
      
      {/* Background Confetti (Pure CSS) */}
      <div className="absolute top-10 left-10 w-3 h-3 bg-emerald-400 rounded-full opacity-50 animate-bounce"></div>
      <div className="absolute top-20 right-20 w-4 h-4 bg-indigo-400 rounded-sm rotate-45 opacity-50 animate-pulse"></div>
      <div className="absolute bottom-20 left-1/4 w-2 h-2 bg-amber-400 rounded-full opacity-50 animate-ping"></div>

      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden relative z-10 animate-slide-up">
        
        {/* Glowing Green Header */}
        <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-10 text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-emerald-300/30 rounded-full blur-xl"></div>
          
          <div className="relative z-10 flex justify-center mb-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md shadow-inner ring-4 ring-white/20">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white relative z-10 tracking-tight">Payment Successful!</h1>
          <p className="text-emerald-50 mt-1 relative z-10 font-medium">Your ID card is ready.</p>
        </div>

        {/* Receipt Body */}
        <div className="p-6 sm:p-8">
          
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 shadow-inner space-y-4 mb-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reference</span>
              <span className="text-sm font-bold text-slate-900 font-mono">{state.data?.reference}</span>
            </div>
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-700 uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {state.data?.status}
              </span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Card Status</span>
              <span className="text-sm font-bold text-indigo-600">{state.data?.cardStatus || 'PAID'}</span>
            </div>
          </div>

          <div className="text-center mb-6">
            <p className="text-sm text-slate-500">
              We have successfully received your payment. Your ID card PDF has been generated and is ready for download.
            </p>
          </div>

          <Link 
            to="/cards/history" 
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 hover:shadow-lg transition-all"
          >
            View & Download Card
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </Link>
          
          <div className="text-center mt-4">
            <Link to="/dashboard" className="text-sm font-semibold text-slate-400 hover:text-slate-600 transition">
              Return to Dashboard
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 py-4 px-6 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
            Secure Checkout by Paystack
          </p>
        </div>

      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import api from '../services/api';
import { formatNaira, formatDate } from '../utils/formatters';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

export default function CardHistory() {
  const { user } = useAuth();
  const toast = useToast();
  
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);
  
  // 👇 Refund States
  const [refundPaymentObj, setRefundPaymentObj] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refunding, setRefunding] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = () => {
    setLoading(true);
    api.get('/payments?limit=50')
      .then(({ data }) => setPayments(data.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleGeneratePdf = async (paymentId) => {
    setGenerating(paymentId);
    try {
      await api.post(`/payments/${paymentId}/retry-generation`);
      fetchPayments();
      toast.success('PDF generated successfully!');
    } catch (err) {
      toast.error('Failed to generate PDF: ' + (err.response?.data?.message || err.message));
    } finally {
      setGenerating(null);
    }
  };

  // 👇 Refund Handler
  const handleRefund = async (e) => {
    e.preventDefault();
    setRefunding(true);
    try {
      // Convert Naira to Kobo for Paystack
      const amountInKobo = refundAmount ? Math.round(Number(refundAmount) * 100) : null;
      
      await api.post(`/payments/${refundPaymentObj.id}/refund`, {
        amount: amountInKobo,
        reason: refundReason,
      });

      toast.success('Refund processed successfully!');
      setRefundPaymentObj(null); // Close modal
      setRefundAmount('');
      setRefundReason('');
      fetchPayments(); // Refresh list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Refund failed');
    } finally {
      setRefunding(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'success': return 'bg-emerald-100 text-emerald-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      case 'partial_refund': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 font-medium animate-pulse">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Card History</h1>
          <p className="text-slate-500 mt-1">View all your ID card payments and downloads.</p>
        </div>
        <Link to="/cards/new" className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition shadow-sm">
          + New ID Card
        </Link>
      </div>

      {payments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center flex flex-col items-center justify-center">
          <div className="text-5xl mb-4">📜</div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No cards yet</h3>
          <p className="text-slate-500 mb-6">You haven't ordered any ID cards.</p>
        </div>
      ) : (
        <>
          {/* ── Mobile View ── */}
          <div className="md:hidden flex flex-col gap-4">
            {payments.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-slate-900 text-base">
                      {p.card?.member?.firstName} {p.card?.member?.lastName}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{p.reference}</div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusStyle(p.status)}`}>
                    {p.status}
                  </span>
                </div>

                <div className="flex justify-between items-end border-t border-slate-100 pt-3">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Amount</div>
                    <div className="text-lg font-extrabold text-slate-900">{formatNaira(p.amount)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Date</div>
                    <div className="text-xs text-slate-600 font-medium">{formatDate(p.createdAt)}</div>
                  </div>
                </div>

                <div className="pt-1 flex flex-col gap-2">
                  {p.card?.pdfUrl ? (
                    <a href={p.card.pdfUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-bold transition">
                      Download PDF
                    </a>
                  ) : (
                    <button onClick={() => handleGeneratePdf(p.id)} disabled={generating === p.id} className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-sm font-bold transition disabled:opacity-50">
                      {generating === p.id ? 'Generating...' : 'Generate PDF'}
                    </button>
                  )}
                  
                  {/* Refund Button (Mobile) */}
                  {p.status === 'SUCCESS' && user?.role === 'ADMIN' && (
                    <button onClick={() => setRefundPaymentObj(p)} className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-bold transition">
                      Issue Refund
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop View ── */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Member</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{formatDate(p.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900">{p.card?.member?.firstName} {p.card?.member?.lastName}</div>
                        <div className="text-xs text-slate-500 font-mono">{p.reference}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{formatNaira(p.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusStyle(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-3">
                          {p.card?.pdfUrl && (
                            <a href={p.card.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-800 font-bold transition">Download ⬇️</a>
                          )}
                          <button onClick={() => handleGeneratePdf(p.id)} disabled={generating === p.id} className="text-amber-600 hover:text-amber-800 font-bold disabled:opacity-50 transition">
                            {generating === p.id ? 'Generating...' : (p.card?.pdfUrl ? 'Regenerate 🔄' : 'Generate PDF 🔄')}
                          </button>
                          
                          {/* Refund Button (Desktop) */}
                          {p.status === 'SUCCESS' && user?.role === 'ADMIN' && (
                            <button onClick={() => setRefundPaymentObj(p)} className="text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition">
                              Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── REFUND MODAL ── */}
      {refundPaymentObj && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Issue Refund</h3>
              <button onClick={() => setRefundPaymentObj(null)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleRefund} className="p-6">
              <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Refunding payment for</p>
                <p className="font-bold text-slate-900">{refundPaymentObj.card?.member?.firstName} {refundPaymentObj.card?.member?.lastName}</p>
                <p className="text-sm text-slate-600 mt-2">Total Paid: <strong className="text-slate-900">{formatNaira(refundPaymentObj.amount)}</strong></p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Amount to Refund (₦)</label>
                <input 
                  type="number" 
                  step="0.01"
                  max={(refundPaymentObj.amount / 100)}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder={`Leave blank for full refund (${formatNaira(refundPaymentObj.amount)})`}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
                <p className="text-xs text-slate-400 mt-1">If left blank, a full refund of {formatNaira(refundPaymentObj.amount)} will be issued, and the card will be revoked.</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason (Optional)</label>
                <input 
                  type="text" 
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Customer request, Duplicate payment"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setRefundPaymentObj(null)} className="px-5 py-2.5 rounded-lg font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 transition" disabled={refunding}>
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition shadow-sm disabled:opacity-50" disabled={refunding}>
                  {refunding ? 'Processing...' : 'Confirm Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

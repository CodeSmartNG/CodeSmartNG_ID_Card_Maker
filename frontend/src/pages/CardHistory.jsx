import { useState, useEffect } from 'react';
import api from '../services/api';
import { formatNaira, formatDate } from '../utils/formatters';
import { Link } from 'react-router-dom';

export default function CardHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);

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
      alert('PDF generated successfully!');
    } catch (err) {
      alert('Failed to generate PDF: ' + (err.response?.data?.message || err.message));
    } finally {
      setGenerating(null);
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'success': return 'bg-emerald-100 text-emerald-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'failed': return 'bg-red-100 text-red-800';
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
          <Link to="/cards/new" className="px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-100 transition">
            Create your first card
          </Link>
        </div>
      ) : (
        <>
          {/* ── Mobile View (Cards) ── */}
          <div className="md:hidden flex flex-col gap-4">
            {payments.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
                
                {/* Top: Name & Status */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-slate-900 text-base">
                      {p.card?.member?.firstName} {p.card?.member?.lastName}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      {p.reference}
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusStyle(p.status)}`}>
                    {p.status}
                  </span>
                </div>

                {/* Middle: Amount & Date */}
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

                {/* Bottom: Action Button */}
                <div className="pt-1">
                  {p.card?.pdfUrl ? (
                    <a 
                      href={p.card.pdfUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-bold transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      Download PDF
                    </a>
                  ) : (
                    <button 
                      onClick={() => handleGeneratePdf(p.id)}
                      disabled={generating === p.id}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-sm font-bold transition disabled:opacity-50"
                    >
                      {generating === p.id ? 'Generating...' : 'Generate PDF'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop View (Table) ── */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reference</th>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">{p.reference}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{p.card?.member?.firstName} {p.card?.member?.lastName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{formatNaira(p.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusStyle(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {p.card?.pdfUrl ? (
                          <a 
                            href={p.card.pdfUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-800 font-bold transition"
                          >
                            Download ⬇️
                          </a>
                        ) : (
                          <button 
                            onClick={() => handleGeneratePdf(p.id)}
                            disabled={generating === p.id}
                            className="inline-flex items-center gap-1.5 text-amber-600 hover:text-amber-800 font-bold disabled:opacity-50 transition"
                          >
                            {generating === p.id ? 'Generating...' : 'Generate PDF 🔄'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

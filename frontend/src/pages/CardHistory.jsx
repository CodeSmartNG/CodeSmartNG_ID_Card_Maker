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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full font-sans">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Card History</h1>
          <p className="text-slate-500 mt-1">View all your ID card payments and downloads.</p>
        </div>
        <Link to="/cards/new" className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition shadow-sm">
          + New ID Card
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 animate-pulse font-medium">Loading history...</div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="text-5xl mb-4">📜</div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No cards yet</h3>
            <p className="text-slate-500 mb-6">You haven't ordered any ID cards.</p>
            <Link to="/cards/new" className="px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-100 transition">
              Create your first card
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">
                      {p.reference}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                      {p.card?.member?.firstName} {p.card?.member?.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                      {formatNaira(p.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusStyle(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {p.card?.pdfUrl ? (
                        <a 
                          href={p.card.pdfUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-1 transition"
                        >
                          Download ⬇️
                        </a>
                      ) : (
                        <button 
                          onClick={() => handleGeneratePdf(p.id)}
                          disabled={generating === p.id}
                          className="text-amber-600 hover:text-amber-800 font-bold flex items-center gap-1 disabled:opacity-50 transition"
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
        )}
      </div>
    </div>
  );
}

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
      // Refresh the list to get the new pdfUrl
      fetchPayments();
      alert('PDF generated successfully!');
    } catch (err) {
      alert('Failed to generate PDF: ' + (err.response?.data?.message || err.message));
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="page">
      <div className="page__header">
        <h1>Card History</h1>
        <Link to="/cards/new" className="btn btn-primary">+ New ID Card</Link>
      </div>

      <div className="data-card">
        {loading ? (
          <div className="table-loading">Loading…</div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <h3>No cards yet</h3>
            <p>You haven't ordered any ID cards.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Member</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{formatDate(p.createdAt)}</td>
                  <td className="mono">{p.reference}</td>
                  <td>
                    {p.card?.member?.firstName} {p.card?.member?.lastName}
                  </td>
                  <td style={{ fontWeight: 'bold' }}>{formatNaira(p.amount)}</td>
                  <td>
                    <span className={`status-badge status-badge--${p.status.toLowerCase()}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    {p.card?.pdfUrl ? (
                      <a 
                        href={p.card.pdfUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn-text"
                        style={{ color: '#10b981', fontWeight: 'bold' }}
                      >
                        Download PDF ⬇️
                      </a>
                    ) : (
                      <button 
                        onClick={() => handleGeneratePdf(p.id)}
                        disabled={generating === p.id}
                        className="btn-text"
                        style={{ color: '#f59e0b', fontWeight: 'bold', cursor: 'pointer', background: 'none', border: 'none' }}
                      >
                        {generating === p.id ? 'Generating...' : 'Generate PDF 🔄'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

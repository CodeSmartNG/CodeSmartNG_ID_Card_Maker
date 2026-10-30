import { useState, useEffect } from 'react';
import api from '../services/api';
import { formatNaira, formatDate } from '../utils/formatters';
import { Link } from 'react-router-dom';

export default function CardHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/payments?limit=50')
      .then(({ data }) => setPayments(data.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Card History</h1>
          <p className="page__subtitle">All your ID card payments and orders</p>
        </div>
        <Link to="/cards/new" className="btn btn-primary">
          + New ID Card
        </Link>
      </div>

      <div className="data-card">
        {loading ? (
          <div className="table-loading">Loading history…</div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📜</div>
            <h3>No cards yet</h3>
            <p>You haven't ordered any ID cards.</p>
            <Link to="/cards/new" className="btn btn-primary">Create your first card</Link>
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
                <th>Action</th> {/* <-- ADDED HEADER */}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="muted">{formatDate(p.createdAt)}</td>
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
                  {/* <-- ADDED ACTION CELL */}
                  <td>
                    {p.card?.pdfUrl ? (
                      <a 
                        href={p.card.pdfUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn-text"
                        style={{ fontWeight: 'bold' }}
                      >
                        Download PDF ⬇️
                      </a>
                    ) : (
                      <span className="muted">Not ready</span>
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

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import api from '../services/api';
import { formatNaira, formatDate } from '../utils/formatters';

function StatCard({ label, value, sub, icon, tone = 'default' }) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__body">
        <div className="stat-card__label">{label}</div>
        <div className="stat-card__value">{value}</div>
        {sub && <div className="stat-card__sub">{sub}</div>}
      </div>
    </div>
  );
}

function EmptyState({ title, message, actionLabel, actionTo }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">📭</div>
      <h3>{title}</h3>
      <p>{message}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn btn-primary">{actionLabel}</Link>
      )}
    </div>
  );
}

function SkeletonCard() { return <div className="stat-card skeleton" />; }

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [memberCount, setMemberCount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, paymentsRes, membersRes] = await Promise.all([
          api.get('/payments/stats'),
          api.get('/payments?limit=5&status=SUCCESS'),
          api.get('/members?limit=1'),
        ]);
        if (cancelled) return;
        setStats(statsRes.data);
        setRecentPayments(paymentsRes.data.data || []);
        setMemberCount(membersRes.data.meta?.total || 0);
      } catch (err) {
        if (cancelled) return;
        const msg = err.response?.data?.message || 'Failed to load dashboard';
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const successCount = stats?.byStatus?.find((s) => s.status === 'SUCCESS')?.count || 0;
  const pendingCount = stats?.byStatus?.find((s) => s.status === 'PENDING')?.count || 0;

  return (
    <div className="dashboard">
      {/* ── Header with History Button ── */}
      <div className="dashboard__header">
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋</h1>
          <p className="dashboard__subtitle">
            Here's what's happening at {user?.organization?.name || 'your organization'}.
          </p>
        </div>
        <div className="dashboard__actions">
          <Link to="/cards/history" className="btn btn-secondary">
            📜 Card History
          </Link>
          <Link to="/members/new" className="btn btn-secondary">
            + Add Member
          </Link>
          <Link to="/cards/new" className="btn btn-primary">
            + New ID Card
          </Link>
        </div>
      </div>

      {error && <div className="form-error-banner">{error}</div>}

      <div className="stats-grid">
        {loading ? (
          <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
        ) : (
          <>
            <StatCard label="Total Revenue" value={formatNaira(stats?.totalRevenue || 0)} sub={`${successCount} payments`} icon="💰" tone="success" />
            <StatCard label="Members" value={memberCount.toLocaleString()} sub="Active records" icon="👥" />
            <StatCard label="Cards Issued" value={successCount.toLocaleString()} sub={`${pendingCount} pending`} icon="🪪" tone="info" />
            <StatCard label="Last 30 Days" value={formatNaira(stats?.last30Days?.revenue || 0)} sub={`${stats?.last30Days?.payments || 0} payments`} icon="📈" />
          </>
        )}
      </div>

      <div className="dashboard__grid">
        <section className="dashboard__panel">
          <div className="panel-header">
            <h2>Recent Payments</h2>
            <Link to="/cards/history" className="panel-link">View all →</Link>
          </div>
          {loading ? (
            <div className="panel-loading">Loading…</div>
          ) : recentPayments.length === 0 ? (
            <EmptyState title="No payments yet" message="Design your first ID card to start receiving payments." actionLabel="Create ID Card" actionTo="/cards/new" />
          ) : (
            <div className="payment-list">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="payment-row">
                  <div className="payment-row__avatar">
                    {payment.card?.member?.firstName?.[0] || '?'}{payment.card?.member?.lastName?.[0] || ''}
                  </div>
                  <div className="payment-row__info">
                    <div className="payment-row__name">{payment.card?.member?.firstName} {payment.card?.member?.lastName}</div>
                    <div className="payment-row__meta">{payment.card?.cardNumber} · {formatDate(payment.createdAt)}</div>
                  </div>
                  <div className="payment-row__amount">{formatNaira(payment.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard__panel">
          <div className="panel-header"><h2>Quick Actions</h2></div>
          <div className="quick-actions">
            <Link to="/cards/history" className="quick-action">
              <span className="quick-action__icon">📜</span>
              <div><div className="quick-action__title">Card History</div><div className="quick-action__desc">View & Download Cards</div></div>
            </Link>
            <Link to="/members" className="quick-action">
              <span className="quick-action__icon">👥</span>
              <div><div className="quick-action__title">Members List</div><div className="quick-action__desc">View all members</div></div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

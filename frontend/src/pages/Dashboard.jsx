import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import api from '../services/api';
import { formatNaira, formatDate } from '../utils/formatters';

/* =========================================================
   SMALL UI COMPONENTS
   ========================================================= */

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
        <Link to={actionTo} className="btn btn-primary">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

function SkeletonCard() {
  return <div className="stat-card skeleton" />;
}

/* =========================================================
   MAIN DASHBOARD
   ========================================================= */

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [memberCount, setMemberCount] = useState(0);
  const [error, setError] = useState(null);

  /* ---------- Fetch everything in parallel ---------- */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [statsRes, paymentsRes, membersRes] = await Promise.all([
          api.get('/payments/stats'),
          api.get('/payments?limit=5&status=SUCCESS'),
          api.get('/members?limit=1'), // just for count
        ]);

        if (cancelled) return;

        setStats(statsRes.data);
        setRecentPayments(paymentsRes.data.data || []);
        setMemberCount(membersRes.data.meta?.total || 0);
      } catch (err) {
        if (cancelled) return;
        const msg = err.response?.data?.message || 'Failed to load dashboard';
        setError(msg);
        toast.error(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  /* ---------- Derived values ---------- */
  const successCount =
    stats?.byStatus?.find((s) => s.status === 'SUCCESS')?.count || 0;
  const pendingCount =
    stats?.byStatus?.find((s) => s.status === 'PENDING')?.count || 0;
  const paidCards = successCount;

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="dashboard">
      {/* ── Header ── */}
      <div className="dashboard__header">
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋</h1>
          <p className="dashboard__subtitle">
            Here's what's happening at {user?.organization?.name || 'your organization'}.
          </p>
        </div>
        <div className="dashboard__actions">
          <Link to="/members/new" className="btn btn-secondary">
            + Add Member
          </Link>
          <Link to="/cards/new" className="btn btn-primary">
            + New ID Card
          </Link>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="form-error-banner" role="alert">
          {error}
        </div>
      )}

      {/* ── Stats row ── */}
      <div className="stats-grid">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard
              label="Total Revenue"
              value={formatNaira(stats?.totalRevenue || 0)}
              sub={`${successCount} payments`}
              icon="💰"
              tone="success"
            />
            <StatCard
              label="Members"
              value={memberCount.toLocaleString()}
              sub="Active records"
              icon="👥"
            />
            <StatCard
              label="Cards Issued"
              value={paidCards.toLocaleString()}
              sub={`${pendingCount} pending payment${pendingCount === 1 ? '' : 's'}`}
              icon="🪪"
              tone="info"
            />
            <StatCard
              label="Last 30 Days"
              value={formatNaira(stats?.last30Days?.revenue || 0)}
              sub={`${stats?.last30Days?.payments || 0} payments`}
              icon="📈"
            />
          </>
        )}
      </div>

      {/* ── Two-column layout ── */}
      <div className="dashboard__grid">
        {/* Left: Recent Payments */}
        <section className="dashboard__panel">
          <div className="panel-header">
            <h2>Recent Payments</h2>
            <Link to="/cards/history" className="panel-link">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="panel-loading">Loading…</div>
          ) : recentPayments.length === 0 ? (
            <EmptyState
              title="No payments yet"
              message="Design your first ID card to start receiving payments."
              actionLabel="Create ID Card"
              actionTo="/cards/new"
            />
          ) : (
            <div className="payment-list">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="payment-row">
                  <div className="payment-row__avatar">
                    {payment.card?.member?.firstName?.[0] || '?'}
                    {payment.card?.member?.lastName?.[0] || ''}
                  </div>
                  <div className="payment-row__info">
                    <div className="payment-row__name">
                      {payment.card?.member?.firstName}{' '}
                      {payment.card?.member?.lastName}
                    </div>
                    <div className="payment-row__meta">
                      {payment.card?.cardNumber} · {formatDate(payment.createdAt)}
                    </div>
                  </div>
                  <div className="payment-row__amount">
                    {formatNaira(payment.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right: Quick Actions + Status breakdown */}
        <section className="dashboard__panel">
          <div className="panel-header">
            <h2>Quick Actions</h2>
          </div>

          <div className="quick-actions">
            <Link to="/members/new" className="quick-action">
              <span className="quick-action__icon">👤</span>
              <div>
                <div className="quick-action__title">Add Member</div>
                <div className="quick-action__desc">Register a new person</div>
              </div>
            </Link>

            <Link to="/cards/new" className="quick-action">
              <span className="quick-action__icon">🎨</span>
              <div>
                <div className="quick-action__title">Design Card</div>
                <div className="quick-action__desc">Pick template & preview</div>
              </div>
            </Link>

            <Link to="/organization" className="quick-action">
              <span className="quick-action__icon">🏢</span>
              <div>
                <div className="quick-action__title">Organization</div>
                <div className="quick-action__desc">Logo, address, contact</div>
              </div>
            </Link>

            <Link to="/cards/history" className="quick-action">
              <span className="quick-action__icon">📜</span>
              <div>
                <div className="quick-action__title">Card History</div>
                <div className="quick-action__desc">All issued cards</div>
              </div>
            </Link>
          </div>

          {/* Status Breakdown */}
          {!loading && stats?.byStatus?.length > 0 && (
            <div className="status-breakdown">
              <h3>Payment Status</h3>
              {stats.byStatus.map((s) => (
                <div key={s.status} className="status-row">
                  <span className={`status-dot status-dot--${s.status.toLowerCase()}`} />
                  <span className="status-row__label">
                    {s.status.replace('_', ' ')}
                  </span>
                  <span className="status-row__count">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

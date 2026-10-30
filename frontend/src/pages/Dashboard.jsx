import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { formatNaira, formatDate } from '../utils/formatters';

/* ── UI Components ── */

function StatCard({ label, value, sub, icon, tone = 'default' }) {
  // Map tones to Tailwind background/text colors
  const toneStyles = {
    success: 'bg-emerald-50 text-emerald-600',
    info: 'bg-blue-50 text-blue-600',
    default: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${toneStyles[tone] || toneStyles.default}`}>
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium text-slate-500 mb-1">{label}</div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

function EmptyState({ title, message, actionLabel, actionTo }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-5xl mb-4">📭</div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-slate-500 text-sm max-w-xs mb-6">{message}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

function SkeletonCard() {
  return <div className="bg-slate-100 animate-pulse h-28 rounded-2xl w-full"></div>;
}

/* ── Main Dashboard ── */

export default function Dashboard() {
  const { user } = useAuth();
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
        setError(err.response?.data?.message || 'Failed to load dashboard');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full font-sans">
      
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-slate-500 mt-1">
            Here's what's happening at {user?.organization?.name || 'your organization'}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/cards/history" className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition shadow-sm flex items-center gap-2">
            📜 History
          </Link>
          <Link to="/members/new" className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition shadow-sm flex items-center gap-2">
            + Member
          </Link>
          <Link to="/cards/new" className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition shadow-sm flex items-center gap-2">
            + New ID Card
          </Link>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-8 text-sm">
          {error}
        </div>
      )}

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Recent Payments (Takes up 2 columns) */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900">Recent Payments</h2>
            <Link to="/cards/history" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition">
              View all →
            </Link>
          </div>
          
          {loading ? (
            <div className="text-center py-8 text-slate-400 animate-pulse">Loading payments...</div>
          ) : recentPayments.length === 0 ? (
            <EmptyState title="No payments yet" message="Design your first ID card to start receiving payments." actionLabel="Create ID Card" actionTo="/cards/new" />
          ) : (
            <div className="flex flex-col gap-2">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {payment.card?.member?.firstName?.[0] || '?'}{payment.card?.member?.lastName?.[0] || ''}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">
                      {payment.card?.member?.firstName} {payment.card?.member?.lastName}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      {payment.card?.cardNumber} · {formatDate(payment.createdAt)}
                    </div>
                  </div>
                  <div className="text-sm font-extrabold text-emerald-600 flex-shrink-0">
                    {formatNaira(payment.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right: Quick Actions (Takes up 1 column) */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Quick Actions</h2>
          
          <div className="flex flex-col gap-3">
            <Link to="/cards/history" className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group">
              <span className="text-2xl w-10 h-10 bg-slate-50 group-hover:bg-white rounded-lg flex items-center justify-center transition-colors">📜</span>
              <div>
                <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">Card History</div>
                <div className="text-xs text-slate-500 mt-0.5">View & Download Cards</div>
              </div>
            </Link>

            <Link to="/members" className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group">
              <span className="text-2xl w-10 h-10 bg-slate-50 group-hover:bg-white rounded-lg flex items-center justify-center transition-colors">👥</span>
              <div>
                <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">Members List</div>
                <div className="text-xs text-slate-500 mt-0.5">View all registered members</div>
              </div>
            </Link>

            <Link to="/organization" className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group">
              <span className="text-2xl w-10 h-10 bg-slate-50 group-hover:bg-white rounded-lg flex items-center justify-center transition-colors">🏢</span>
              <div>
                <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">Organization</div>
                <div className="text-xs text-slate-500 mt-0.5">Update logo & details</div>
              </div>
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}

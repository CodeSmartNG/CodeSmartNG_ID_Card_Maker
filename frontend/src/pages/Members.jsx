import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { memberService } from '../services/memberService';
import { formatDate, initials } from '../utils/formatters';

export default function Members() {
  const navigate = useNavigate();
  const toast = useToast();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  const load = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const { data } = await memberService.list({
          page,
          limit: 20,
          ...(search && { search }),
        });
        setMembers(data.data || []);
        setMeta(data.meta || { page: 1, limit: 20, total: 0, pages: 1 });
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load members');
      } finally {
        setLoading(false);
      }
    },
    [search, toast]
  );

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => load(1), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this member? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await memberService.delete(id);
      toast.success('Member deleted');
      load(meta.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Members</h1>
          <p className="page__subtitle">{meta.total} total members</p>
        </div>
        <Link to="/members/new" className="btn btn-primary">
          + Add Member
        </Link>
      </div>

      {/* Search */}
      <div className="page__toolbar">
        <input
          type="search"
          className="search-input"
          placeholder="Search by name, email, or member number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="data-card">
        {loading ? (
          <div className="table-loading">Loading members…</div>
        ) : members.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">👥</div>
            <h3>{search ? 'No matching members' : 'No members yet'}</h3>
            <p>
              {search
                ? 'Try a different search term.'
                : 'Add your first member to get started.'}
            </p>
            {!search && (
              <Link to="/members/new" className="btn btn-primary">
                Add Member
              </Link>
            )}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Member No.</th>
                <th>Position</th>
                <th>Department</th>
                <th>Added</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="member-cell">
                      {m.photoUrl ? (
                        <img src={m.photoUrl} alt="" className="member-cell__avatar" />
                      ) : (
                        <div className="member-cell__avatar member-cell__avatar--fallback">
                          {initials(m.firstName, m.lastName)}
                        </div>
                      )}
                      <div>
                        <div className="member-cell__name">
                          {m.firstName} {m.lastName}
                        </div>
                        <div className="member-cell__email">{m.email || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="mono">{m.memberNumber}</td>
                  <td>{m.position || '—'}</td>
                  <td>{m.department || '—'}</td>
                  <td className="muted">{formatDate(m.createdAt)}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn-text"
                        onClick={() => navigate(`/members/${m.id}/edit`)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-text-danger"
                        onClick={() => handleDelete(m.id)}
                        disabled={deleting === m.id}
                      >
                        {deleting === m.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!loading && meta.pages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-secondary btn-sm"
              disabled={meta.page <= 1}
              onClick={() => load(meta.page - 1)}
            >
              ← Prev
            </button>
            <span className="pagination__text">
              Page {meta.page} of {meta.pages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={meta.page >= meta.pages}
              onClick={() => load(meta.page + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

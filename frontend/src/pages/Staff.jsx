import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { formatDate, initials } from '../utils/formatters';

export default function Staff() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STAFF' });

  const fetchStaff = () => {
    setLoading(true);
    api.get('/staff')
      .then(({ data }) => setStaff(data.staff || []))
      .catch(() => toast.error('Failed to load staff'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/staff', form);
      toast.success('Staff member added successfully');
      setShowForm(false);
      setForm({ name: '', email: '', password: '', role: 'STAFF' });
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add staff');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await api.delete(`/staff/${id}`);
      toast.success('Staff member removed');
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove staff');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 font-medium animate-pulse">Loading staff...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full font-sans">
      
      {/* Header - Stacks on mobile */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Staff Management</h1>
          <p className="text-slate-500 mt-1">Manage who has access to your organization.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition shadow-sm"
        >
          {showForm ? 'Cancel' : '+ Add Staff'}
        </button>
      </div>

      {/* Add Staff Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8 animate-slide-up">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Add New Staff Member</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
              <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
              <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition" placeholder="staff@school.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Temporary Password</label>
              <input required type="text" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition" placeholder="Min 8 chars" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition">
                <option value="STAFF">Staff (Can manage members & cards)</option>
                <option value="ADMIN">Admin (Full access, can issue refunds)</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex justify-end mt-2">
              <button type="submit" disabled={submitting} className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition">
                {submitting ? 'Adding...' : 'Save Staff Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {staff.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No staff members yet</h3>
            <p className="text-slate-500">Click "+ Add Staff" to invite your first team member.</p>
          </div>
        ) : (
          <>
            {/* ── Mobile View (Cards) ── */}
            <div className="md:hidden divide-y divide-slate-100">
              {staff.map((s) => (
                <div key={s.id} className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {initials(s.name, '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-bold text-slate-900 truncate">{s.name}</div>
                        <div className="text-xs text-slate-500 truncate">{s.email}</div>
                      </div>
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide flex-shrink-0 ${s.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                        {s.role}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <div className="text-[11px] text-slate-400">Added {formatDate(s.createdAt)}</div>
                      {s.id !== currentUser?.id && (
                        <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700 text-xs font-bold transition">
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Desktop View (Table) ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date Added</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staff.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                            {initials(s.name, '')}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{s.name}</div>
                            <div className="text-xs text-slate-500">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${s.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                          {s.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{formatDate(s.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        {s.id !== currentUser?.id && (
                          <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:text-red-800 text-sm font-bold transition">
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

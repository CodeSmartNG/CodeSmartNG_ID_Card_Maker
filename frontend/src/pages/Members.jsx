import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { memberService } from '../services/memberService';
import { formatDate, initials } from '../utils/formatters';

export default function Members() {
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [importing, setImporting] = useState(false);
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

  // 👇 ROBUST CSV Import Logic
  // 👇 ROBUST CSV Import Logic
const handleCsvUpload = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setImporting(true);
  const reader = new FileReader();
  
  reader.onload = async (event) => {
    try {
      const csvText = event.target.result;
      
      // 1. Split by newlines and remove empty lines
      const lines = csvText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      
      if (lines.length < 2) {
        throw new Error('Your CSV file is empty or missing data rows.');
      }

      // 2. Extract and clean headers (removes invisible BOM characters from Excel)
      const headers = lines[0].split(',').map((h) => 
        h.replace(/[\u200B-\u200D\uFEFF]/g, '').trim().toLowerCase().replace(/[^a-z]/g, '')
      );
      
      const parsedData = lines.slice(1).map((line) => {
        // Handle simple quoted CSV values
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',').map(v => v.trim());
        
        const row = {};
        headers.forEach((header, index) => {
          const cleanValue = (values[index] || '').replace(/^"|"$/g, '').trim(); // Strip quotes

          let key = header;
          if (header === 'firstname') key = 'firstName';
          else if (header === 'lastname') key = 'lastName';
          else if (header === 'email' || header === 'emailaddress') key = 'email';
          else if (header === 'phone' || header === 'phonenumber') key = 'phone';
          else if (header === 'position' || header === 'jobtitle') key = 'position';
          else if (header === 'department' || header === 'dept') key = 'department';
          else if (header === 'address') key = 'address';
          else if (header === 'tin') key = 'tin';
          else if (header === 'nin') key = 'nin';

          row[key] = cleanValue;
        });
        return row;
      });

      // 3. Send to backend
      const { data } = await memberService.bulkCreate(parsedData);
      toast.success(`Imported ${data.successCount} members successfully!`);
      
      load(1);
    } catch (err) {
      // Show the EXACT Zod error in the console so we can debug if it fails again
      console.error("CSV Error:", err.response?.data || err);
      toast.error(err.response?.data?.message || err.message || 'Failed to import CSV');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  reader.readAsText(file);
};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Members</h1>
          <p className="text-slate-500 mt-1">{meta.total} total members in your organization</p>
        </div>
        
        {/* Buttons Area */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleCsvUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
          >
            {importing ? 'Importing...' : 'Import CSV'}
          </button>
          <Link 
            to="/members/new" 
            className="flex-1 sm:flex-none px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition shadow-sm flex items-center justify-center gap-2"
          >
            + Add Member
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="search"
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition shadow-sm"
          placeholder="Search by name, email, or member number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 animate-pulse font-medium">Loading members...</div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {search ? 'No matching members' : 'No members yet'}
            </h3>
            <p className="text-slate-500 mb-6 max-w-sm">
              {search 
                ? 'Try adjusting your search terms.' 
                : 'Add your first member or upload a CSV to get started.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Member No.</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Added</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        {m.photoUrl ? (
                          <img src={m.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-white" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white">
                            {initials(m.firstName, m.lastName)}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {m.firstName} {m.lastName}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{m.email || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600">{m.memberNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{m.position || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{m.department || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDate(m.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/members/${m.id}/edit`)}
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 p-2 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          disabled={deleting === m.id}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && meta.pages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
            <button
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              disabled={meta.page <= 1}
              onClick={() => load(meta.page - 1)}
            >
              ← Previous
            </button>
            <span className="text-sm font-medium text-slate-500">
              Page <span className="text-slate-900">{meta.page}</span> of <span className="text-slate-900">{meta.pages}</span>
            </span>
            <button
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
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

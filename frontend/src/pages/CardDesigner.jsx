import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { memberService } from '../services/memberService';
import { cardService } from '../services/cardService';
import TemplateSelector from '../components/card/TemplateSelector';
import IDCardPreview from '../components/card/IDCardPreview';
import { formatNaira } from '../utils/formatters';

export default function CardDesigner() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const { user } = useAuth();

  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState(searchParams.get('memberId') || '');
  const [template, setTemplate] = useState('classic');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    memberService.list({ limit: 100 })
      .then(({ data }) => {
        setMembers(data.data || []);
        if (!selectedMemberId && data.data?.length > 0) {
          setSelectedMemberId(data.data[0].id);
        }
      })
      .catch(() => toast.error('Failed to load members'))
      .finally(() => setLoading(false));
  }, [toast, selectedMemberId]);

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  const handleCreate = async () => {
    if (!selectedMemberId) return toast.error('Please select a member');
    
    setCreating(true);
    try {
      const { data } = await cardService.create({
        memberId: selectedMemberId,
        template,
      });
      navigate(`/cards/pay/${data.card.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create card');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 font-medium animate-pulse">Loading designer...</div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="max-w-lg mx-auto mt-20 bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
        <div className="text-6xl mb-4">👥</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">No members yet</h2>
        <p className="text-slate-500 mb-8">You need to add a member to your organization before you can design an ID card.</p>
        <button 
          onClick={() => navigate('/members/new')}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-sm"
        >
          Add Your First Member
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full font-sans">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Card Designer</h1>
        <p className="text-slate-500 mt-1">Select a member and choose a template to see a live preview.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Controls (Takes up 5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          
          <div className="mb-8">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Select Member
            </label>
            <div className="relative">
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full appearance-none px-4 py-3.5 rounded-xl border border-slate-300 text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition font-medium cursor-pointer"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} ({m.memberNumber})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <TemplateSelector value={template} onChange={setTemplate} />
          
          {/* Price & Action */}
          <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total to pay</div>
              <div className="text-3xl font-extrabold text-slate-900">{formatNaira(100000)}</div>
            </div>
            <button 
              onClick={handleCreate} 
              disabled={creating}
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Processing...
                </>
              ) : (
                'Proceed to Payment'
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Live Preview (Takes up 7 cols) */}
        <div className="lg:col-span-7 bg-slate-100 rounded-3xl border-2 border-dashed border-slate-300 p-8 sm:p-12 flex flex-col items-center justify-center min-h-[500px] sticky top-8">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
            Live Front Preview
          </div>
          
          {selectedMember ? (
            <div className="w-full flex justify-center">
              <IDCardPreview 
                member={selectedMember} 
                organization={user?.organization} 
                template={template} 
              />
            </div>
          ) : (
            <div className="text-slate-400 text-sm">Select a member to see preview</div>
          )}
        </div>

      </div>
    </div>
  );
}

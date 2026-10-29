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

  // Load members on mount
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
      // Create the card draft in the backend
      const { data } = await cardService.create({
        memberId: selectedMemberId,
        template,
      });

      // Navigate to the payment page with the new card ID
      navigate(`/cards/pay/${data.card.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create card');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="page"><div className="table-loading">Loading designer…</div></div>;

  if (members.length === 0) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state__icon">👥</div>
          <h3>No members yet</h3>
          <p>You need to add a member before designing their ID card.</p>
          <button className="btn btn-primary" onClick={() => navigate('/members/new')}>
            Add Member First
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Card Designer</h1>
          <p className="page__subtitle">Design and preview the ID card</p>
        </div>
      </div>

      <div className="designer-layout">
        {/* Left: Form */}
        <div className="designer-panel">
          <div className="form-field">
            <label>Select Member</label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="select-input"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName} ({m.memberNumber})
                </option>
              ))}
            </select>
          </div>

          <TemplateSelector value={template} onChange={setTemplate} />
          
          <div className="price-summary">
            <div>
              <div className="price-summary__label">Total to pay</div>
              <div className="price-summary__amount">{formatNaira(250000)}</div>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={handleCreate} 
              disabled={creating}
            >
              {creating ? 'Processing…' : 'Proceed to Payment'}
            </button>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="designer-preview">
          <div className="preview-label">Front Preview</div>
          {selectedMember && (
            <IDCardPreview 
              member={selectedMember} 
              organization={user?.organization} 
              template={template} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

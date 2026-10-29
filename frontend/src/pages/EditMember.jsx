import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { memberService } from '../services/memberService';
import MemberForm from '../components/members/MemberForm';

export default function EditMember() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    memberService
      .get(id)
      .then(({ data }) => setMember(data.member || data))
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Member not found');
        navigate('/members');
      })
      .finally(() => setLoading(false));
  }, [id, navigate, toast]);

  const handleSubmit = async (payload, photoFile) => {
    setSubmitting(true);
    try {
      await memberService.update(id, payload);

      if (photoFile) {
        try {
          await memberService.uploadPhoto(id, photoFile);
        } catch {
          toast.error('Updated, but photo upload failed');
        }
      }

      toast.success('Member updated');
      navigate('/members');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page"><div className="table-loading">Loading…</div></div>;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Edit Member</h1>
          <p className="page__subtitle">
            {member?.firstName} {member?.lastName} · {member?.memberNumber}
          </p>
        </div>
      </div>

      <div className="data-card data-card--padded">
        <MemberForm
          initialData={member}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitLabel="Save Changes"
          onCancel={() => navigate('/members')}
        />
      </div>
    </div>
  );
}

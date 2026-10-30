
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { memberService } from '../services/memberService';
import MemberForm from '../components/members/MemberForm';

export default function AddMember() {
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (payload, photoFile) => {
    setSubmitting(true);
    try {
      const { data } = await memberService.create(payload);

      // Upload photo separately if provided
      if (photoFile) {
        try {
          await memberService.uploadPhoto(data.member.id, photoFile);
        } catch {
          toast.error('Member created, but photo upload failed');
        }
      }

      toast.success('Member added successfully');
      navigate('/members');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Add Member</h1>
          <p className="page__subtitle">Register a new person in your organization</p>
        </div>
      </div>

      <div className="data-card data-card--padded">
        <MemberForm
          onSubmit={handleSubmit}
          submitting={submitting}
          submitLabel="Create Member"
          onCancel={() => navigate('/members')}
        />
      </div>
    </div>
  );
}

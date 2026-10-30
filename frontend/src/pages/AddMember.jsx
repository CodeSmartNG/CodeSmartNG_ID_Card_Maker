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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full font-sans">
      
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Add Member
          </h1>
          <p className="text-slate-500 mt-1">
            Register a new person in your organization.
          </p>
        </div>
      </div>

      {/* ── Form Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
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
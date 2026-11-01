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

      toast.success('Member updated successfully');
      navigate('/members');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 font-medium animate-pulse">Loading member details...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Edit Member</h1>
          <p className="text-slate-500 mt-1">
            Updating <span className="font-semibold text-indigo-600">{member?.firstName} {member?.lastName}</span> · <span className="font-mono text-xs">{member?.memberNumber}</span>
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
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

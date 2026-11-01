import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import api from '../services/api';
import ImageUploader from '../components/members/ImageUploader';

export default function OrganizationProfile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  
  const [form, setForm] = useState({
    name: user?.organization?.name || '',
    email: user?.organization?.email || '',
    phone: user?.organization?.phone || '',
    address: user?.organization?.address || '',
    website: user?.organization?.website || '',
  });
  
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = ({ file }) => {
    setLogoFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Update details
      const { data } = await api.put('/organizations/me', form);
      
      // 2. Upload logo if changed
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        await api.post('/organizations/me/logo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // Update context (so the new logo/name shows up everywhere instantly)
      setUser({ ...user, organization: data.organization });
      
      toast.success('Organization updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update organization');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full font-sans">
      
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Organization Profile</h1>
        <p className="text-slate-500 mt-1">Manage your company details and branding.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-10">
          
          {/* Left Column: Logo */}
          <div className="md:col-span-1 flex flex-col items-center md:items-start border-r border-slate-100 pr-0 md:pr-10">
            <label className="block text-sm font-bold text-slate-700 mb-4">Company Logo</label>
            
            <div className="w-40 h-40 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden flex items-center justify-center mb-4">
              {user?.organization?.logoUrl ? (
                <img src={user.organization.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <span className="text-slate-400 font-medium">No Logo</span>
              )}
            </div>

            <div className="w-full">
               <ImageUploader onChange={handleLogoChange} disabled={saving} />
            </div>
            
            <p className="text-xs text-slate-400 mt-2 text-center md:text-left">
              This logo will appear on all your generated ID cards.
            </p>
          </div>

          {/* Right Column: Details */}
          <div className="md:col-span-2 flex flex-col gap-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Organization Name</label>
                <input name="name" value={form.name} onChange={handleChange} disabled={saving} className={inputClass} placeholder="Acme Corporation" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} disabled={saving} className={inputClass} placeholder="admin@company.com" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
                <input name="phone" type="tel" value={form.phone} onChange={handleChange} disabled={saving} className={inputClass} placeholder="+2348012345678" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Website</label>
                <input name="website" type="url" value={form.website} onChange={handleChange} disabled={saving} className={inputClass} placeholder="https://company.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Office Address</label>
              <textarea name="address" value={form.address} onChange={handleChange} disabled={saving} rows="3" className={`${inputClass} resize-none`} placeholder="123 Main Street, Lagos" />
            </div>

            <div className="pt-6 mt-4 border-t border-slate-100 flex justify-end">
              <button 
                type="submit" 
                disabled={saving}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Saving...
                  </>
                ) : 'Save Changes'}
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}

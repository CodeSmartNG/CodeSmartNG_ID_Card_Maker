import { useState, useEffect } from 'react';
import ImageUploader from './ImageUploader';

const EMPTY = { 
  firstName: '', 
  lastName: '', 
  email: '', 
  phone: '', 
  position: '', 
  department: '', 
  address: '', 
  tin: '', 
  nin: '', 
  photo: null, 
  photoPreview: null 
};

export default function MemberForm({ initialData = null, onSubmit, submitting = false, submitLabel = 'Save Member', onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setForm({ 
        ...initialData, 
        address: initialData.address || '',
        tin: initialData.tin || '',
        nin: initialData.nin || '',
        photo: null, 
        photoPreview: initialData.photoUrl || null 
      });
    } else {
      setForm(EMPTY);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: null }));
  };

  const handlePhoto = ({ file, preview }) => {
    setForm((f) => ({ ...f, photo: file, photoPreview: preview }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'Required';
    if (!form.lastName.trim()) errs.lastName = 'Required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    onSubmit({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
      position: form.position?.trim() || undefined,
      department: form.department?.trim() || undefined,
      address: form.address?.trim() || undefined,
      tin: form.tin?.trim() || undefined,
      nin: form.nin?.trim() || undefined,
    }, form.photo);
  };

  const inputClass = (hasError) => `w-full px-4 py-2.5 rounded-lg border text-slate-900 focus:ring-2 outline-none transition ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-indigo-500'}`;

  return (
    <form className="w-full" onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Photo */}
        <div className="md:col-span-1">
          <label className="block text-sm font-semibold text-slate-700 mb-3">Member Photo</label>
          <ImageUploader value={form.photoPreview} onChange={handlePhoto} disabled={submitting} />
        </div>

        {/* Right Column: Fields */}
        <div className="md:col-span-2 flex flex-col gap-6">
          
          {/* Row 1: Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">First Name *</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} disabled={submitting} className={inputClass(errors.firstName)} placeholder="John" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Last Name *</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} disabled={submitting} className={inputClass(errors.lastName)} placeholder="Doe" />
            </div>
          </div>

          {/* Row 2: Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
              <input name="email" type="email" value={form.email || ''} onChange={handleChange} disabled={submitting} className={inputClass(false)} placeholder="john@company.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
              <input name="phone" type="tel" value={form.phone || ''} onChange={handleChange} disabled={submitting} className={inputClass(false)} placeholder="+234..." />
            </div>
          </div>

          {/* Row 3: Job Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Position</label>
              <input name="position" value={form.position || ''} onChange={handleChange} disabled={submitting} className={inputClass(false)} placeholder="Engineer" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Department</label>
              <input name="department" value={form.department || ''} onChange={handleChange} disabled={submitting} className={inputClass(false)} placeholder="Engineering" />
            </div>
          </div>

          {/* Row 4: Address */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Residential Address</label>
            <input name="address" value={form.address || ''} onChange={handleChange} disabled={submitting} className={inputClass(false)} placeholder="123 Main Street, Lagos" />
          </div>

          {/* Row 5: TIN & NIN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">TIN (Optional)</label>
              <input name="tin" value={form.tin || ''} onChange={handleChange} disabled={submitting} className={inputClass(false)} placeholder="Individual Tax ID" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">NIN (Optional)</label>
              <input name="nin" value={form.nin || ''} onChange={handleChange} disabled={submitting} className={inputClass(false)} placeholder="National Identity Number" />
            </div>
          </div>

        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-6 mt-8 border-t border-slate-200">
        {onCancel && <button type="button" className="px-5 py-2.5 rounded-lg font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 transition" onClick={onCancel} disabled={submitting}>Cancel</button>}
        <button type="submit" className="px-5 py-2.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm" disabled={submitting}>{submitting ? 'Saving…' : submitLabel}</button>
      </div>
    </form>
  );
}

import { useState, useEffect } from 'react';
import ImageUploader from './ImageUploader';

const EMPTY = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  position: '',
  department: '',
  photo: null,
  photoPreview: null,
};

export default function MemberForm({
  initialData = null,
  onSubmit,
  submitting = false,
  submitLabel = 'Save Member',
  onCancel,
}) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  // Hydrate from initialData when editing
  useEffect(() => {
    if (initialData) {
      setForm({
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        position: initialData.position || '',
        department: initialData.department || '',
        photo: null,
        photoPreview: initialData.photoUrl || null,
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

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      errs.email = 'Invalid email';
    }
    if (form.phone && !/^[+\d][\d\s\-()]{6,}$/.test(form.phone)) {
      errs.phone = 'Invalid phone number';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      position: form.position.trim() || undefined,
      department: form.department.trim() || undefined,
    };

    onSubmit(payload, form.photo);
  };

  // Reusable input class string
  const inputClass = (hasError) => 
    `w-full px-4 py-2.5 rounded-lg border text-slate-900 bg-white focus:ring-2 outline-none transition disabled:bg-slate-50 disabled:text-slate-500 ${
      hasError 
        ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
        : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'
    }`;

  return (
    <form className="w-full" onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left: Photo */}
        <div className="md:col-span-1">
          <label className="block text-sm font-semibold text-slate-700 mb-3">Member Photo</label>
          <ImageUploader
            value={form.photoPreview}
            onChange={handlePhoto}
            disabled={submitting}
          />
        </div>

        {/* Right: Fields */}
        <div className="md:col-span-2 flex flex-col gap-6">
          
          {/* Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="firstName" className="block text-sm font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                id="firstName"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                disabled={submitting}
                className={inputClass(errors.firstName)}
                placeholder="John"
              />
              {errors.firstName && <span className="text-red-500 text-xs mt-1 block">{errors.firstName}</span>}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-semibold text-slate-700 mb-1">Last Name *</label>
              <input
                id="lastName"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                disabled={submitting}
                className={inputClass(errors.lastName)}
                placeholder="Doe"
              />
              {errors.lastName && <span className="text-red-500 text-xs mt-1 block">{errors.lastName}</span>}
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                disabled={submitting}
                className={inputClass(errors.email)}
                placeholder="john@company.com"
              />
              {errors.email && <span className="text-red-500 text-xs mt-1 block">{errors.email}</span>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                disabled={submitting}
                className={inputClass(errors.phone)}
                placeholder="+2348012345678"
              />
              {errors.phone && <span className="text-red-500 text-xs mt-1 block">{errors.phone}</span>}
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="position" className="block text-sm font-semibold text-slate-700 mb-1">Position</label>
              <input
                id="position"
                name="position"
                value={form.position}
                onChange={handleChange}
                disabled={submitting}
                className={inputClass(false)}
                placeholder="Software Engineer"
              />
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-semibold text-slate-700 mb-1">Department</label>
              <input
                id="department"
                name="department"
                value={form.department}
                onChange={handleChange}
                disabled={submitting}
                className={inputClass(false)}
                placeholder="Engineering"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-6 mt-8 border-t border-slate-200">
        {onCancel && (
          <button 
            type="button" 
            className="px-5 py-2.5 rounded-lg font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition disabled:opacity-50" 
            onClick={onCancel} 
            disabled={submitting}
          >
            Cancel
          </button>
        )}
        <button 
          type="submit" 
          className="px-5 py-2.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm disabled:opacity-50" 
          disabled={submitting}
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

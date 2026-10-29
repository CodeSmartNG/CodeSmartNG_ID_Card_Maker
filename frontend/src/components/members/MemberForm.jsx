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

    // Convert to payload — controller accepts JSON. Photo upload is separate endpoint.
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

  return (
    <form className="member-form" onSubmit={handleSubmit} noValidate>
      <div className="member-form__grid">
        {/* Left: photo */}
        <div className="member-form__photo">
          <ImageUploader
            value={form.photoPreview}
            onChange={handlePhoto}
            disabled={submitting}
          />
        </div>

        {/* Right: fields */}
        <div className="member-form__fields">
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="firstName">First Name *</label>
              <input
                id="firstName"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                disabled={submitting}
                className={errors.firstName ? 'input-error' : ''}
                placeholder="John"
              />
              {errors.firstName && <span className="field-error">{errors.firstName}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="lastName">Last Name *</label>
              <input
                id="lastName"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                disabled={submitting}
                className={errors.lastName ? 'input-error' : ''}
                placeholder="Doe"
              />
              {errors.lastName && <span className="field-error">{errors.lastName}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                disabled={submitting}
                className={errors.email ? 'input-error' : ''}
                placeholder="john@company.com"
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                disabled={submitting}
                className={errors.phone ? 'input-error' : ''}
                placeholder="+2348012345678"
              />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="position">Position</label>
              <input
                id="position"
                name="position"
                value={form.position}
                onChange={handleChange}
                disabled={submitting}
                placeholder="Software Engineer"
              />
            </div>

            <div className="form-field">
              <label htmlFor="department">Department</label>
              <input
                id="department"
                name="department"
                value={form.department}
                onChange={handleChange}
                disabled={submitting}
                placeholder="Engineering"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="member-form__actions">
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const validate = () => {
    const errs = {};

    if (!form.name.trim()) errs.name = 'Your name is required';
    if (!form.organizationName.trim()) errs.organizationName = 'Organization name is required';

    if (!form.email) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Invalid email format';

    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'At least 8 characters';
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Must contain uppercase letter';
    else if (!/[a-z]/.test(form.password)) errs.password = 'Must contain lowercase letter';
    else if (!/[0-9]/.test(form.password)) errs.password = 'Must contain a number';

    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.toLowerCase().trim(),
        password: form.password,
        organizationName: form.organizationName.trim(),
        phone: form.phone.trim() || undefined,
      });
      toast.success('Account created! Welcome to CodeSmartNG.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      toast.error(message);
      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <div className="auth-header">
          <h1>Create Your Account</h1>
          <p>Start issuing ID cards in minutes</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {errors.form && (
            <div className="form-error-banner" role="alert">
              {errors.form}
            </div>
          )}

          {/* Organization Name */}
          <div className="form-field">
            <label htmlFor="organizationName">Organization Name</label>
            <input
              id="organizationName"
              name="organizationName"
              type="text"
              placeholder="Acme Corporation"
              value={form.organizationName}
              onChange={handleChange}
              disabled={loading}
              className={errors.organizationName ? 'input-error' : ''}
            />
            {errors.organizationName && (
              <span className="field-error">{errors.organizationName}</span>
            )}
          </div>

          {/* Full Name */}
          <div className="form-field">
            <label htmlFor="name">Your Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="John Doe"
              value={form.name}
              onChange={handleChange}
              disabled={loading}
              className={errors.name ? 'input-error' : ''}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          {/* Email */}
          <div className="form-field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={handleChange}
              disabled={loading}
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          {/* Phone (optional) */}
          <div className="form-field">
            <label htmlFor="phone">
              Phone Number <span className="label-optional">(optional)</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+2348012345678"
              value={form.phone}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={handleChange}
                disabled={loading}
                className={errors.password ? 'input-error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}
            <span className="field-hint">
              Must contain uppercase, lowercase, and a number
            </span>
          </div>

          {/* Confirm Password */}
          <div className="form-field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              className={errors.confirmPassword ? 'input-error' : ''}
            />
            {errors.confirmPassword && (
              <span className="field-error">{errors.confirmPassword}</span>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

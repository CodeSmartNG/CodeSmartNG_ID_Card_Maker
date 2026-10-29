import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', organizationName: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '3rem auto', padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Create Account</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          type="text"
          placeholder="Full Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input
          type="text"
          placeholder="Organization Name"
          value={form.organizationName}
          onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
          required
          style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input
          type="email"
          placeholder="Email Address"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input
          type="password"
          placeholder="Password (min 8 chars, 1 uppercase, 1 number)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '0.75rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {loading ? 'Creating...' : 'Create Account'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
        Already have an account? <Link to="/login" style={{ color: '#6366f1' }}>Sign in</Link>
      </p>
    </div>
  );
}

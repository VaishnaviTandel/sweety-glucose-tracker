import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isSignup) await register(form.name, form.email, form.password);
      else await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="card" onSubmit={onSubmit}>
        <h1>🩸 Sweety</h1>
        <p className="muted">{isSignup ? 'Create your account' : 'Log in to track your glucose'}</p>

        {isSignup && (
          <label>
            Name
            <input name="name" value={form.name} onChange={onChange} />
          </label>
        )}
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={onChange} />
        </label>
        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={onChange} />
        </label>

        {error && <div className="error" role="alert">{error}</div>}

        <button disabled={busy}>{busy ? 'Please wait...' : isSignup ? 'Sign up' : 'Log in'}</button>

        <p className="muted">
          {isSignup ? (
            <>Already have an account? <Link to="/login">Log in</Link></>
          ) : (
            <>New here? <Link to="/signup">Sign up</Link></>
          )}
        </p>
      </form>
    </div>
  );
}
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import BrandMark from '../components/BrandMark';
import './Auth.css';

function Register() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const e = {};
    if (!form.name.trim()) {
      e.name = 'Full name is required.';
    } else if (form.name.trim().length < 2) {
      e.name = 'Name must be at least 2 characters.';
    }
    if (!form.email.trim()) {
      e.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      e.email = 'Enter a valid email address.';
    }
    if (!form.password) {
      e.password = 'Password is required.';
    } else if (form.password.length < 8) {
      e.password = 'Password must be at least 8 characters.';
    }
    if (!form.confirmPassword) {
      e.confirmPassword = 'Please confirm your password.';
    } else if (form.password !== form.confirmPassword) {
      e.confirmPassword = 'Passwords do not match.';
    }
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((err) => ({ ...err, [name]: '' }));
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const result = await register(form.name, form.email, form.password);
    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setServerError(result.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split-wrapper animate-fade-in-up">
        <div className="auth-brand-side">
          <img
            src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80"
            alt="Travel destination with mountains and a lake"
            className="auth-brand-bg"
          />
          <div className="auth-brand-overlay" />

          <div className="auth-brand-content">
            <div className="auth-brand-logo">
              <span className="navbar-logo-icon" aria-hidden="true"><BrandMark /></span>
              TripWise
            </div>

            <div className="auth-brand-hero-text">
              <span className="badge badge-accent auth-badge">Start planning</span>
              <h2 className="auth-brand-title">Your next trip begins here.</h2>
              <p className="auth-brand-subtitle">
                Build your itinerary, save favorite cities, and compare destinations in one seamless planning flow.
              </p>
            </div>

            <div className="auth-trust-row">
              <span>✓ Personalized trips</span>
              <span>✓ Budget-aware planning</span>
            </div>
          </div>
        </div>

        <div className="auth-form-side">
          <div className="auth-header">
            <span className="badge badge-primary auth-header-badge">Get started</span>
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-subtitle">Plan smarter trips from day one.</p>
          </div>

          {serverError && (
            <div className="auth-server-error" role="alert">
              <span>⚠</span> {serverError}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="reg-name" className="form-label">
                Full name
              </label>
              <input
                id="reg-name"
                type="text"
                name="name"
                autoComplete="name"
                placeholder="Your full name"
                className={`form-input${errors.name ? ' error' : ''}`}
                value={form.name}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.name && <span className="form-error">✕ {errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="reg-email" className="form-label">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`form-input${errors.email ? ' error' : ''}`}
                value={form.email}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.email && <span className="form-error">✕ {errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="reg-password" className="form-label">
                Password
              </label>
              <div className="input-password-wrap">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className={`form-input${errors.password ? ' error' : ''}`}
                  value={form.password}
                  onChange={handleChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
              {errors.password && <span className="form-error">✕ {errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="reg-confirm" className="form-label">
                Confirm Password
              </label>
              <div className="input-password-wrap">
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  className={`form-input${errors.confirmPassword ? ' error' : ''}`}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirm((s) => !s)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? '🙈' : '👁'}
                </button>
              </div>
              {errors.confirmPassword && <span className="form-error">✕ {errors.confirmPassword}</span>}
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} id="register-submit-btn">
              {loading ? 'Creating Account…' : 'Create Account'}
            </Button>
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
    </div>
  );
}

export default Register;

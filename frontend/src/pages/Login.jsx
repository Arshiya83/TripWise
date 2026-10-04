import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import './Auth.css';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuth();

  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  // ── Validation ───────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.email.trim()) {
      e.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      e.email = 'Enter a valid email address.';
    }
    if (!form.password) {
      e.password = 'Password is required.';
    } else if (form.password.length < 6) {
      e.password = 'Password must be at least 6 characters.';
    }
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((err) => ({ ...err, [name]: '' }));
    if (serverError) setServerError('');
  };

  const fillDemoCredentials = () => {
    setForm({ email: 'demo@tripwise.app', password: 'password123' });
    setErrors({});
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    const result = await login(form.email, form.password);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setServerError(result.message || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split-wrapper animate-fade-in-up">
        {/* ── Left Side: Travel Showcase Branding ── */}
        <div className="auth-brand-side">
          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80"
            alt="Tropical travel coastal destination"
            className="auth-brand-bg"
          />
          <div className="auth-brand-overlay" />

          <div className="auth-brand-content">
            <Link to="/" className="auth-brand-logo" aria-label="TripWise homepage">
              <span className="navbar-logo-icon" aria-hidden="true">✈</span>
              TripWise
            </Link>

            <div className="auth-brand-hero-text">
              <span className="badge badge-accent" style={{ marginBottom: '0.85rem' }}>
                AI Travel Assistant
              </span>
              <h2 className="auth-brand-title">
                Your Next Great Journey Starts Here.
              </h2>
              <p className="auth-brand-subtitle">
                Access your personalized itineraries, smart route maps, and budget planner in one unified workspace.
              </p>

              <ul className="auth-perks-list">
                <li className="auth-perk-item">
                  <span className="auth-perk-icon">✓</span>
                  <span>Day-by-day smart schedule generation</span>
                </li>
                <li className="auth-perk-item">
                  <span className="auth-perk-icon">✓</span>
                  <span>Shortest transit route optimization</span>
                </li>
                <li className="auth-perk-item">
                  <span className="auth-perk-icon">✓</span>
                  <span>Real-time budget & expense tracking</span>
                </li>
              </ul>
            </div>

            <div className="auth-testimonial-badge">
              ⭐ <strong>4.9/5 Rating</strong> from 2,000+ happy travelers across India
            </div>
          </div>
        </div>

        {/* ── Right Side: Authentication Form ── */}
        <div className="auth-form-side">
          <div className="auth-header">
            <span className="badge badge-primary auth-header-badge">Welcome Back</span>
            <h1 className="auth-title">Sign in to TripWise</h1>
            <p className="auth-subtitle">Enter your credentials to access your trips</p>
          </div>

          {/* Server Error */}
          {serverError && (
            <div className="auth-server-error" role="alert">
              <span>⚠</span> {serverError}
            </div>
          )}

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`form-input${errors.email ? ' error' : ''}`}
                value={form.email}
                onChange={handleChange}
                disabled={loading}
                aria-describedby={errors.email ? 'login-email-err' : undefined}
              />
              {errors.email && (
                <span id="login-email-err" className="form-error" role="alert">
                  ✕ {errors.email}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="login-password" className="form-label">
                Password
              </label>
              <div className="input-password-wrap">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`form-input${errors.password ? ' error' : ''}`}
                  value={form.password}
                  onChange={handleChange}
                  disabled={loading}
                  aria-describedby={errors.password ? 'login-pwd-err' : undefined}
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
              {errors.password && (
                <span id="login-pwd-err" className="form-error" role="alert">
                  ✕ {errors.password}
                </span>
              )}
            </div>

            {/* Demo Account Helper */}
            <div className="demo-credentials-box">
              <div className="demo-credentials-info">
                <strong>Demo Credentials:</strong>
                <span>demo@tripwise.app / password123</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={fillDemoCredentials}
              >
                Auto Fill
              </Button>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              id="login-submit-btn"
            >
              {loading ? 'Signing in…' : 'Sign In to TripWise →'}
            </Button>
          </form>

          {/* Footer links */}
          <div className="auth-footer">
            <p>
              Don&apos;t have an account?{' '}
              <Link to="/register" className="auth-link">
                Create one free →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

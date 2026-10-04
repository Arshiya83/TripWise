import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
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
  const [showConfirm, setShowConfirm]   = useState(false);
  const [errors, setErrors]             = useState({});
  const [serverError, setServerError]   = useState('');

  // ── Validation ─────────────────────────────────────────────────
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
    } else if (form.password.length < 6) {
      e.password = 'Password must be at least 6 characters.';
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
        {/* ── Left Side: Travel Showcase Branding ── */}
        <div className="auth-brand-side">
          <img
            src="https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1000&q=80"
            alt="Majestic historic palace architecture"
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
                Join TripWise Today
              </span>
              <h2 className="auth-brand-title">
                Smart Itineraries Crafted in Seconds.
              </h2>
              <p className="auth-brand-subtitle">
                Create a free account to generate personalized itineraries, save dream trips, and optimize travel budgets.
              </p>

              <ul className="auth-perks-list">
                <li className="auth-perk-item">
                  <span className="auth-perk-icon">✓</span>
                  <span>100% Free personalized travel planning</span>
                </li>
                <li className="auth-perk-item">
                  <span className="auth-perk-icon">✓</span>
                  <span>Save multiple upcoming & past trips</span>
                </li>
                <li className="auth-perk-item">
                  <span className="auth-perk-icon">✓</span>
                  <span>Export itineraries to PDF anytime</span>
                </li>
              </ul>
            </div>

            <div className="auth-testimonial-badge">
              🌍 Trusted by travel lovers exploring Hyderabad, Goa, Jaipur, and beyond.
            </div>
          </div>
        </div>

        {/* ── Right Side: Register Form ── */}
        <div className="auth-form-side">
          <div className="auth-header">
            <span className="badge badge-primary auth-header-badge">Get Started Free</span>
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-subtitle">Plan smarter trips today with zero hassle</p>
          </div>

          {/* Server Error */}
          {serverError && (
            <div className="auth-server-error" role="alert">
              <span>⚠</span> {serverError}
            </div>
          )}

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Name */}
            <div className="form-group">
              <label htmlFor="reg-name" className="form-label">
                Full name
              </label>
              <input
                id="reg-name"
                type="text"
                name="name"
                autoComplete="name"
                placeholder="Arshiya Khan"
                className={`form-input${errors.name ? ' error' : ''}`}
                value={form.name}
                onChange={handleChange}
                disabled={loading}
                aria-describedby={errors.name ? 'reg-name-err' : undefined}
              />
              {errors.name && (
                <span id="reg-name-err" className="form-error" role="alert">
                  ✕ {errors.name}
                </span>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="reg-email" className="form-label">
                Email address
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
                aria-describedby={errors.email ? 'reg-email-err' : undefined}
              />
              {errors.email && (
                <span id="reg-email-err" className="form-error" role="alert">
                  ✕ {errors.email}
                </span>
              )}
            </div>

            {/* Password */}
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
                  placeholder="At least 6 characters"
                  className={`form-input${errors.password ? ' error' : ''}`}
                  value={form.password}
                  onChange={handleChange}
                  disabled={loading}
                  aria-describedby={errors.password ? 'reg-pwd-err' : undefined}
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
                <span id="reg-pwd-err" className="form-error" role="alert">
                  ✕ {errors.password}
                </span>
              )}
            </div>

            {/* Confirm Password */}
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
                  aria-describedby={errors.confirmPassword ? 'reg-confirm-err' : undefined}
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
              {errors.confirmPassword && (
                <span id="reg-confirm-err" className="form-error" role="alert">
                  ✕ {errors.confirmPassword}
                </span>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              id="register-submit-btn"
            >
              {loading ? 'Creating account…' : 'Create Free Account →'}
            </Button>
          </form>

          {/* Footer links */}
          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;

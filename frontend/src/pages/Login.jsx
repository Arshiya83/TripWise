import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import BrandMark from '../components/BrandMark';
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
              <span className="badge badge-accent auth-badge">Travel smarter</span>
              <h2 className="auth-brand-title">Plan smarter.<br />Travel better.</h2>
              <p className="auth-brand-subtitle">
                Build tailored itineraries, save favorite experiences, and discover destinations that match your pace and preferences.
              </p>
            </div>

            <div className="auth-trust-row">
              <span>✓ Curated city guides</span>
              <span>✓ Smart route planning</span>
            </div>
          </div>
        </div>

        <div className="auth-form-side">
          <div className="auth-header">
            <span className="badge badge-primary auth-header-badge">Welcome</span>
            <h1 className="auth-title">TripWise</h1>
            <p className="auth-subtitle">Sign in to continue planning your next journey.</p>
          </div>

          {serverError && (
            <div className="auth-server-error" role="alert">
              <span>⚠</span> {serverError}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">
                Email
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
              />
              {errors.email && <span className="form-error">✕ {errors.email}</span>}
            </div>

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
                  placeholder="Enter your password"
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

            <div className="demo-credentials-box">
              <div className="demo-credentials-info">
                <strong>Demo login</strong>
                <span>demo@tripwise.app / password123</span>
              </div>
              <Button type="button" variant="ghost" size="xs" onClick={fillDemoCredentials}>
                Auto Fill
              </Button>
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} id="login-submit-btn">
              {loading ? 'Signing In…' : 'Login'}
            </Button>
          </form>

          <div className="auth-footer">
            <p>
              Don&apos;t have an account?{' '}
              <Link to="/register" className="auth-link">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

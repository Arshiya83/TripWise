import { Link } from 'react-router-dom';

const PRODUCT_LINKS = [
  { to: '/',            label: 'Home' },
  { to: '/plan-trip',   label: 'Plan a Trip' },
  { to: '/dashboard',   label: 'Dashboard' },
  { to: '/saved-trips', label: 'Saved Trips' },
  { to: '/destinations',label: 'Destinations' },
];

const FEATURES_LINKS = [
  { to: '/itinerary',   label: 'AI Itinerary' },
  { to: '/map',         label: 'Route Map' },
  { to: '/budget',      label: 'Budget Planner' },
  { to: '/hotels',      label: 'Hotels' },
  { to: '/restaurants', label: 'Restaurants' },
];

const ACCOUNT_LINKS = [
  { to: '/login',    label: 'Login' },
  { to: '/register', label: 'Sign Up' },
  { to: '/profile',  label: 'My Profile' },
];

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-main">
        <div className="footer-grid">
          {/* Brand */}
          <div>
            <div className="footer-brand-logo">
              <span className="footer-brand-icon" aria-hidden="true">✈</span>
              TripWise
            </div>
            <p className="footer-tagline">
              Plan smarter, travel better. TripWise helps you create
              personalized itineraries, optimise routes, and make every
              journey memorable.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="footer-col-title">Product</h3>
            <ul className="footer-links" role="list">
              {PRODUCT_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="footer-col-title">Features</h3>
            <ul className="footer-links" role="list">
              {FEATURES_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="footer-col-title">Account</h3>
            <ul className="footer-links" role="list">
              {ACCOUNT_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <p className="footer-copyright">
            © {year} TripWise. All rights reserved.
          </p>
          <nav className="footer-bottom-links" aria-label="Legal links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact Us</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

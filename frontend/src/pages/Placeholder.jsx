import { Link } from 'react-router-dom';
import Button from '../components/Button';
import './Placeholder.css';

/**
 * Placeholder — generic coming-soon page for routes not yet implemented.
 *
 * Props:
 *  title       – page name
 *  icon        – emoji
 *  description – short description
 *  isError     – render as 404/error style
 */
function Placeholder({ title, icon = '🚧', description = '', isError = false }) {
  return (
    <div className={`placeholder-page${isError ? ' placeholder-error' : ''}`}>
      <div className="placeholder-card card animate-fade-in-up">
        <div className="placeholder-icon" aria-hidden="true">{icon}</div>

        {isError ? (
          <>
            <h1 className="placeholder-title">404 — Page Not Found</h1>
            <p className="placeholder-desc">
              Oops! The page you're looking for doesn&apos;t exist or has moved.
            </p>
          </>
        ) : (
          <>
            <div className="placeholder-badge">Coming Soon</div>
            <h1 className="placeholder-title">{title}</h1>
            {description && <p className="placeholder-desc">{description}</p>}
            <p className="placeholder-note">
              This feature is part of a later development stage and will be
              available soon. Stay tuned!
            </p>
          </>
        )}

        <div className="placeholder-actions">
          <Button variant="primary" as={Link} to="/dashboard" id="placeholder-dashboard-btn">
            Go to Dashboard
          </Button>
          <Button variant="secondary" as={Link} to="/" id="placeholder-home-btn">
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Placeholder;

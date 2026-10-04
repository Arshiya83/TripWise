/**
 * LoadingSpinner — Centred loading indicator
 *
 * Props:
 *  size  – 'sm' | 'md' | 'lg'
 *  label – optional text below spinner
 *  fullPage – take full remaining vertical space
 */

function LoadingSpinner({ size = 'md', label = '', fullPage = false }) {
  return (
    <div className={`spinner-overlay${fullPage ? ' spinner-fullpage' : ''}`} role="status">
      <div className={`spinner spinner-${size}`} />
      {label && <p className="spinner-label">{label}</p>}
      <span className="sr-only">{label || 'Loading…'}</span>
    </div>
  );
}

export default LoadingSpinner;

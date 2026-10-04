import { Link, useNavigate } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import Button from '../components/Button';
import './SelectedPlaces.css';

function SelectedPlaces() {
  const navigate = useNavigate();
  const { trip, removePlace } = useTrip();

  const selectedPlaces = trip.selectedPlaces || [];
  const currentCity = trip.destination || 'Hyderabad';

  // Calculate approximate total fees
  const totalFees = selectedPlaces.reduce((acc, p) => {
    const feeMatch = p.entryFee?.match(/\d+/);
    return acc + (feeMatch ? parseInt(feeMatch[0], 10) : 0);
  }, 0);

  return (
    <div className="selected-places-page">
      <div className="container">
        {/* ── Stepper Indicator ────────────────────── */}
        <nav className="trip-stepper" aria-label="Trip planning steps">
          <Link to="/plan-trip" className="trip-step-item completed">
            <span className="trip-step-badge">✓</span>
            <span>Preferences</span>
          </Link>
          <span className="trip-step-arrow">→</span>
          <Link to="/destinations" className="trip-step-item completed">
            <span className="trip-step-badge">✓</span>
            <span>Destinations</span>
          </Link>
          <span className="trip-step-arrow">→</span>
          <div className="trip-step-item active">
            <span className="trip-step-badge">3</span>
            <span>Selected Places ({selectedPlaces.length})</span>
          </div>
          <span className="trip-step-arrow">→</span>
          <div className="trip-step-item">
            <span className="trip-step-badge">4</span>
            <span>Smart Itinerary</span>
          </div>
        </nav>

        {/* ── Header ───────────────────────────────── */}
        <div className="sel-header animate-fade-in-up">
          <div className="sel-header-top">
            <div>
              <span className="badge badge-primary">{currentCity} Trip</span>
              <h1 className="sel-title">Review Selected Places</h1>
              <p className="sel-subtitle">
                Review your chosen sights before our algorithm sequences your day-by-day itinerary and routes.
              </p>
            </div>
            <div className="sel-header-actions">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/destinations')}
              >
                + Add More Places
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/itinerary')}
                disabled={selectedPlaces.length === 0}
              >
                Generate Smart Itinerary →
              </Button>
            </div>
          </div>
        </div>

        {/* ── Content Layout ───────────────────────── */}
        {selectedPlaces.length === 0 ? (
          <div className="empty-state card animate-fade-in-up">
            <div className="empty-state-icon">📍</div>
            <h3 className="empty-state-title">No places selected yet</h3>
            <p className="empty-state-desc">
              You haven&apos;t added any attractions for your {currentCity} trip. Browse attractions and select your favorites.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/destinations')}
            >
              Browse {currentCity} Destinations →
            </Button>
          </div>
        ) : (
          <div className="sel-content-grid">
            {/* List of Selected Places */}
            <div className="sel-list">
              {selectedPlaces.map((place, index) => (
                <div key={place.id} className="sel-item-card card card-hover">
                  <div className="sel-item-index">{index + 1}</div>
                  <img
                    src={place.image}
                    alt={place.name}
                    className="sel-item-thumb"
                  />
                  <div className="sel-item-body">
                    <div className="sel-item-top">
                      <span className="badge badge-accent">{place.category}</span>
                      <span className="sel-item-rating">★ {place.rating}</span>
                    </div>
                    <h3 className="sel-item-name">{place.name}</h3>
                    <p className="sel-item-location">📍 {place.location}</p>

                    <div className="sel-item-meta">
                      <span>⏱️ {place.duration}</span>
                      <span>🎟️ {place.entryFee}</span>
                      <span>☀️ {place.bestTime}</span>
                    </div>
                  </div>

                  <div className="sel-item-actions">
                    <button
                      type="button"
                      className="sel-remove-btn"
                      onClick={() => removePlace(place.id)}
                      title="Remove place"
                      aria-label={`Remove ${place.name}`}
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Sticky Trip Summary Sidebar */}
            <aside className="sel-sidebar">
              <div className="sel-summary-card card">
                <h3 className="sidebar-title">Trip Summary</h3>

                <div className="sidebar-metric-row">
                  <span className="metric-label">Destination</span>
                  <span className="metric-val">📍 {currentCity}</span>
                </div>
                <div className="sidebar-metric-row">
                  <span className="metric-label">Duration</span>
                  <span className="metric-val">🗓️ {trip.numberOfDays || 3} Days</span>
                </div>
                <div className="sidebar-metric-row">
                  <span className="metric-label">Travelers</span>
                  <span className="metric-val">👥 {trip.travelers || 2} Persons</span>
                </div>
                <div className="sidebar-metric-row">
                  <span className="metric-label">Selected Places</span>
                  <span className="metric-val font-highlight">{selectedPlaces.length} Attractions</span>
                </div>
                <div className="sidebar-metric-row">
                  <span className="metric-label">Est. Entry Fees</span>
                  <span className="metric-val">~₹{totalFees * (trip.travelers || 2)} total</span>
                </div>

                <div className="sidebar-divider" />

                <div className="sidebar-tip">
                  <span className="tip-icon">✨</span>
                  <p className="tip-text">
                    Next step: Our AI will distribute these {selectedPlaces.length} places across your {trip.numberOfDays || 3} travel days with optimal transit paths.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => navigate('/itinerary')}
                  className="sidebar-continue-btn"
                >
                  Create Smart Itinerary →
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth
                  onClick={() => navigate('/destinations')}
                >
                  + Add More Attractions
                </Button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

export default SelectedPlaces;

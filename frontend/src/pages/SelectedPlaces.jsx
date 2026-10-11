import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTrip, isPlaceInCity } from '../context/TripContext';
import Button from '../components/Button';
import SmartPlannerModal from '../components/SmartPlannerModal';
import './SelectedPlaces.css';

export default function SelectedPlaces() {
  const navigate = useNavigate();
  const { trip, removePlace, setTripPreferences } = useTrip();
  const [isPlannerModalOpen, setIsPlannerModalOpen] = useState(false);

  const currentCity = trip.destination || 'Hyderabad';
  const selectedPlaces = useMemo(() => {
    return (trip.selectedPlaces || []).filter((p) => isPlaceInCity(p, currentCity));
  }, [trip.selectedPlaces, currentCity]);

  // Synchronize trip state if any mismatched places exist from earlier sessions
  useEffect(() => {
    if (!trip.selectedPlaces || trip.selectedPlaces.length === 0) return;
    const hasMismatched = trip.selectedPlaces.some((p) => !isPlaceInCity(p, currentCity));
    if (hasMismatched) {
      const sanitized = trip.selectedPlaces.filter((p) => isPlaceInCity(p, currentCity));
      setTripPreferences({ selectedPlaces: sanitized });
    }
  }, [currentCity, trip.selectedPlaces, setTripPreferences]);

  const numberOfDays = trip.numberOfDays || 3;
  const travelers = trip.travelers || trip.totalTravelers || 2;
  const budget = trip.budget ? Number(trip.budget).toLocaleString('en-IN') : '25,000';
  const travelType = trip.travelType || 'Couple';
  const interests = trip.interests?.length > 0 ? trip.interests : ['Culture', 'History'];

  // Calculate approximate total fees
  const totalFeesPerPerson = selectedPlaces.reduce((acc, p) => {
    const feeMatch = (p.entryFeeStr || String(p.entryFee || '')).match(/\d+/);
    return acc + (feeMatch ? parseInt(feeMatch[0], 10) : 0);
  }, 0);
  const totalAllTravelersFees = totalFeesPerPerson * travelers;

  const handleCreateSmartTrip = () => {
    if (selectedPlaces.length === 0) return;
    setIsPlannerModalOpen(true);
  };

  const handlePlannerComplete = () => {
    setIsPlannerModalOpen(false);
    navigate('/itinerary');
  };

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
            <span>Select Places</span>
          </Link>
          <span className="trip-step-arrow">→</span>
          <div className="trip-step-item active">
            <span className="trip-step-badge">3</span>
            <span>Review Selection ({selectedPlaces.length})</span>
          </div>
          <span className="trip-step-arrow">→</span>
          <div className="trip-step-item">
            <span className="trip-step-badge">4</span>
            <span>Smart Itinerary</span>
          </div>
        </nav>

        {/* ── Header ───────────────────────────────── */}
        <div className="sel-header card animate-fade-in-up">
          <div className="sel-header-top">
            <div>
              <span className="sel-badge-pill">REVIEW & CONFIRM</span>
              <h1 className="sel-title">YOUR SELECTED PLACES — {currentCity.toUpperCase()}</h1>
              <p className="sel-subtitle">
                Review your chosen sights before TripWise sequences them into your day-by-day smart itinerary.
              </p>
            </div>
            <div className="sel-header-actions">
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/destinations')}
                id="btn-add-more-places-top"
              >
                ← Add More Places
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleCreateSmartTrip}
                disabled={selectedPlaces.length === 0}
                id="btn-create-smart-trip-top"
              >
                Create My Smart Trip →
              </Button>
            </div>
          </div>

          {/* Quick Metrics Line */}
          <div className="sel-metric-strip">
            <span>📍 <strong>{selectedPlaces.length}</strong> Places Chosen</span>
            <span>•</span>
            <span>🗓️ <strong>{numberOfDays}</strong> Days Duration</span>
            <span>•</span>
            <span>👥 <strong>{travelers}</strong> Travelers</span>
            <span>•</span>
            <span>💰 Est. Entry Fees: <strong>₹{totalAllTravelersFees.toLocaleString('en-IN')}</strong> total</span>
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
            {/* Numbered List of Selected Places */}
            <div className="sel-list">
              {selectedPlaces.map((place, index) => (
                <article key={place.id} className="sel-item-card card card-hover">
                  <div className="sel-item-index">{index + 1}</div>

                  <img
                    src={place.image}
                    alt={place.name}
                    className="sel-item-thumb"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';
                    }}
                  />

                  <div className="sel-item-body">
                    <div className="sel-item-top">
                      <span className="badge badge-accent">
                        {(place.category || 'Sightseeing').toUpperCase()}
                      </span>
                    </div>

                    <h3 className="sel-item-name">{place.name}</h3>
                    <p className="sel-item-desc">{place.description}</p>

                    <div className="sel-item-meta">
                      <span>⏱ {place.duration || '2 Hours'}</span>
                      <span>💰 {place.entryFeeStr || `₹${place.entryFee || 0} / person`}</span>
                      <span>☀ Best time: {place.bestTime || 'Morning'}</span>
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
                      ✕ Remove
                    </button>
                  </div>
                </article>
              ))}

              {/* Bottom Actions Bar */}
              <div className="sel-bottom-actions card">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => navigate('/destinations')}
                  id="btn-add-more-places"
                >
                  ← Add More Places
                </Button>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleCreateSmartTrip}
                  id="btn-create-smart-trip-bottom"
                >
                  Create My Smart Trip →
                </Button>
              </div>
            </div>

            {/* Trip Summary Sidebar */}
            <aside className="sel-sidebar">
              <div className="sel-summary-card card">
                <h3 className="sidebar-title">Trip Planning Parameters</h3>

                <div className="sidebar-metric-row">
                  <span className="metric-label">Target City</span>
                  <span className="metric-val">📍 {currentCity}</span>
                </div>
                <div className="sidebar-metric-row">
                  <span className="metric-label">Duration</span>
                  <span className="metric-val">🗓️ {numberOfDays} Days</span>
                </div>
                <div className="sidebar-metric-row">
                  <span className="metric-label">Travelers</span>
                  <span className="metric-val">👥 {travelers} Persons</span>
                </div>
                <div className="sidebar-metric-row">
                  <span className="metric-label">Budget</span>
                  <span className="metric-val">💰 ₹{budget}</span>
                </div>
                <div className="sidebar-metric-row">
                  <span className="metric-label">Travel Style</span>
                  <span className="metric-val">✨ {travelType}</span>
                </div>
                <div className="sidebar-metric-row">
                  <span className="metric-label">Selected Sights</span>
                  <span className="metric-val">🏛️ {selectedPlaces.length} Places</span>
                </div>

                <div className="sidebar-rule-note">
                  <strong>AI Organization Principle:</strong> TripWise will sequence these {selectedPlaces.length} attractions into your itinerary by geographic proximity. Your selected attractions will NOT be replaced.
                </div>

                <Button
                  variant="primary"
                  size="md"
                  className="sidebar-cta-btn"
                  onClick={handleCreateSmartTrip}
                >
                  Create My Smart Trip →
                </Button>
              </div>
            </aside>
          </div>
        )}

        {/* ── Smart Planner AI Transition Modal ──────── */}
        <SmartPlannerModal
          isOpen={isPlannerModalOpen}
          tripData={{
            destination: currentCity,
            numberOfDays,
            travelers,
            budget: trip.budget || 25000,
            travelType,
            interests,
            selectedPlaces,
          }}
          onComplete={handlePlannerComplete}
        />
      </div>
    </div>
  );
}

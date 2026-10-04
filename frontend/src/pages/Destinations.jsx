import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import Button from '../components/Button';
import { DESTINATION_PLACES } from '../data/mockData';
import './Destinations.css';

const CATEGORIES = ['All', 'Heritage', 'Nature', 'Culture', 'Beaches', 'Entertainment'];

function Destinations() {
  const navigate = useNavigate();
  const { trip, addPlace, removePlace } = useTrip();

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalPlace, setModalPlace] = useState(null);

  const currentCity = trip.destination || 'Hyderabad';

  // Filter places by current city and category
  const filteredPlaces = useMemo(() => {
    return DESTINATION_PLACES.filter((place) => {
      const matchCity =
        !currentCity || place.city.toLowerCase() === currentCity.toLowerCase();
      const matchCategory =
        activeCategory === 'All' || place.category === activeCategory;
      const matchSearch =
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCity && matchCategory && matchSearch;
    });
  }, [currentCity, activeCategory, searchQuery]);

  const isPlaceSelected = (id) => {
    return (trip.selectedPlaces || []).some((p) => p.id === id);
  };

  const handleTogglePlace = (place) => {
    if (isPlaceSelected(place.id)) {
      removePlace(place.id);
    } else {
      addPlace(place);
    }
  };

  const selectedCount = trip.selectedPlaces?.length || 0;

  return (
    <div className="destinations-page">
      <div className="container">
        {/* ── Stepper Indicator ────────────────────── */}
        <nav className="trip-stepper" aria-label="Trip planning steps">
          <Link to="/plan-trip" className="trip-step-item completed">
            <span className="trip-step-badge">✓</span>
            <span>Preferences</span>
          </Link>
          <span className="trip-step-arrow">→</span>
          <div className="trip-step-item active">
            <span className="trip-step-badge">2</span>
            <span>Destinations</span>
          </div>
          <span className="trip-step-arrow">→</span>
          <Link
            to="/selected-places"
            className={`trip-step-item${selectedCount > 0 ? ' completed' : ''}`}
          >
            <span className="trip-step-badge">3</span>
            <span>Selected ({selectedCount})</span>
          </Link>
          <span className="trip-step-arrow">→</span>
          <div className="trip-step-item">
            <span className="trip-step-badge">4</span>
            <span>Smart Itinerary</span>
          </div>
        </nav>

        {/* ── Header ───────────────────────────────── */}
        <div className="dest-header animate-fade-in-up">
          <div className="dest-header-top">
            <div>
              <span className="badge badge-primary">Exploring {currentCity}</span>
              <h1 className="dest-title">Choose Places to Visit</h1>
              <p className="dest-subtitle">
                Select your must-see attractions. We will optimize routes, timing, and travel transit between them.
              </p>
            </div>
            <div className="dest-header-actions">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/plan-trip')}
              >
                ← Change Preferences
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/selected-places')}
                disabled={selectedCount === 0}
              >
                Review Selected ({selectedCount}) →
              </Button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="dest-filter-bar card">
            <div className="dest-search-wrap">
              <span className="search-icon" aria-hidden="true">🔍</span>
              <input
                type="text"
                placeholder={`Search attractions, sights, or locations in ${currentCity}…`}
                className="dest-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="dest-category-tabs">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`category-tab-btn${activeCategory === cat ? ' active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Places Grid ──────────────────────────── */}
        {filteredPlaces.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-state-icon">🗺️</div>
            <h3 className="empty-state-title">No attractions found</h3>
            <p className="empty-state-desc">
              Try changing your search query or filter category to find more sights in {currentCity}.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('All');
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="places-grid">
            {filteredPlaces.map((place) => {
              const selected = isPlaceSelected(place.id);
              return (
                <div
                  key={place.id}
                  className={`place-card card card-hover${selected ? ' place-card-selected' : ''}`}
                >
                  {/* Photo & Top badges */}
                  <div className="place-img-wrap">
                    <img
                      src={place.image}
                      alt={place.name}
                      className="place-img"
                      loading="lazy"
                    />
                    <div className="place-img-overlay" />

                    <div className="place-badge-top-left">
                      <span className="badge badge-accent">{place.category}</span>
                    </div>

                    <div className="place-badge-top-right">
                      <span className="rating-pill">★ {place.rating}</span>
                    </div>

                    {selected && (
                      <div className="place-selected-watermark">
                        <span>✓ Selected</span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="place-body">
                    <div className="place-location">📍 {place.location}</div>
                    <h3 className="place-name">{place.name}</h3>
                    <p className="place-desc">{place.description}</p>

                    {/* Metadata Specs */}
                    <div className="place-specs">
                      <div className="place-spec-item">
                        <span className="spec-label">Duration</span>
                        <span className="spec-val">⏱️ {place.duration}</span>
                      </div>
                      <div className="place-spec-item">
                        <span className="spec-label">Entry Fee</span>
                        <span className="spec-val">🎟️ {place.entryFee}</span>
                      </div>
                      <div className="place-spec-item">
                        <span className="spec-label">Best Time</span>
                        <span className="spec-val">☀️ {place.bestTime}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="place-actions">
                      <button
                        type="button"
                        className="place-map-btn"
                        onClick={() => setModalPlace(place)}
                        title="View location and route details"
                      >
                        🗺️ View on Map
                      </button>

                      <Button
                        variant={selected ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => handleTogglePlace(place)}
                        className={`place-select-cta${selected ? ' is-selected' : ''}`}
                        id={`select-place-${place.id}`}
                      >
                        {selected ? '✓ Selected' : '+ Select Place'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Sticky Selection Bar ─────────────────── */}
        {selectedCount > 0 && (
          <aside className="sticky-selection-bar card" aria-label="Selected places bar">
            <div className="selection-bar-info">
              <span className="selection-bar-icon">📍</span>
              <div>
                <strong>{selectedCount} place{selectedCount !== 1 ? 's' : ''} selected</strong>
                <span> for your {currentCity} itinerary</span>
              </div>
            </div>
            <div className="selection-bar-actions">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/selected-places')}
              >
                Review List
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/selected-places')}
              >
                Continue to Review →
              </Button>
            </div>
          </aside>
        )}

        {/* ── Map Modal Preview ────────────────────── */}
        {modalPlace && (
          <div className="modal-backdrop" onClick={() => setModalPlace(null)}>
            <div className="modal-card card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">📍 {modalPlace.name}</h3>
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setModalPlace(null)}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div className="modal-map-mockup">
                  <div className="map-grid-pattern" />
                  <div className="map-pin-pulse">
                    <span className="map-pin-icon">📍</span>
                    <span className="map-pin-label">{modalPlace.name}</span>
                  </div>
                  <div className="map-info-pill">
                    Coordinates: {modalPlace.lat}, {modalPlace.lng} • {modalPlace.location}
                  </div>
                </div>
                <div className="modal-details">
                  <p><strong>Address:</strong> {modalPlace.location}</p>
                  <p><strong>Recommended Visit:</strong> {modalPlace.bestTime} ({modalPlace.duration})</p>
                  <p><strong>Entry Ticket:</strong> {modalPlace.entryFee}</p>
                </div>
              </div>
              <div className="modal-footer">
                <Button variant="ghost" size="sm" onClick={() => setModalPlace(null)}>
                  Close
                </Button>
                <Button
                  variant={isPlaceSelected(modalPlace.id) ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => {
                    handleTogglePlace(modalPlace);
                    setModalPlace(null);
                  }}
                >
                  {isPlaceSelected(modalPlace.id) ? 'Remove Place' : 'Select This Place'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Destinations;

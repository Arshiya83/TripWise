import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTrip, isPlaceInCity } from '../context/TripContext';
import Button from '../components/Button';
import SmartPlannerModal from '../components/SmartPlannerModal';
import { isCitySupported, SUPPORTED_CITY_NAMES } from '../data/destination';
import { getAttractionsForCity, calculateMatchScore } from '../services/smartPlannerService';
import './Destinations.css';

const CATEGORIES = [
  'All',
  'Heritage',
  'Nature',
  'Culture',
  'Beaches',
  'Entertainment',
  'Food',
  'Shopping',
];

export default function Destinations() {
  const navigate = useNavigate();
  const { trip, addPlace, removePlace, setTripPreferences } = useTrip();

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlannerModalOpen, setIsPlannerModalOpen] = useState(false);

  // Safe trip parameters
  const currentCity = trip.destination || 'Hyderabad';
  const cityIsSupported = isCitySupported(currentCity);
  const numberOfDays = trip.numberOfDays || 3;
  const travelers = trip.travelers || trip.totalTravelers || 2;
  const budget = trip.budget ? Number(trip.budget).toLocaleString('en-IN') : '25,000';
  const travelType = trip.travelType || 'Couple';
  const interests = useMemo(
    () => (trip.interests?.length > 0 ? trip.interests : ['History', 'Culture']),
    [trip.interests]
  );

  // Selected places must strictly belong to current destination
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

  // 1. Raw attractions for city from destination.js
  const cityAttractions = useMemo(() => {
    if (!cityIsSupported) return [];
    return getAttractionsForCity(currentCity);
  }, [currentCity, cityIsSupported]);

  // 2. Score, annotate, and rank attractions based on user interests
  const scoredAttractions = useMemo(() => {
    return cityAttractions.map((place) => {
      const match = calculateMatchScore(place, interests);
      return {
        ...place,
        matchScore: match.score,
        matchLabel: match.scoreLabel,
        isRecommended: match.isRecommended,
        badgeText: match.badgeText,
        explanation: match.explanation,
      };
    });
  }, [cityAttractions, interests]);

  // 3. Filter by category, search query, and order recommended first
  const filteredPlaces = useMemo(() => {
    const list = scoredAttractions.filter((place) => {
      // Category filter
      const matchesCategory =
        activeCategory === 'All' ||
        place.category.toLowerCase() === activeCategory.toLowerCase();

      // Search filter
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        place.name.toLowerCase().includes(q) ||
        place.description.toLowerCase().includes(q) ||
        (place.address && place.address.toLowerCase().includes(q)) ||
        (place.category && place.category.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });

    // Rank: recommended attractions appear first, then by match score descending
    return list.sort((a, b) => {
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      return (b.matchScore || 0) - (a.matchScore || 0);
    });
  }, [scoredAttractions, activeCategory, searchQuery]);

  const isPlaceSelected = (id) => {
    return selectedPlaces.some((p) => p.id === id);
  };

  const handleTogglePlace = (place) => {
    if (!isPlaceInCity(place, currentCity)) return;
    if (isPlaceSelected(place.id)) {
      removePlace(place.id);
    } else {
      addPlace(place);
    }
  };

  const handleCreateSmartTrip = () => {
    if (selectedPlaces.length === 0) return;
    setIsPlannerModalOpen(true);
  };

  const handlePlannerComplete = () => {
    setIsPlannerModalOpen(false);
    navigate('/itinerary');
  };

  const handleSwitchToSupportedCity = (city) => {
    setTripPreferences({ destination: city, selectedPlaces: [] });
  };

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
            <span>Select Places</span>
          </div>
          <span className="trip-step-arrow">→</span>
          <Link
            to="/selected-places"
            className={`trip-step-item${selectedPlaces.length > 0 ? ' completed' : ''}`}
          >
            <span className="trip-step-badge">3</span>
            <span>Review Selection ({selectedPlaces.length})</span>
          </Link>
          <span className="trip-step-arrow">→</span>
          <div className="trip-step-item">
            <span className="trip-step-badge">4</span>
            <span>Smart Itinerary</span>
          </div>
        </nav>

        {/* ── 1. TOP TRIP SUMMARY (Compact Destination Header) ──────────────── */}
        <header className="dest-summary-header card animate-fade-in-up">
          <div className="dest-summary-main">
            <div className="dest-city-title-row">
              <span className="dest-hub-badge">TARGET DESTINATION</span>
              <h1 className="dest-city-title">{currentCity.toUpperCase()}</h1>
            </div>

            {/* Dynamic context metrics */}
            <div className="dest-metrics-pill-row">
              <span className="metric-tag">🗓️ {numberOfDays} Days</span>
              <span className="metric-tag-dot">•</span>
              <span className="metric-tag">👥 {travelers} Travelers</span>
              <span className="metric-tag-dot">•</span>
              <span className="metric-tag">💰 ₹{budget}</span>
              <span className="metric-tag-dot">•</span>
              <span className="metric-tag">✨ {travelType}</span>
            </div>

            {/* Dynamic interests */}
            <div className="dest-interests-line">
              <span className="interests-label">Interests:</span>
              <div className="interests-tags">
                {interests.map((int) => (
                  <span key={int} className="interest-pill">
                    {int}
                  </span>
                ))}
              </div>
            </div>

            {/* Core smart planning guidance line */}
            <p className="dest-guidance-line">
              Choose the places you want to include in your trip. TripWise will use them to create your personalized itinerary.
            </p>
          </div>

          <div className="dest-summary-actions">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/plan-trip')}
              id="btn-change-preferences"
            >
              ← Change Preferences
            </Button>
          </div>
        </header>

        {/* ── 10-City System: Coming Soon fallback for unsupported cities ────── */}
        {!cityIsSupported ? (
          <section className="unsupported-city-card card animate-fade-in-up" aria-label="City under curation">
            <div className="unsupported-icon">🧭</div>
            <h2 className="unsupported-title">{currentCity} Curations Coming Soon</h2>
            <p className="unsupported-desc">
              Detailed recommendations and route optimizations for <strong>{currentCity}</strong> are currently being curated by TripWise. In the meantime, you can build personalized smart itineraries for our fully supported travel hubs:
            </p>
            <div className="supported-quick-grid">
              {SUPPORTED_CITY_NAMES.map((city) => (
                <button
                  key={city}
                  type="button"
                  className="supported-quick-btn"
                  onClick={() => handleSwitchToSupportedCity(city)}
                >
                  📍 Plan in {city}
                </button>
              ))}
            </div>
          </section>
        ) : (
          <>
            {/* ── 2. SEARCH + CATEGORY FILTER BAR ────────────────────────────── */}
            <section className="dest-controls-bar card animate-fade-in-up" aria-label="Attractions search and filters">
              <div className="search-input-wrap">
                <span className="search-icon" aria-hidden="true">🔍</span>
                <input
                  type="text"
                  placeholder="Search attractions, landmarks or experiences..."
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  id="attractions-search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category pills */}
              <div className="category-filters-row" role="tablist" aria-label="Category filters">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={activeCategory === cat}
                    className={`category-pill${activeCategory === cat ? ' active' : ''}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </section>

            {/* ── 3. SMART RECOMMENDATIONS INFO BANNER ───────────────────────── */}
            <div className="ranking-info-strip animate-fade-in">
              <span className="strip-sparkle">✨</span>
              <span>
                <strong>Smart Ranking Active:</strong> Attractions matching your interests in{' '}
                <em>{interests.join(', ')}</em> are prioritized and highlighted below.
              </span>
            </div>

            {/* ── 4 & 5. 3-COLUMN RESPONSIVE ATTRACTION CARD GRID ─────────────── */}
            {filteredPlaces.length === 0 ? (
              <div className="empty-results-card card animate-fade-in">
                <div className="empty-icon">📍</div>
                <h3>No attractions found</h3>
                <p>No attractions matched &ldquo;{searchQuery}&rdquo; in category &ldquo;{activeCategory}&rdquo;.</p>
                <Button
                  variant="outline"
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
              <section className="attractions-grid" aria-label="Attractions list">
                {filteredPlaces.map((place) => {
                  const selected = isPlaceSelected(place.id);

                  return (
                    <article
                      key={place.id}
                      className={`attraction-card card card-hover${selected ? ' selected' : ''}${
                        place.isRecommended ? ' recommended-card' : ''
                      }`}
                      id={`place-card-${place.id}`}
                    >
                      {/* Image header with fallback */}
                      <div className="card-media-wrap">
                        <img
                          src={place.image}
                          alt={place.name}
                          className="card-media-img"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src =
                              'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';
                          }}
                        />

                        {/* Top badges */}
                        <div className="card-badge-row">
                          <span className="card-category-badge">
                            {place.category.toUpperCase()}
                          </span>

                          {place.isRecommended && place.matchLabel && (
                            <span className="card-match-badge" title="Calculated from your trip interests">
                              {place.matchLabel}
                            </span>
                          )}
                        </div>

                        {place.isRecommended && (
                          <div className="card-rec-pill">
                            ✨ Recommended for your trip
                          </div>
                        )}
                      </div>

                      {/* Card Content Body */}
                      <div className="card-content-body">
                        <h3 className="card-place-name">{place.name}</h3>

                        <p className="card-description">{place.description}</p>

                        {/* Recommendation rationale */}
                        {place.isRecommended && (
                          <div className="card-recommendation-note">
                            <span className="note-icon">💡</span>
                            <span className="note-text">{place.explanation}</span>
                          </div>
                        )}

                        {/* Practical information row */}
                        <div className="card-info-metrics">
                          <div className="info-cell" title="Recommended Duration">
                            <span className="info-icon">⏱</span>
                            <span className="info-val">{place.duration}</span>
                          </div>
                          <div className="info-cell" title="Entry Fee">
                            <span className="info-icon">💰</span>
                            <span className="info-val">{place.entryFeeStr}</span>
                          </div>
                          <div className="info-cell" title="Best Timing">
                            <span className="info-icon">☀</span>
                            <span className="info-val">{place.bestTime || 'Morning'}</span>
                          </div>
                        </div>

                        {/* Selection Button */}
                        <div className="card-action-row">
                          <button
                            type="button"
                            className={`select-place-btn${selected ? ' selected' : ''}`}
                            onClick={() => handleTogglePlace(place)}
                            aria-pressed={selected}
                            id={`btn-select-${place.id}`}
                          >
                            {selected ? (
                              <>
                                <span className="btn-icon">✓</span>
                                <span>Selected</span>
                              </>
                            ) : (
                              <>
                                <span className="btn-icon">○</span>
                                <span>Add to Trip</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </>
        )}

        {/* ── 6. STICKY BOTTOM SELECTED PLACES BAR ───────────────────────── */}
        {cityIsSupported && (
          <aside className="sticky-selection-bar" aria-label="Selected places bar">
            <div className="sticky-bar-inner">
              <div className="sticky-left-info">
                <div className="sticky-count-pill">
                  <span className="pin-icon">📍</span>
                  <strong>{selectedPlaces.length}</strong> {selectedPlaces.length === 1 ? 'place' : 'places'} selected
                </div>

                {/* Horizontal scroll chips of selected places */}
                <div className="sticky-chips-container">
                  {selectedPlaces.length === 0 ? (
                    <span className="sticky-empty-hint">
                      Click &ldquo;Add to Trip&rdquo; on attractions above to create your route
                    </span>
                  ) : (
                    selectedPlaces.map((p) => (
                      <span key={p.id} className="selected-place-chip">
                        <span className="chip-name">{p.name}</span>
                        <button
                          type="button"
                          className="chip-remove-btn"
                          onClick={() => removePlace(p.id)}
                          aria-label={`Remove ${p.name}`}
                        >
                          ✕
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sticky-right-actions">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => navigate('/selected-places')}
                  disabled={selectedPlaces.length === 0}
                  id="btn-review-selection"
                >
                  Review Selection
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleCreateSmartTrip}
                  disabled={selectedPlaces.length === 0}
                  id="btn-create-smart-trip"
                >
                  Create My Smart Trip →
                </Button>
              </div>
            </div>
          </aside>
        )}

        {/* ── 8. SMART PLANNER AI TRANSITION MODAL ───────────────────────── */}
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

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import { CITY_OPTIONS, isCitySupported } from '../data/destination';
import Button from '../components/Button';
import './PlanTrip.css';

const TRAVEL_TYPES = [
  { value: 'Solo',    icon: '🧍', label: 'Solo',    desc: 'Freedom to explore at your own pace' },
  { value: 'Couple',  icon: '👫', label: 'Couple',  desc: 'Romantic getaways & scenic dining' },
  { value: 'Family',  icon: '👨‍👩‍👧', label: 'Family',  desc: 'Comfortable stays & family-friendly spots' },
  { value: 'Friends', icon: '👯', label: 'Friends', desc: 'Adventure, nightlife & group activities' },
];

const INTERESTS = [
  { value: 'Beaches',     icon: '🏖️', category: 'Relax' },
  { value: 'History',     icon: '🏛️', category: 'Culture' },
  { value: 'Food',        icon: '🍜', category: 'Cuisine' },
  { value: 'Nature',      icon: '🌿', category: 'Outdoor' },
  { value: 'Adventure',   icon: '🏕️', category: 'Thrill' },
  { value: 'Shopping',    icon: '🛍️', category: 'Lifestyle' },
  { value: 'Photography', icon: '📷', category: 'Sight' },
  { value: 'Spiritual',   icon: '🕌', category: 'Heritage' },
  { value: 'Nightlife',   icon: '🌃', category: 'Evening' },
  { value: 'Culture',     icon: '🎭', category: 'Arts' },
];

const BUDGET_PRESETS = [
  { label: '₹15,000', value: '15000' },
  { label: '₹30,000', value: '30000' },
  { label: '₹50,000', value: '50000' },
  { label: '₹80,000+', value: '80000' },
];

function PlanTrip() {
  const navigate = useNavigate();
  const { trip, setTripPreferences } = useTrip();

  const [form, setForm] = useState({
    destination: trip.destination || '',
    numberOfDays: trip.numberOfDays || 3,
    travelers: trip.travelers || 2,
    budget: trip.budget || '25000',
    travelType: trip.travelType || 'Couple',
    interests: trip.interests?.length > 0 ? trip.interests : ['History', 'Food', 'Culture'],
  });

  // Search & dropdown state for Step 1
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(!trip.destination);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  const [errors, setErrors] = useState({});
  const cityIsSupported = isCitySupported(form.destination);

  // Selected city object from existing CITY_OPTIONS
  const selectedCity = CITY_OPTIONS.find(
    (c) => c.name.toLowerCase() === (form.destination || '').toLowerCase()
  );

  // Filtered and sorted cities for search
  const filteredCities = CITY_OPTIONS.filter((city) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.trim().toLowerCase();
    return (
      city.name.toLowerCase().includes(term) ||
      city.state?.toLowerCase().includes(term) ||
      city.highlight?.toLowerCase().includes(term)
    );
  });

  const sortedCities = [...filteredCities].sort((a, b) => {
    if (!searchTerm.trim()) return 0;
    const term = searchTerm.trim().toLowerCase();
    const aStarts = a.name.toLowerCase().startsWith(term);
    const bStarts = b.name.toLowerCase().startsWith(term);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return 0;
  });

  // Close dropdown and search mode when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
        if (form.destination) {
          setIsSearching(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [form.destination]);

  // Keyboard navigation for search dropdown
  const handleKeyDown = (e) => {
    if (!isDropdownOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsDropdownOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < sortedCities.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : sortedCities.length - 1));
    } else if (e.key === 'Enter') {
      if (isDropdownOpen && sortedCities.length > 0 && sortedCities[activeIndex]) {
        e.preventDefault();
        selectCity(sortedCities[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      if (form.destination) {
        setIsSearching(false);
      }
    }
  };

  const selectCity = (city) => {
    setField('destination', city.name);
    setIsDropdownOpen(false);
    setIsSearching(false);
    setSearchTerm('');
  };

  const handleChangeCity = () => {
    setIsSearching(true);
    setIsDropdownOpen(true);
    setSearchTerm('');
    setActiveIndex(0);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const setField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  };

  const adjustCounter = (field, delta, min, max) => {
    setForm((f) => {
      const current = Number(f[field]) || min;
      const updated = Math.max(min, Math.min(max, current + delta));
      return { ...f, [field]: updated };
    });
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  };

  const toggleInterest = (value) => {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(value)
        ? f.interests.filter((i) => i !== value)
        : [...f.interests, value],
    }));
    if (errors.interests) setErrors((e) => ({ ...e, interests: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.destination) {
      e.destination = 'Please select a destination.';
    } else if (!isCitySupported(form.destination)) {
      e.destination = 'This destination is not yet available for trip planning. Please choose another city.';
    }
    if (form.numberOfDays < 1 || form.numberOfDays > 30)
      e.numberOfDays = 'Days must be between 1 and 30.';
    if (form.travelers < 1 || form.travelers > 20)
      e.travelers = 'Travelers must be between 1 and 20.';
    if (!form.budget || Number(form.budget) <= 0)
      e.budget = 'Please enter a valid budget (₹).';
    if (!form.travelType) e.travelType = 'Please select a travel type.';
    if (form.interests.length === 0)
      e.interests = 'Select at least one interest.';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    // Persist to TripContext and localStorage; clear selectedPlaces if destination changed
    const isNewCity =
      trip.destination &&
      trip.destination.trim().toLowerCase() !== form.destination.trim().toLowerCase();

    setTripPreferences({
      ...form,
      ...(isNewCity ? { selectedPlaces: [] } : {}),
    });
    localStorage.setItem('tripwise_preferences', JSON.stringify(form));
    navigate('/destinations');
  };

  return (
    <div className="plan-trip-page">
      <div className="container">
        {/* ── Stepper Indicator ────────────────────── */}
        <nav className="trip-stepper" aria-label="Trip planning steps">
          <div className="trip-step-item active">
            <span className="trip-step-badge">1</span>
            <span>Preferences</span>
          </div>
          <span className="trip-step-arrow">→</span>
          <div className="trip-step-item">
            <span className="trip-step-badge">2</span>
            <span>Destinations</span>
          </div>
          <span className="trip-step-arrow">→</span>
          <div className="trip-step-item">
            <span className="trip-step-badge">3</span>
            <span>Selected Places</span>
          </div>
          <span className="trip-step-arrow">→</span>
          <div className="trip-step-item">
            <span className="trip-step-badge">4</span>
            <span>Smart Itinerary</span>
          </div>
        </nav>

        {/* ── Header ───────────────────────────────── */}
        <div className="plan-header animate-fade-in-up">
          <div className="badge badge-primary">AI Travel Configuration</div>
          <h1 className="plan-title">Design Your Perfect Journey</h1>
          <p className="plan-subtitle">
            Configure your destination, duration, budget, and travel style to generate a tailored itinerary.
          </p>
        </div>

        {/* ── Main Form Card ───────────────────────── */}
        <form className="plan-form card animate-fade-in-up" onSubmit={handleSubmit} noValidate>
          {/* 1. Destination Field */}
          <div className="plan-section">
            <div className="plan-section-header">
              <h2 className="plan-section-title">
                <span className="plan-sec-num">1</span>
                <span>Select Destination City</span>
              </h2>
              <span className="plan-section-hint">Explore popular travel hubs</span>
            </div>

            {form.destination && !isSearching ? (
              /* Selected City State */
              <div className="selected-city-card" id="selected-city-card">
                <div className="selected-city-left">
                  <div className="selected-city-check-badge" aria-hidden="true">✓</div>
                  <div className="selected-city-avatar">{selectedCity?.icon || '🏙️'}</div>
                  <div className="selected-city-details">
                    <div className="selected-city-name">{selectedCity?.name || form.destination}</div>
                    <div className="selected-city-sub">
                      <span className="selected-city-state">{selectedCity?.state || ''}</span>
                      {selectedCity?.highlight && (
                        <>
                          <span className="selected-city-bullet">•</span>
                          <span className="selected-city-highlight">{selectedCity.highlight}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="change-city-btn"
                  id="btn-change-city"
                  onClick={handleChangeCity}
                  aria-label={`Change destination city from ${form.destination}`}
                >
                  Change City ↻
                </button>
              </div>
            ) : (
              /* Search Field & Dropdown */
              <div className="city-search-container" ref={searchRef}>
                <div className={`city-search-input-wrapper${isDropdownOpen ? ' active-focus' : ''}`}>
                  <span className="city-search-icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                  <input
                    ref={searchInputRef}
                    id="city-search-input"
                    type="text"
                    className="city-search-input"
                    placeholder="Search for a city..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setIsDropdownOpen(true);
                      setActiveIndex(0);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={isDropdownOpen}
                    aria-controls="city-search-dropdown"
                    aria-autocomplete="list"
                    aria-label="Search for a city"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      className="city-search-clear-btn"
                      onClick={() => {
                        setSearchTerm('');
                        searchInputRef.current?.focus();
                      }}
                      aria-label="Clear search text"
                    >
                      ✕
                    </button>
                  )}
                  {form.destination && (
                    <button
                      type="button"
                      className="city-search-cancel-btn"
                      onClick={() => {
                        setIsSearching(false);
                        setIsDropdownOpen(false);
                        setSearchTerm('');
                      }}
                      aria-label="Cancel changing city"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {/* Dropdown Results */}
                {isDropdownOpen && (
                  <div
                    id="city-search-dropdown"
                    className="city-search-dropdown"
                    role="listbox"
                    aria-label="Available destination cities"
                  >
                    <div className="city-dropdown-header">
                      <span>{searchTerm.trim() ? 'Matching Destinations' : 'Available Destinations (10)'}</span>
                      <span className="city-dropdown-header-count">
                        {sortedCities.length} {sortedCities.length === 1 ? 'city' : 'cities'}
                      </span>
                    </div>

                    {sortedCities.length > 0 ? (
                      <div className="city-dropdown-list">
                        {sortedCities.map((city, idx) => {
                          const isSelected = form.destination?.toLowerCase() === city.name.toLowerCase();
                          const isHighlighted = idx === activeIndex;
                          return (
                            <div
                              key={city.id || city.name}
                              id={`city-option-${city.name.toLowerCase()}`}
                              role="option"
                              aria-selected={isSelected}
                              className={`city-dropdown-item${isHighlighted ? ' highlighted' : ''}${isSelected ? ' is-selected' : ''}`}
                              onClick={() => selectCity(city)}
                              onMouseEnter={() => setActiveIndex(idx)}
                            >
                              <span className="city-dropdown-item-icon">{city.icon || '🏙️'}</span>
                              <div className="city-dropdown-item-info">
                                <div className="city-dropdown-item-header">
                                  <span className="city-dropdown-item-name">{city.name}</span>
                                  {isSelected && <span className="city-dropdown-item-badge">✓ Selected</span>}
                                </div>
                                <div className="city-dropdown-item-sub">
                                  <span className="city-dropdown-item-state">{city.state}</span>
                                  <span className="city-dropdown-item-dot">•</span>
                                  <span className="city-dropdown-item-highlight">{city.highlight}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="city-dropdown-empty">
                        <div className="city-empty-icon">🔍</div>
                        <div className="city-empty-title">No cities found</div>
                        <div className="city-empty-sub">Try another city name</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!cityIsSupported && form.destination && (
              <div className="unsupported-city-banner" role="status">
                <div className="unsupported-banner-text">
                  <span className="unsupported-banner-icon" aria-hidden="true">ℹ️</span>
                  <p>
                    Detailed recommendations for <strong>{form.destination}</strong> are coming soon.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleChangeCity}
                  id="btn-choose-another-city"
                >
                  Choose Another City
                </Button>
              </div>
            )}
            {errors.destination && (
              <span className="form-error" role="alert">✕ {errors.destination}</span>
            )}
          </div>

          {/* 2. Duration, Travelers & Budget */}
          <div className="plan-section">
            <div className="plan-section-header">
              <h2 className="plan-section-title">
                <span className="plan-sec-num">2</span>
                <span>Trip Details & Budget</span>
              </h2>
              <span className="plan-section-hint">Set your timeframe and party size</span>
            </div>

            <div className="plan-details-grid">
              {/* Days Counter */}
              <div className="form-group counter-card">
                <label className="form-label" htmlFor="plan-days">
                  🗓️ Duration (Days)
                </label>
                <div className="counter-input-row">
                  <button
                    type="button"
                    className="counter-btn"
                    onClick={() => adjustCounter('numberOfDays', -1, 1, 30)}
                    aria-label="Decrease days"
                  >
                    −
                  </button>
                  <input
                    id="plan-days"
                    type="number"
                    min={1}
                    max={30}
                    className="counter-input"
                    value={form.numberOfDays}
                    onChange={(e) => setField('numberOfDays', Number(e.target.value))}
                  />
                  <button
                    type="button"
                    className="counter-btn"
                    onClick={() => adjustCounter('numberOfDays', 1, 1, 30)}
                    aria-label="Increase days"
                  >
                    +
                  </button>
                </div>
                <span className="counter-subtext">1 to 30 days</span>
                {errors.numberOfDays && (
                  <span className="form-error" role="alert">✕ {errors.numberOfDays}</span>
                )}
              </div>

              {/* Travelers Counter */}
              <div className="form-group counter-card">
                <label className="form-label" htmlFor="plan-travelers">
                  👥 Travelers Count
                </label>
                <div className="counter-input-row">
                  <button
                    type="button"
                    className="counter-btn"
                    onClick={() => adjustCounter('travelers', -1, 1, 20)}
                    aria-label="Decrease travelers"
                  >
                    −
                  </button>
                  <input
                    id="plan-travelers"
                    type="number"
                    min={1}
                    max={20}
                    className="counter-input"
                    value={form.travelers}
                    onChange={(e) => setField('travelers', Number(e.target.value))}
                  />
                  <button
                    type="button"
                    className="counter-btn"
                    onClick={() => adjustCounter('travelers', 1, 1, 20)}
                    aria-label="Increase travelers"
                  >
                    +
                  </button>
                </div>
                <span className="counter-subtext">Adults & Companions</span>
                {errors.travelers && (
                  <span className="form-error" role="alert">✕ {errors.travelers}</span>
                )}
              </div>

              {/* Budget Input & Presets */}
              <div className="form-group budget-card">
                <label className="form-label" htmlFor="plan-budget">
                  💰 Total Budget (₹)
                </label>
                <div className="budget-input-wrap">
                  <span className="currency-prefix">₹</span>
                  <input
                    id="plan-budget"
                    type="number"
                    min={1000}
                    step={1000}
                    placeholder="e.g. 25000"
                    className={`form-input budget-input${errors.budget ? ' error' : ''}`}
                    value={form.budget}
                    onChange={(e) => setField('budget', e.target.value)}
                  />
                </div>

                <div className="budget-presets">
                  {BUDGET_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      className={`preset-pill${form.budget === preset.value ? ' selected' : ''}`}
                      onClick={() => setField('budget', preset.value)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                {errors.budget && (
                  <span className="form-error" role="alert">✕ {errors.budget}</span>
                )}
              </div>
            </div>
          </div>

          {/* 3. Travel Type */}
          <div className="plan-section">
            <div className="plan-section-header">
              <h2 className="plan-section-title">
                <span className="plan-sec-num">3</span>
                <span>Travel Type</span>
              </h2>
              <span className="plan-section-hint">Select the vibe of this trip</span>
            </div>

            <div className="travel-type-grid">
              {TRAVEL_TYPES.map(({ value, icon, label, desc }) => {
                const isSelected = form.travelType === value;
                return (
                  <button
                    key={value}
                    type="button"
                    className={`travel-type-card${isSelected ? ' selected' : ''}`}
                    onClick={() => setField('travelType', value)}
                    aria-pressed={isSelected}
                    id={`travel-${value.toLowerCase()}`}
                  >
                    <div className="travel-type-header">
                      <span className="travel-type-icon">{icon}</span>
                      {isSelected && <span className="type-check-dot">●</span>}
                    </div>
                    <div className="travel-type-label">{label}</div>
                    <p className="travel-type-desc">{desc}</p>
                  </button>
                );
              })}
            </div>
            {errors.travelType && (
              <span className="form-error" role="alert">✕ {errors.travelType}</span>
            )}
          </div>

          {/* 4. Interests & Experiences */}
          <div className="plan-section">
            <div className="plan-section-header">
              <h2 className="plan-section-title">
                <span className="plan-sec-num">4</span>
                <span>Interests & Experiences</span>
              </h2>
              <span className="plan-section-hint">Select all you'd like to explore</span>
            </div>

            <div className="interests-grid">
              {INTERESTS.map(({ value, icon, category }) => {
                const isSelected = form.interests.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    className={`interest-card-chip${isSelected ? ' selected' : ''}`}
                    onClick={() => toggleInterest(value)}
                    aria-pressed={isSelected}
                    id={`interest-${value.toLowerCase()}`}
                  >
                    <span className="interest-icon">{icon}</span>
                    <div className="interest-body">
                      <span className="interest-title">{value}</span>
                      <span className="interest-category">{category}</span>
                    </div>
                    {isSelected && <span className="interest-check">✓</span>}
                  </button>
                );
              })}
            </div>
            {errors.interests && (
              <span className="form-error" role="alert">✕ {errors.interests}</span>
            )}
          </div>

          {/* ── Footer Actions ───────────────────────── */}
          <div className="plan-footer">
            <div className="plan-summary-box">
              <strong>Trip Overview:</strong>
              <span>
                {form.destination || 'Destination'} • {form.numberOfDays} Days • {form.travelers} Travelers • ₹{form.budget || 0} Budget • {form.interests.length} Interests
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="xl"
              id="plan-continue-btn"
            >
              Continue to Select Places →
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PlanTrip;

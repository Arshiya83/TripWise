import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import Button from '../components/Button';
import './PlanTrip.css';

const CITIES = [
  { name: 'Hyderabad', state: 'Telangana', icon: '🏯', highlight: 'Biryani & Royal Forts' },
  { name: 'Goa',       state: 'Goa',       icon: '🏖️', highlight: 'Beaches & Nightlife' },
  { name: 'Jaipur',    state: 'Rajasthan', icon: '🏰', highlight: 'Palaces & Heritage' },
  { name: 'Delhi',     state: 'Delhi NCR', icon: '🕌', highlight: 'Culture & Monuments' },
  { name: 'Mumbai',    state: 'Maharashtra', icon: '🌊', highlight: 'Marine Drive & Vibes' },
];

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
    destination: trip.destination || 'Hyderabad',
    numberOfDays: trip.numberOfDays || 3,
    travelers: trip.travelers || 2,
    budget: trip.budget || '25000',
    travelType: trip.travelType || 'Couple',
    interests: trip.interests?.length > 0 ? trip.interests : ['History', 'Food', 'Culture'],
  });

  const [errors, setErrors] = useState({});

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
    if (!form.destination) e.destination = 'Please select a destination.';
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
    // Persist to TripContext and localStorage
    setTripPreferences(form);
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

            <div className="destination-grid">
              {CITIES.map(({ name, state, icon, highlight }) => {
                const isSelected = form.destination === name;
                return (
                  <button
                    key={name}
                    type="button"
                    className={`destination-card-btn${isSelected ? ' selected' : ''}`}
                    onClick={() => setField('destination', name)}
                    aria-pressed={isSelected}
                    id={`dest-${name.toLowerCase()}`}
                  >
                    <div className="dest-btn-top">
                      <span className="dest-btn-icon">{icon}</span>
                      {isSelected && <span className="dest-check-pill">✓ Selected</span>}
                    </div>
                    <div className="dest-btn-body">
                      <div className="dest-btn-name">{name}</div>
                      <div className="dest-btn-state">{state}</div>
                      <div className="dest-btn-highlight">{highlight}</div>
                    </div>
                  </button>
                );
              })}
            </div>
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

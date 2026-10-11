import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import Button from '../components/Button';
import { buildOrganizedItinerary } from '../services/smartPlannerService';
import './Itinerary.css';

const BUDGET_PRESETS = [10000, 15000, 20000, 30000, 50000];

export default function Itinerary() {
  const navigate = useNavigate();
  const { trip, setTripPreferences } = useTrip();

  const [activeDay, setActiveDay] = useState(1);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Editable local budget for the "Change Budget + Regenerate" feature
  const initialBudget = Number(trip.budget) || 25000;
  const [currentBudget, setCurrentBudget] = useState(initialBudget);
  const [appliedBudget, setAppliedBudget] = useState(initialBudget);

  const currentCity = trip.destination || 'Hyderabad';
  const totalDays = trip.numberOfDays || 3;
  const travelers = trip.travelers || trip.totalTravelers || 2;
  const travelType = trip.travelType || 'Couple';
  const interests = useMemo(
    () => (trip.interests?.length > 0 ? trip.interests : ['Culture', 'History']),
    [trip.interests]
  );
  const selectedPlaces = useMemo(
    () => trip.selectedPlaces || [],
    [trip.selectedPlaces]
  );

  // Build AI-Organized Itinerary using smart planner service
  const generatedPlan = useMemo(() => {
    return buildOrganizedItinerary({
      destination: currentCity,
      numberOfDays: totalDays,
      travelers,
      budget: appliedBudget,
      travelType,
      interests,
      selectedPlaces,
    });
  }, [currentCity, totalDays, travelers, appliedBudget, travelType, interests, selectedPlaces]);

  const daysList = generatedPlan.daysList || [];
  const selectedDayData = daysList.find((d) => d.day === activeDay) || daysList[0] || { activities: [] };
  const budgetPlan = generatedPlan.budgetPlan;

  const budgetHasChanged = currentBudget !== appliedBudget;

  const handleAdjustBudget = (delta) => {
    const next = Math.max(5000, currentBudget + delta);
    setCurrentBudget(next);
  };

  const handleSetPresetBudget = (amount) => {
    setCurrentBudget(amount);
  };

  const handleRegenerateTrip = () => {
    setIsRegenerating(true);
    // Simulate smart recalculation transition
    setTimeout(() => {
      setAppliedBudget(currentBudget);
      setTripPreferences({ budget: String(currentBudget) });
      setIsRegenerating(false);
    }, 600);
  };

  const handleExportPDF = () => {
    setDownloadSuccess(true);
    setTimeout(() => {
      window.print();
      setDownloadSuccess(false);
    }, 400);
  };

  return (
    <div className="itinerary-page">
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
          <Link to="/selected-places" className="trip-step-item completed">
            <span className="trip-step-badge">✓</span>
            <span>Selected ({selectedPlaces.length})</span>
          </Link>
          <span className="trip-step-arrow">→</span>
          <div className="trip-step-item active">
            <span className="trip-step-badge">4</span>
            <span>Smart Itinerary</span>
          </div>
        </nav>

        {/* ── 9. TOP HEADER (AI-GENERATED SMART ITINERARY) ────────────────── */}
        <header className="itin-header card animate-fade-in-up">
          <div className="itin-header-top">
            <div>
              <div className="itin-ai-badge">
                <span className="ai-icon">🤖</span>
                <span>AI-GENERATED SMART ITINERARY</span>
              </div>

              <h1 className="itin-main-title">
                {currentCity.toUpperCase()} TRIP BLUEPRINT
              </h1>

              <div className="itin-summary-tags">
                <span className="summary-tag">🗓️ {totalDays} Days</span>
                <span className="summary-dot">•</span>
                <span className="summary-tag">👥 {travelers} Travelers</span>
                <span className="summary-dot">•</span>
                <span className="summary-tag">💰 ₹{appliedBudget.toLocaleString('en-IN')}</span>
                <span className="summary-dot">•</span>
                <span className="summary-tag">✨ {travelType} Style</span>
                <span className="summary-dot">•</span>
                <span className="summary-tag">🏛️ {selectedPlaces.length} Places Sequenced</span>
              </div>
            </div>

            <div className="itin-header-actions">
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/map')}
                id="btn-route-map"
              >
                🗾 Route Map
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/budget')}
                id="btn-budget-tracker"
              >
                💰 Full Budget
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleExportPDF}
                id="btn-export-pdf"
              >
                📄 Export PDF
              </Button>
            </div>
          </div>

          {downloadSuccess && (
            <div className="itin-toast animate-fade-in">
              ✓ Itinerary formatted for export! Opening print preview…
            </div>
          )}

          {/* ── 14. DESTINATION OVERVIEW ──────────────────────────────────── */}
          <div className="destination-overview-box">
            <div className="overview-label">DESTINATION OVERVIEW</div>
            <p className="overview-copy">
              &ldquo;{generatedPlan.overviewText}&rdquo;
            </p>
          </div>
        </header>

        {/* ── 10 & 11. AI BUDGET OPTIMIZATION & CHANGE BUDGET PANEL ───────── */}
        <section className="budget-optimizer-card card animate-fade-in-up" aria-label="AI Budget Optimization">
          <div className="budget-card-header">
            <div>
              <span className="budget-kicker">AI BUDGET OPTIMIZATION</span>
              <h2 className="budget-card-title">Estimated Trip Expenditure</h2>
            </div>

            {/* Quick Metrics */}
            <div className="budget-spend-metrics">
              <div className="spend-cell">
                <span className="cell-lbl">Total Budget</span>
                <span className="cell-val">₹{appliedBudget.toLocaleString('en-IN')}</span>
              </div>
              <div className="spend-divider" />
              <div className="spend-cell">
                <span className="cell-lbl">Estimated Spend</span>
                <span className="cell-val highlight-spend">
                  ₹{budgetPlan.estimatedSpend.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="spend-divider" />
              <div className="spend-cell">
                <span className="cell-lbl">Remaining Buffer</span>
                <span className={`cell-val ${budgetPlan.remainingBudget < 0 ? 'deficit' : 'surplus'}`}>
                  ₹{budgetPlan.remainingBudget.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown progress bars */}
          <div className="budget-breakdown-grid">
            {budgetPlan.breakdown.map((cat) => (
              <div key={cat.name} className="breakdown-item">
                <div className="breakdown-item-top">
                  <span className="cat-name">
                    {cat.icon} {cat.name}
                  </span>
                  <strong className="cat-cost">
                    ₹{cat.amount.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="breakdown-bar-track">
                  <div
                    className="breakdown-bar-fill"
                    style={{
                      width: cat.percent,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
                <span className="cat-desc">{cat.desc}</span>
              </div>
            ))}
          </div>

          {/* ── 11. CHANGE BUDGET + REGENERATE CONTROLS ───────────────────── */}
          <div className="change-budget-section">
            <div className="change-budget-title-row">
              <span className="change-budget-title">
                Adjust Budget & Regenerate Recommendations:
              </span>
              <span className="budget-rule-hint">
                Selected attractions remain fixed; accommodations & dining tiers dynamically re-adjust.
              </span>
            </div>

            <div className="budget-adjuster-bar">
              <div className="stepper-controls">
                <button
                  type="button"
                  className="budget-step-btn"
                  onClick={() => handleAdjustBudget(-5000)}
                  aria-label="Decrease budget by 5000"
                >
                  −
                </button>
                <span className="current-budget-readout">
                  ₹{currentBudget.toLocaleString('en-IN')}
                </span>
                <button
                  type="button"
                  className="budget-step-btn"
                  onClick={() => handleAdjustBudget(5000)}
                  aria-label="Increase budget by 5000"
                >
                  +
                </button>
              </div>

              {/* Preset buttons */}
              <div className="budget-presets-row">
                {BUDGET_PRESETS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`budget-preset-pill${currentBudget === val ? ' active' : ''}`}
                    onClick={() => handleSetPresetBudget(val)}
                  >
                    ₹{val.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {budgetHasChanged && (
              <div className="budget-changed-banner animate-fade-in">
                <span className="budget-changed-text">
                  Budget adjusted to <strong>₹{currentBudget.toLocaleString('en-IN')}</strong>.
                </span>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleRegenerateTrip}
                  disabled={isRegenerating}
                  id="btn-regenerate-trip"
                >
                  {isRegenerating ? 'Recalculating…' : '🤖 Regenerate Smart Trip'}
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* ── 9. DAY TABS & DETAILED DAY ROUTE ────────────────────────────── */}
        <section className="itin-schedule-section" aria-label="Day by Day Itinerary">
          {/* Day Selector Tabs */}
          <div className="itin-days-bar card">
            <div className="itin-days-tabs">
              {daysList.map((d) => (
                <button
                  key={d.day}
                  type="button"
                  className={`itin-day-tab${activeDay === d.day ? ' active' : ''}`}
                  onClick={() => setActiveDay(d.day)}
                >
                  <span className="day-tab-num">Day {d.day}</span>
                  <span className="day-tab-theme">{d.theme}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Day Activities Timeline */}
          <div className="itin-timeline-card card animate-fade-in">
            <div className="timeline-day-header">
              <div>
                <span className="badge badge-primary">DAY {selectedDayData.day} SCHEDULE</span>
                <h3 className="timeline-day-theme">{selectedDayData.theme}</h3>
              </div>
              <span className="timeline-stops-count">
                {selectedDayData.activities?.length || 0} Scheduled Stops
              </span>
            </div>

            <div className="itin-timeline">
              {selectedDayData.activities?.map((act, idx) => (
                <div key={idx} className="itin-activity-block">
                  {/* Timeline connector dot */}
                  <div className="activity-timeline-marker">
                    <span className="marker-icon">{act.icon}</span>
                    {idx < selectedDayData.activities.length - 1 && (
                      <div className="marker-line" />
                    )}
                  </div>

                  {/* Activity Details Card */}
                  <div className="activity-card">
                    <div className="activity-card-header">
                      <span className="activity-time-pill">{act.time}</span>
                      <span className="activity-category-tag">{act.category}</span>
                      {act.entryFee && (
                        <span className="activity-fee-tag">🎟️ {act.entryFee}</span>
                      )}
                      <span className="activity-duration">⏱ {act.duration}</span>
                    </div>

                    <h4 className="activity-title">{act.title}</h4>
                    <p className="activity-desc">{act.description}</p>

                    {act.transitAfter && (
                      <div className="activity-transit-indicator">
                        <span className="transit-icon">↳</span>
                        <span>{act.transitAfter}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 12 & 13. SMART BUDGET-SAVING SUGGESTIONS & TRAVEL TIPS ──────── */}
        <div className="itin-advice-grid">
          {/* 12. Smart Budget-Saving Suggestions */}
          <section className="advice-card card" aria-label="Smart Budget Saving Suggestions">
            <div className="advice-card-header">
              <span className="advice-header-icon">💡</span>
              <h3 className="advice-title">Smart Budget-Saving Suggestions</h3>
            </div>
            <ul className="advice-list">
              {generatedPlan.budgetSavingSuggestions.map((sug, i) => (
                <li key={i} className="advice-item">
                  <span className="bullet-point">•</span>
                  <span>{sug}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 13. Practical Travel Tips */}
          <section className="advice-card card" aria-label="Practical Travel Tips">
            <div className="advice-card-header">
              <span className="advice-header-icon">✈</span>
              <h3 className="advice-title">Travel Tips for {currentCity}</h3>
            </div>
            <ul className="advice-list">
              {generatedPlan.travelTips.map((tip, i) => (
                <li key={i} className="advice-item">
                  <span className="bullet-point">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* ── Bottom Navigation & Confirmation ───────────────────────────── */}
        <div className="itin-footer-actions card">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/selected-places')}
            id="btn-edit-selected-places"
          >
            ← Modify Selected Places
          </Button>

          <div className="itin-footer-right">
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/hotels')}
              id="btn-view-hotels"
            >
              🏨 View Recommended Stays
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/trip-summary')}
              id="btn-view-trip-summary"
            >
              Review Full Trip Blueprint →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import Button from '../components/Button';
import { buildOrganizedItinerary } from '../services/smartPlannerService';
import { generateAndDownloadTripPDF } from '../services/pdfExportService';
import { calculateTripBudget } from '../utils/budgetEngine';
import './Itinerary.css';

const BUDGET_PRESETS = [10000, 15000, 20000, 30000, 50000];

export default function Itinerary() {
  const navigate = useNavigate();
  const { trip, setTripPreferences } = useTrip();

  const [activeDay, setActiveDay] = useState(1);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [pdfToast, setPdfToast] = useState('');
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
      selectedRestaurants: trip.selectedRestaurants || [],
      selectedHotel: trip.selectedHotels?.[0] || null,
      accommodationPricingMode: trip.accommodationPricingMode || 'auto',
      manualAccommodationCost: trip.manualAccommodationCost,
    });
  }, [
    currentCity,
    totalDays,
    travelers,
    appliedBudget,
    travelType,
    interests,
    selectedPlaces,
    trip.selectedRestaurants,
    trip.selectedHotels,
    trip.accommodationPricingMode,
    trip.manualAccommodationCost,
  ]);

  const daysList = useMemo(() => {
    if (trip.itinerary) {
      if (Array.isArray(trip.itinerary) && trip.itinerary.length > 0) {
        return trip.itinerary.map((d) => ({
          day: Number(d.day) || 1,
          theme: d.theme || d.title || `Day ${d.day || 1}`,
          activities: (d.activities || []).map((a) => ({
            time: a.time || '',
            title: a.title || a.placeName || 'Activity',
            placeName: a.placeName || a.title || 'Activity',
            description: a.description || '',
            category: a.category || 'Sightseeing',
            entryFee: a.entryFee || (a.estimatedCost ? `₹${a.estimatedCost}` : ''),
            duration: a.duration || '2 hours',
            icon: a.icon || '📍',
            transitAfter: a.transitAfter || '',
          })),
        }));
      }
      if (Array.isArray(trip.itinerary.daysList) && trip.itinerary.daysList.length > 0) {
        return trip.itinerary.daysList;
      }
    }
    return generatedPlan.daysList || [];
  }, [trip.itinerary, generatedPlan.daysList]);

  const selectedDayData = daysList.find((d) => d.day === activeDay) || daysList[0] || { activities: [] };

  // Normalize budgetPlan to guarantee breakdown array is always populated and valid
  const budgetPlan = useMemo(() => {
    // 1. Authoritative calculation from unified engine with all active parameters
    const calc = calculateTripBudget({
      budget: appliedBudget,
      numberOfDays: totalDays,
      travelers,
      selectedHotel: trip.selectedHotels?.[0] || null,
      selectedHotels: trip.selectedHotels || [],
      selectedRestaurants: trip.selectedRestaurants || [],
      selectedPlaces,
      destination: currentCity,
      travelType,
      accommodationPricingMode: trip.accommodationPricingMode || 'auto',
      manualAccommodationCost: trip.manualAccommodationCost,
    });

    if (calc && Array.isArray(calc.breakdown) && calc.breakdown.length > 0) {
      return calc;
    }

    // 2. If trip.budgetPlan exists as an itemized object (from MongoDB, TripSummary or API)
    if (trip.budgetPlan && typeof trip.budgetPlan === 'object') {
      const b = trip.budgetPlan;
      const acc = Number(b.accommodation) || Math.round(appliedBudget * 0.38);
      const food = Number(b.food) || Math.round(appliedBudget * 0.26);
      const trans = Number(b.transport) || Math.round(appliedBudget * 0.16);
      const act = Number(b.activities) || Math.round(appliedBudget * 0.12);
      const misc = Number(b.misc || b.shopping) || Math.round(appliedBudget * 0.08);
      const estSpend = Number(b.estimatedSpend || b.estimatedTotal) || (acc + food + trans + act + misc);
      const rem = Number(b.remainingBudget !== undefined ? b.remainingBudget : b.remaining) || (appliedBudget - estSpend);

      return {
        totalBudget: Number(b.totalBudget) || appliedBudget,
        estimatedSpend: estSpend,
        remainingBudget: rem,
        breakdown: [
          { name: 'Accommodation', icon: '🏨', amount: acc, percent: `${Math.round((acc / appliedBudget) * 100)}%`, color: '#3b82f6', desc: 'Stay & lodging' },
          { name: 'Food & Drinks', icon: '🍽️', amount: food, percent: `${Math.round((food / appliedBudget) * 100)}%`, color: '#0284c7', desc: 'Meals & dining' },
          { name: 'Local Transport', icon: '🚗', amount: trans, percent: `${Math.round((trans / appliedBudget) * 100)}%`, color: '#8b5cf6', desc: 'Cabs & transit' },
          { name: 'Activities & Entry Fees', icon: '🎟️', amount: act, percent: `${Math.round((act / appliedBudget) * 100)}%`, color: '#f59e0b', desc: 'Attraction tickets' },
          { name: 'Shopping / Misc', icon: '🛍️', amount: misc, percent: `${Math.round((misc / appliedBudget) * 100)}%`, color: '#10b981', desc: 'Contingency & buffer' },
        ],
      };
    }

    // 3. Fallback to generatedPlan's budgetPlan if it has a breakdown array
    if (generatedPlan?.budgetPlan && Array.isArray(generatedPlan.budgetPlan.breakdown)) {
      return generatedPlan.budgetPlan;
    }

    // 4. Safe default empty structure
    return {
      totalBudget: appliedBudget,
      estimatedSpend: appliedBudget,
      remainingBudget: 0,
      breakdown: [],
    };
  }, [
    appliedBudget,
    totalDays,
    travelers,
    trip.selectedHotels,
    trip.selectedRestaurants,
    selectedPlaces,
    currentCity,
    travelType,
    trip.accommodationPricingMode,
    trip.manualAccommodationCost,
    trip.budgetPlan,
    generatedPlan?.budgetPlan,
  ]);

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
    // Recalculate and update trip preferences with new budget and regenerated plan
    setTimeout(() => {
      setAppliedBudget(currentBudget);
      setTripPreferences({
        budget: String(currentBudget),
        itinerary: generatedPlan.daysList,
      });
      setIsRegenerating(false);
    }, 600);
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    setPdfToast('');
    try {
      const tripData = {
        destination: currentCity,
        numberOfDays: totalDays,
        travelers,
        travelType,
        budget: appliedBudget,
        interests,
        selectedPlaces,
        itinerary: daysList,
        budgetBreakdown: budgetPlan,
        selectedHotels: trip.selectedHotels,
        selectedRestaurants: trip.selectedRestaurants,
      };

      const res = await generateAndDownloadTripPDF(tripData, {
        tripRefId: 'ITIN',
      });
      setPdfToast(`✓ PDF itinerary downloaded: ${res.filename}`);
      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
        setPdfToast('');
      }, 5000);
    } catch (err) {
      console.warn('PDF export fallback:', err);
      window.print();
    } finally {
      setIsExportingPDF(false);
    }
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
                disabled={isExportingPDF}
                id="btn-export-pdf"
              >
                {isExportingPDF ? 'Generating PDF…' : '📄 Export PDF'}
              </Button>
            </div>
          </div>

          {downloadSuccess && (
            <div className="itin-toast animate-fade-in">
              {pdfToast || '✓ Itinerary formatted for export! Opening print preview…'}
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
                  ₹{(budgetPlan?.estimatedSpend ?? 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="spend-divider" />
              <div className="spend-cell">
                <span className="cell-lbl">Remaining Buffer</span>
                <span className={`cell-val ${(budgetPlan?.remainingBudget ?? 0) < 0 ? 'deficit' : 'surplus'}`}>
                  ₹{(budgetPlan?.remainingBudget ?? 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown progress bars */}
          <div className="budget-breakdown-grid">
            {(budgetPlan?.breakdown || []).map((cat) => (
              <div key={cat.name} className="breakdown-item">
                <div className="breakdown-item-top">
                  <span className="cat-name">
                    {cat.icon} {cat.name}
                  </span>
                  <strong className="cat-cost">
                    ₹{(cat.amount ?? 0).toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="breakdown-bar-track">
                  <div
                    className="breakdown-bar-fill"
                    style={{
                      width: cat.percent || '20%',
                      backgroundColor: cat.color || '#3b82f6',
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
              {(selectedDayData?.activities || []).map((act, idx) => (
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

                    <h4 className="activity-title">{act.title || act.placeName}</h4>
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

          {/* Unscheduled Dining Selections (When user selected more restaurants than daily meal slots) */}
          {generatedPlan?.unscheduledRestaurants?.length > 0 && (
            <div className="unscheduled-dining-card card animate-fade-in" style={{ marginTop: '1.25rem', borderLeft: '4px solid #f59e0b', padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>🍽️</span>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>Additional Selected Dining (Flexible & Spontaneous Stops)</h4>
              </div>
              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                You selected {generatedPlan.unscheduledRestaurants.length} more restaurant{generatedPlan.unscheduledRestaurants.length > 1 ? 's' : ''} than the {totalDays * 2} main meal slots available in your {totalDays}-day schedule. These remain part of your trip plan:
              </p>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {generatedPlan.unscheduledRestaurants.map((rest, rIdx) => (
                  <div key={rIdx} style={{ background: 'var(--surface-color, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '6px', padding: '0.6rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <strong style={{ fontSize: '0.92rem' }}>{rest.name}</strong>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                        ({rest.cuisine || 'Regional'} • {rest.location || currentCity})
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#b45309', background: '#fef3c7', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      Flexible Stop
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
              {(generatedPlan?.budgetSavingSuggestions || []).map((sug, i) => (
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
              {(generatedPlan?.travelTips || []).map((tip, i) => (
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

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import Button from '../components/Button';
import { calculateTripBudget } from '../utils/budgetEngine';
import { getHotelsByDestination, getRestaurantsByDestination } from '../data/mockData';
import './BudgetPage.css';

function BudgetPage() {
  const navigate = useNavigate();
  const { trip, setTripPreferences } = useTrip();

  const userBudget = Number(trip.budget) || 30000;
  const [budgetVal, setBudgetVal] = useState(userBudget);

  const currentCity = trip.destination || 'Hyderabad';
  const travelers = trip.travelers || trip.totalTravelers || 2;
  const days = trip.numberOfDays || 3;
  const selectedPlaces = useMemo(() => trip.selectedPlaces || [], [trip.selectedPlaces]);

  // Resolve selected hotel and restaurants
  const selectedHotel = useMemo(() => {
    if (Array.isArray(trip.selectedHotels) && trip.selectedHotels.length > 0) {
      const h = trip.selectedHotels[0];
      if (typeof h === 'object' && h.name) return h;
      const cityHotels = getHotelsByDestination(currentCity);
      return cityHotels.find((item) => item.id === h || item.name?.toLowerCase() === String(h).toLowerCase()) || null;
    }
    return null;
  }, [trip.selectedHotels, currentCity]);

  const selectedRestaurants = useMemo(() => {
    if (Array.isArray(trip.selectedRestaurants) && trip.selectedRestaurants.length > 0) {
      const cityRests = getRestaurantsByDestination(currentCity);
      return trip.selectedRestaurants.map((r) => {
        if (typeof r === 'object' && r.name) return r;
        return cityRests.find((item) => item.id === r || item.name?.toLowerCase() === String(r).toLowerCase()) || null;
      }).filter(Boolean);
    }
    return [];
  }, [trip.selectedRestaurants, currentCity]);

  // Authoritative calculations from single source of truth
  const budgetCalculations = useMemo(() => {
    return calculateTripBudget({
      budget: budgetVal,
      numberOfDays: days,
      travelers,
      selectedHotel,
      selectedRestaurants,
      selectedPlaces,
      destination: currentCity,
      travelType: trip.travelType || 'Couple',
      accommodationPricingMode: trip.accommodationPricingMode || 'auto',
      manualAccommodationCost: trip.manualAccommodationCost,
    });
  }, [
    budgetVal,
    days,
    travelers,
    selectedHotel,
    selectedRestaurants,
    selectedPlaces,
    currentCity,
    trip.travelType,
    trip.accommodationPricingMode,
    trip.manualAccommodationCost,
  ]);

  const totalEstimatedCost = budgetCalculations.totalEstimatedSpend;
  const remainingBudget = budgetCalculations.remainingBudget;
  const spentPercent = budgetCalculations.utilizationPercent;
  const isOverBudget = budgetCalculations.isOverBudget;
  const shortfall = budgetCalculations.shortfall;

  // Determine budget status
  let budgetStatus = 'within';
  let statusText = 'Within Budget — Balanced Travel Plan';
  let statusBadgeClass = 'badge-within';

  if (isOverBudget) {
    budgetStatus = 'over';
    statusText = `Over Budget by ₹${shortfall.toLocaleString('en-IN')} — Adjustment Recommended`;
    statusBadgeClass = 'badge-over';
  } else if (remainingBudget < budgetVal * 0.1) {
    budgetStatus = 'near';
    statusText = 'Near Budget Limit — Moderate Daily Spending';
    statusBadgeClass = 'badge-near';
  }

  const handleUpdateBudget = (newVal) => {
    const safeVal = Math.max(5000, newVal);
    setBudgetVal(safeVal);
    setTripPreferences({ budget: String(safeVal) });
  };

  const CATEGORIES = budgetCalculations.breakdown;

  return (
    <div className="budget-page">
      <div className="container">
        {/* ── Header ───────────────────────────────── */}
        <div className="budget-header animate-fade-in-up">
          <div className="budget-header-top">
            <div>
              <span className={`status-pill ${statusBadgeClass}`}>
                ● {statusText}
              </span>
              <h1 className="budget-title">Trip Budget Estimator</h1>
              <p className="budget-subtitle">
                Comprehensive expense forecasting for your {days}-day trip to {currentCity} ({travelers} travelers).
              </p>
            </div>

            <div className="budget-header-actions">
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/itinerary')}
                id="btn-back-itinerary"
              >
                ← Back to Itinerary
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/hotels')}
                id="btn-browse-hotels"
              >
                Browse Hotels →
              </Button>
            </div>
          </div>

          {/* Budget Overview Cards */}
          <div className="budget-summary-banner card">
            <div className="banner-metric">
              <span className="banner-label">Total Allocated Budget</span>
              <div className="banner-val">₹{budgetVal.toLocaleString('en-IN')}</div>
              <div className="budget-quick-adjust">
                <button
                  type="button"
                  className="adjust-pill"
                  onClick={() => handleUpdateBudget(budgetVal - 5000)}
                  disabled={budgetVal <= 5000}
                >
                  − ₹5k
                </button>
                <button
                  type="button"
                  className="adjust-pill"
                  onClick={() => handleUpdateBudget(budgetVal + 5000)}
                >
                  + ₹5k
                </button>
              </div>
            </div>

            <div className="banner-divider" />

            <div className="banner-metric">
              <span className="banner-label">Total Estimated Cost</span>
              <div className="banner-val font-spent">₹{totalEstimatedCost.toLocaleString('en-IN')}</div>
              <span className="banner-sub">{spentPercent}% of total allocated</span>
            </div>

            <div className="banner-divider" />

            <div className="banner-metric">
              <span className="banner-label">Remaining Safe Balance</span>
              <div className={`banner-val ${remainingBudget >= 0 ? 'font-safe' : 'font-danger'}`}>
                ₹{remainingBudget.toLocaleString('en-IN')}
              </div>
              <span className="banner-sub">
                {remainingBudget >= 0 ? 'Available for emergency or shopping' : 'Over estimated budget'}
              </span>
            </div>
          </div>

          {/* Progress Bar Gauge */}
          <div className="budget-progress-wrap card">
            <div className="progress-labels">
              <span>Budget Utilisation</span>
              <span><strong>{spentPercent}%</strong> Allocated</span>
            </div>
            <div className="progress-track">
              <div
                className={`progress-fill ${budgetStatus}`}
                style={{ width: `${spentPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Shortfall Warning & Alternatives (When Over Budget) ── */}
        {isOverBudget && (
          <div className="budget-over-warning card animate-fade-in" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: '#ef4444', marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <h3 style={{ color: '#ef4444', margin: 0, fontSize: '1.15rem' }}>
                Trip Plan Exceeds Budget by ₹{shortfall.toLocaleString('en-IN')}
              </h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 1rem 0', fontSize: '0.92rem' }}>
              Your selected accommodation, dining stops, and activities require more than your ₹{budgetVal.toLocaleString('en-IN')} budget cap. TripWise recommends the following adjustments:
            </p>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {budgetCalculations.budgetAlternatives.map((alt, idx) => (
                <div key={idx} style={{ background: 'var(--surface-color, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>{alt.title}</strong>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{alt.description}</p>
                  </div>
                  {alt.type === 'budget' && (
                    <Button size="sm" variant="primary" onClick={() => handleUpdateBudget(totalEstimatedCost)}>
                      Adjust Budget to ₹{totalEstimatedCost.toLocaleString('en-IN')}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Expense Breakdown Grid ───────────────── */}
        <div className="budget-breakdown-grid">
          {CATEGORIES.map((cat) => (
            <div key={cat.id} className="budget-cat-card card card-hover">
              <div className="cat-header">
                <span className="cat-icon-bubble" style={{ color: cat.color }}>
                  {cat.icon}
                </span>
                <span className="cat-percent-badge">{cat.percent}</span>
              </div>
              <h3 className="cat-name">{cat.name}</h3>
              <div className="cat-amount">₹{cat.amount.toLocaleString('en-IN')}</div>
              <p className="cat-desc">{cat.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Cost Saving Tips ─────────────────────── */}
        <div className="budget-tips-banner card">
          <div className="tips-icon">💡</div>
          <div className="tips-content">
            <h4 className="tips-title">TripWise Budget Smart Tips</h4>
            <ul className="tips-list">
              <li>Book palace & fort entry tickets online in advance to bypass peak line surcharges.</li>
              <li>Local metro & app cabs in {currentCity} average 40% cheaper than tourist street taxis.</li>
              <li>Grouping nearby sights together in the morning saves up to ₹800/day in transit fares.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BudgetPage;

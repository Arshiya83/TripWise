import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import Button from '../components/Button';
import './BudgetPage.css';

function BudgetPage() {
  const navigate = useNavigate();
  const { trip, setTripPreferences } = useTrip();

  const userBudget = Number(trip.budget) || 30000;
  const [budgetVal, setBudgetVal] = useState(userBudget);

  const currentCity = trip.destination || 'Hyderabad';
  const travelers = trip.travelers || 2;
  const days = trip.numberOfDays || 3;

  // Breakdown calculations
  const accommodationCost = Math.round(budgetVal * 0.38);
  const foodCost = Math.round(budgetVal * 0.24);
  const transportCost = Math.round(budgetVal * 0.16);
  const entryFeesCost = Math.round(budgetVal * 0.08);
  const miscCost = Math.round(budgetVal * 0.06);

  const totalEstimatedCost =
    accommodationCost + foodCost + transportCost + entryFeesCost + miscCost;
  const remainingBudget = budgetVal - totalEstimatedCost;
  const spentPercent = Math.min(100, Math.round((totalEstimatedCost / budgetVal) * 100));

  // Determine budget status
  let budgetStatus = 'within';
  let statusText = 'Within Budget — Balanced Travel Plan';
  let statusBadgeClass = 'badge-within';

  if (remainingBudget < 0) {
    budgetStatus = 'over';
    statusText = 'Over Budget — Consider Adjusting Stay or Activities';
    statusBadgeClass = 'badge-over';
  } else if (remainingBudget < budgetVal * 0.12) {
    budgetStatus = 'near';
    statusText = 'Near Budget Limit — Moderate Daily Spending';
    statusBadgeClass = 'badge-near';
  }

  const handleUpdateBudget = (newVal) => {
    setBudgetVal(newVal);
    setTripPreferences({ budget: String(newVal) });
  };

  const CATEGORIES = [
    {
      id: 'acc',
      name: 'Accommodation',
      icon: '🏨',
      amount: accommodationCost,
      percent: '38%',
      desc: `${days - 1} nights hotel stay for ${travelers} guests`,
      color: '#0d9488',
    },
    {
      id: 'food',
      name: 'Food & Dining',
      icon: '🍽️',
      amount: foodCost,
      percent: '24%',
      desc: `Breakfast, lunches & iconic heritage dinners for ${days} days`,
      color: '#0284c7',
    },
    {
      id: 'trans',
      name: 'Transportation',
      icon: '🚗',
      amount: transportCost,
      percent: '16%',
      desc: 'Local cabs, metro & inter-attraction transfers',
      color: '#8b5cf6',
    },
    {
      id: 'fees',
      name: 'Entry Fees & Tickets',
      icon: '🎟️',
      amount: entryFeesCost,
      percent: '8%',
      desc: 'Monuments, museum passes & boat ride fees',
      color: '#f59e0b',
    },
    {
      id: 'misc',
      name: 'Miscellaneous & Shopping',
      icon: '🛍️',
      amount: miscCost,
      percent: '6%',
      desc: 'Souvenirs, tea stops & emergency reserves',
      color: '#10b981',
    },
  ];

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
              >
                ← Back to Itinerary
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/hotels')}
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
                  disabled={budgetVal <= 10000}
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

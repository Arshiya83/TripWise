import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import Button from '../components/Button';
import { SAMPLE_ITINERARY } from '../data/mockData';
import './Itinerary.css';

function Itinerary() {
  const navigate = useNavigate();
  const { trip } = useTrip();

  const [activeDay, setActiveDay] = useState(1);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const currentCity = trip.destination || 'Hyderabad';
  const totalDays = trip.numberOfDays || 3;

  // Use sample itinerary or repeat dynamically based on numberOfDays
  const daysList = SAMPLE_ITINERARY.slice(0, Math.min(totalDays, SAMPLE_ITINERARY.length));
  if (daysList.length === 0) {
    daysList.push(SAMPLE_ITINERARY[0]);
  }

  const selectedDayData = daysList.find((d) => d.day === activeDay) || daysList[0];

  const handleExportPDF = () => {
    setDownloadSuccess(true);
    setTimeout(() => {
      window.print();
      setDownloadSuccess(false);
    }, 500);
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
            <span>Selected</span>
          </Link>
          <span className="trip-step-arrow">→</span>
          <div className="trip-step-item active">
            <span className="trip-step-badge">4</span>
            <span>Smart Itinerary</span>
          </div>
        </nav>

        {/* ── Header ───────────────────────────────── */}
        <div className="itin-header animate-fade-in-up">
          <div className="itin-header-top">
            <div>
              <div className="itin-meta-pill">
                <span>📍 {currentCity}</span>
                <span>•</span>
                <span>🗓️ {totalDays} Days Plan</span>
                <span>•</span>
                <span>👥 {trip.travelers || 2} Travelers</span>
              </div>
              <h1 className="itin-title">Your AI-Optimized Itinerary</h1>
              <p className="itin-subtitle">
                Carefully scheduled by proximity to maximize sightseeing time and minimize commute delays.
              </p>
            </div>

            <div className="itin-header-actions">
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/map')}
              >
                🗾 View Route Map
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/budget')}
              >
                💰 Budget Tracker
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleExportPDF}
              >
                📄 Export PDF
              </Button>
            </div>
          </div>

          {downloadSuccess && (
            <div className="itin-toast animate-fade-in">
              ✓ Itinerary ready! Opening print preview…
            </div>
          )}

          {/* Day Tabs */}
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

            <div className="itin-day-summary">
              <span className="summary-pill">⚡ {selectedDayData.activities.length} Stops</span>
              <span className="summary-pill">🚗 ~52 mins transit</span>
              <span className="summary-pill">🚶 8,400 est. steps</span>
            </div>
          </div>
        </div>

        {/* ── Timeline Section ─────────────────────── */}
        <div className="itin-content-grid">
          <div className="itin-timeline-card card">
            <div className="itin-timeline-header">
              <div className="timeline-day-title">
                <h2>Day {selectedDayData.day}: {selectedDayData.theme}</h2>
                <p>Follow this smart chronological sequence for an optimal visit.</p>
              </div>
            </div>

            <div className="timeline-container">
              {selectedDayData.activities.map((act, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-rail">
                    <div className="timeline-icon-wrap">
                      <span className="timeline-icon">{act.icon}</span>
                    </div>
                    {index < selectedDayData.activities.length - 1 && (
                      <div className="timeline-line" />
                    )}
                  </div>

                  <div className="timeline-item-body">
                    <div className="timeline-time-row">
                      <span className="timeline-time">{act.time}</span>
                      <span className="badge badge-primary">{act.category}</span>
                      <span className="timeline-duration">⏱️ {act.duration}</span>
                    </div>

                    <h3 className="timeline-act-title">{act.title}</h3>
                    <div className="timeline-place-tag">📍 {act.placeName}</div>
                    <p className="timeline-desc">{act.description}</p>

                    {act.transitAfter && (
                      <div className="timeline-transit-box">
                        <span className="transit-icon">↳</span>
                        <span>{act.transitAfter}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Quick Navigation & Helpful Tips */}
          <aside className="itin-sidebar">
            <div className="itin-sidebar-card card">
              <h3 className="itin-side-title">Trip Management</h3>

              <div className="itin-side-links">
                <Link to="/map" className="itin-side-link">
                  <span className="side-icon">🗾</span>
                  <div>
                    <strong>Interactive Route Map</strong>
                    <p>Visualise road waypoints and pins</p>
                  </div>
                  <span className="side-arrow">→</span>
                </Link>

                <Link to="/budget" className="itin-side-link">
                  <span className="side-icon">💰</span>
                  <div>
                    <strong>Budget Breakdown</strong>
                    <p>Track stay, food & activity costs</p>
                  </div>
                  <span className="side-arrow">→</span>
                </Link>

                <Link to="/hotels" className="itin-side-link">
                  <span className="side-icon">🏨</span>
                  <div>
                    <strong>Hotel Recommendations</strong>
                    <p>Nearby stays around Day {activeDay} stops</p>
                  </div>
                  <span className="side-arrow">→</span>
                </Link>

                <Link to="/restaurants" className="itin-side-link">
                  <span className="side-icon">🍽️</span>
                  <div>
                    <strong>Iconic Dining Picks</strong>
                    <p>Taste celebrated local dishes</p>
                  </div>
                  <span className="side-arrow">→</span>
                </Link>

                <Link to="/trip-summary" className="itin-side-link">
                  <span className="side-icon">📋</span>
                  <div>
                    <strong>Final Trip Summary</strong>
                    <p>Complete trip overview & saving</p>
                  </div>
                  <span className="side-arrow">→</span>
                </Link>
              </div>

              <div className="itin-note-box">
                <span className="note-icon">💡</span>
                <p>
                  Tip: You can reorder stops or adjust timing anytime before finalizing your trip.
                </p>
              </div>

              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={() => navigate('/trip-summary')}
              >
                Review & Save Trip →
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Itinerary;

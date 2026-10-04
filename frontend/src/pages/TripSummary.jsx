import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import Button from '../components/Button';
import { DESTINATION_PLACES, SAMPLE_ITINERARY, MOCK_HOTELS, MOCK_RESTAURANTS } from '../data/mockData';
import './TripSummary.css';

function TripSummary() {
  const navigate = useNavigate();
  const { trip } = useTrip();

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [tripRefId] = useState(() => Math.floor(100000 + Math.random() * 900000));

  const currentCity = trip.destination || 'Hyderabad';
  const days = trip.numberOfDays || 3;
  const travelers = trip.travelers || 2;
  const budget = Number(trip.budget) || 25000;

  const cityPlaces = DESTINATION_PLACES.filter(
    (p) => p.city.toLowerCase() === currentCity.toLowerCase()
  );
  const places = trip.selectedPlaces?.length > 0 ? trip.selectedPlaces : cityPlaces.slice(0, 4);

  const sampleHotel = MOCK_HOTELS.find((h) => h.city.toLowerCase() === currentCity.toLowerCase()) || MOCK_HOTELS[0];
  const sampleRestaurants = MOCK_RESTAURANTS.filter((r) => r.city.toLowerCase() === currentCity.toLowerCase()).slice(0, 2);

  const handleSaveTrip = () => {
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3500);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="trip-summary-page">
      <div className="container">
        {/* ── Header ───────────────────────────────── */}
        <div className="summary-header animate-fade-in-up">
          <div className="summary-header-top">
            <div>
              <div className="summary-badge-pill">
                <span>✨ Ready to Travel</span>
                <span>•</span>
                <span>Ref: TW-{tripRefId}</span>
              </div>
              <h1 className="summary-title">Complete Trip Blueprint</h1>
              <p className="summary-subtitle">
                Review your final travel plan for {currentCity} before embarking on your journey.
              </p>
            </div>

            <div className="summary-header-actions">
              <Button
                variant="outline"
                size="md"
                onClick={handleExportPDF}
              >
                📄 Export PDF
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSaveTrip}
                id="summary-save-btn"
              >
                💾 Save Trip Plan
              </Button>
            </div>
          </div>

          {savedSuccess && (
            <div className="summary-toast animate-fade-in">
              🎉 <strong>Trip Saved Successfully!</strong> Your trip to {currentCity} is stored in your Dashboard & Saved Trips.
            </div>
          )}

          {/* Quick Metrics Cards */}
          <div className="summary-metrics-grid">
            <div className="sum-metric-card card">
              <span className="sum-m-icon">📍</span>
              <span className="sum-m-label">Destination</span>
              <strong className="sum-m-val">{currentCity}</strong>
            </div>
            <div className="sum-metric-card card">
              <span className="sum-m-icon">🗓️</span>
              <span className="sum-m-label">Duration</span>
              <strong className="sum-m-val">{days} Days</strong>
            </div>
            <div className="sum-metric-card card">
              <span className="sum-m-icon">👥</span>
              <span className="sum-m-label">Travelers</span>
              <strong className="sum-m-val">{travelers} Guests</strong>
            </div>
            <div className="sum-metric-card card">
              <span className="sum-m-icon">🎯</span>
              <span className="sum-m-label">Travel Type</span>
              <strong className="sum-m-val">{trip.travelType || 'Couple'}</strong>
            </div>
            <div className="sum-metric-card card">
              <span className="sum-m-icon">💰</span>
              <span className="sum-m-label">Total Budget</span>
              <strong className="sum-m-val font-teal">₹{budget.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>

        {/* ── Content Sections ─────────────────────── */}
        <div className="summary-layout-grid">
          <div className="summary-main-col">
            {/* 1. Selected Places Overview */}
            <div className="summary-card card">
              <div className="card-sec-head">
                <h2 className="card-sec-title">📍 Selected Attractions ({places.length})</h2>
                <Link to="/destinations" className="edit-link">Edit Places →</Link>
              </div>

              <div className="summary-places-list">
                {places.map((place, idx) => (
                  <div key={place.id} className="sum-place-item">
                    <span className="sum-place-num">{idx + 1}</span>
                    <img src={place.image} alt={place.name} className="sum-place-img" />
                    <div className="sum-place-body">
                      <h4>{place.name}</h4>
                      <p>📍 {place.location} • ⏱️ {place.duration} • 🎟️ {place.entryFee}</p>
                    </div>
                    <span className="badge badge-primary">{place.category}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Itinerary Schedule Outline */}
            <div className="summary-card card">
              <div className="card-sec-head">
                <h2 className="card-sec-title">📅 Daily Itinerary Outline</h2>
                <Link to="/itinerary" className="edit-link">View Full Timeline →</Link>
              </div>

              <div className="summary-days-list">
                {SAMPLE_ITINERARY.slice(0, Math.min(days, 3)).map((d) => (
                  <div key={d.day} className="sum-day-row">
                    <div className="sum-day-badge">Day {d.day}</div>
                    <div className="sum-day-body">
                      <h4>{d.theme}</h4>
                      <div className="sum-day-stops">
                        {d.activities.map((act, i) => (
                          <span key={i} className="sum-stop-pill">
                            {act.icon} {act.placeName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Stays & Dining Preview */}
            <div className="summary-card card">
              <div className="card-sec-head">
                <h2 className="card-sec-title">🏨 Recommended Stay & Dining</h2>
                <Link to="/hotels" className="edit-link">Browse More →</Link>
              </div>

              <div className="sum-stay-preview">
                <div className="sum-hotel-box">
                  <span className="box-tag">Primary Hotel</span>
                  <h4>{sampleHotel.name}</h4>
                  <p>📍 {sampleHotel.location} ({sampleHotel.distance})</p>
                  <div className="box-price">₹{sampleHotel.pricePerNight.toLocaleString('en-IN')} / night</div>
                </div>

                <div className="sum-dining-box">
                  <span className="box-tag">Dining Recommendations</span>
                  {sampleRestaurants.map((r) => (
                    <div key={r.id} className="dining-mini-item">
                      <strong>🍽️ {r.name}</strong>
                      <span>{r.cuisine} • {r.priceRange}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Action Card */}
          <aside className="summary-side-col">
            <div className="summary-checkout-card card">
              <h3 className="checkout-title">Trip Ready</h3>
              <p className="checkout-sub">Everything is organized for your adventure in {currentCity}.</p>

              <div className="checkout-divider" />

              <div className="checkout-item-row">
                <span>Budget Status</span>
                <span className="font-teal">✓ Within Safe Limits</span>
              </div>
              <div className="checkout-item-row">
                <span>Route Optimization</span>
                <span>✓ Activated</span>
              </div>
              <div className="checkout-item-row">
                <span>Daily Schedules</span>
                <span>✓ {days} Days Scheduled</span>
              </div>

              <div className="checkout-actions">
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={handleSaveTrip}
                >
                  💾 Save to My Dashboard
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  size="md"
                  onClick={handleExportPDF}
                >
                  📄 Print / PDF Export
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard →
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default TripSummary;

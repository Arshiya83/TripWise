import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';
import { MOCK_SAVED_TRIPS } from '../data/mockData';
import './Dashboard.css';

function SavedTrips() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState(MOCK_SAVED_TRIPS);
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredTrips = trips.filter((t) => {
    if (activeFilter === 'All') return true;
    return t.status.toLowerCase() === activeFilter.toLowerCase();
  });

  const handleDeleteTrip = (id) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dash-section-header" style={{ marginBottom: '2rem' }}>
          <div>
            <div className="badge badge-primary">Travel Vault</div>
            <h1 className="dash-name" style={{ color: 'var(--text-primary)', marginTop: '0.5rem' }}>
              My Saved & Planned Trips
            </h1>
            <p className="dash-section-sub">
              Access your upcoming itineraries, past adventures, and saved blueprints.
            </p>
          </div>
          <Button variant="primary" size="md" onClick={() => navigate('/plan-trip')}>
            ✈ Plan a New Trip
          </Button>
        </div>

        {/* Filter Pills */}
        <div className="dest-category-tabs" style={{ marginBottom: '1.75rem' }}>
          {['All', 'Upcoming', 'Completed', 'Draft'].map((f) => (
            <button
              key={f}
              type="button"
              className={`category-tab-btn${activeFilter === f ? ' active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {filteredTrips.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-state-icon">🎒</div>
            <h3 className="empty-state-title">No trips in this view</h3>
            <p className="empty-state-desc">Plan a trip or switch your filter to see saved travel plans.</p>
            <Button variant="primary" size="sm" onClick={() => navigate('/plan-trip')}>
              Start Planning Now
            </Button>
          </div>
        ) : (
          <div className="trips-list" style={{ maxWidth: '900px' }}>
            {filteredTrips.map((trip) => (
              <div key={trip.id} className="trip-card card card-hover">
                <div className="trip-card-thumb" style={{ width: '180px' }}>
                  <img src={trip.coverImage} alt={trip.destination} className="trip-card-img" />
                  <span className={`trip-status-badge status-${trip.status.toLowerCase()}`}>
                    {trip.status}
                  </span>
                </div>
                <div className="trip-card-body">
                  <div className="trip-card-dates">{trip.dates}</div>
                  <h3 className="trip-card-dest">{trip.destination}</h3>
                  <div className="trip-card-details">
                    <span>🗓️ {trip.numberOfDays} Days</span>
                    <span>👥 {trip.travelers} Guests</span>
                    <span>💰 {trip.budget} ({trip.spentBudget} estimated)</span>
                  </div>
                  <div className="trip-card-footer">
                    <Button variant="secondary" size="xs" onClick={() => navigate('/itinerary')}>
                      View Itinerary
                    </Button>
                    <Button variant="outline" size="xs" onClick={() => navigate('/map')}>
                      Route Map
                    </Button>
                    <button
                      type="button"
                      className="sel-remove-btn"
                      style={{ marginLeft: 'auto', fontSize: '0.75rem' }}
                      onClick={() => handleDeleteTrip(trip.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SavedTrips;

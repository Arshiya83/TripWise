import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import Button from '../components/Button';
import { MOCK_SAVED_TRIPS, POPULAR_CITIES } from '../data/mockData';
import './Dashboard.css';

const STATS = [
  { icon: '🗺️', label: 'Trips Planned', value: '3', badge: 'Active', color: 'stat-teal' },
  { icon: '📍', label: 'Places Selected', value: '14', badge: 'Curated', color: 'stat-amber' },
  { icon: '❤️', label: 'Saved Wishlist', value: '5', badge: 'Bookmarked', color: 'stat-rose' },
  { icon: '💰', label: 'Est. Budget', value: '₹32k', badge: 'Tracked', color: 'stat-sky' },
];

const QUICK_ACTIONS = [
  { icon: '✈️', label: 'Plan New Trip', to: '/plan-trip', primary: true },
  { icon: '🗺️', label: 'Destinations', to: '/destinations' },
  { icon: '📅', label: 'Smart Itinerary', to: '/itinerary' },
  { icon: '🗾', label: 'Route Map', to: '/map' },
  { icon: '💰', label: 'Budget Planner', to: '/budget' },
  { icon: '🏨', label: 'Hotels & Dining', to: '/hotels' },
];

function Dashboard() {
  const { user } = useAuth();
  const { setTripPreferences } = useTrip();
  const navigate = useNavigate();

  const firstName = user?.name?.split(' ')[0] || 'Traveller';

  const handleDestinationClick = (cityName) => {
    setTripPreferences({
      destination: cityName,
      numberOfDays: 3,
      travelType: 'Couple',
    });
    navigate('/destinations');
  };

  return (
    <div className="dashboard">
      <div className="container">
        {/* ── Welcome Banner ───────────────────────── */}
        <section className="dash-welcome animate-fade-in-up" aria-label="Welcome">
          <div className="dash-welcome-bg" />
          <div className="dash-welcome-content">
            <div className="dash-welcome-text">
              <div className="dash-greeting-pill">
                <span>👋 Welcome back</span>
                <span className="dash-greeting-bullet">•</span>
                <span>Pro Member</span>
              </div>
              <h1 className="dash-name">{firstName}</h1>
              <p className="dash-prompt">
                Ready to plan your next adventure? Let AI craft your perfect itinerary.
              </p>
            </div>
            <div className="dash-welcome-actions">
              <Button
                variant="white"
                size="lg"
                onClick={() => navigate('/plan-trip')}
                id="dash-new-trip-btn"
              >
                ✈ Plan a New Trip
              </Button>
            </div>
          </div>
        </section>

        {/* ── Quick Actions Ribbon ─────────────────── */}
        <section className="dash-quick-ribbon" aria-label="Quick Actions">
          <div className="quick-actions-grid">
            {QUICK_ACTIONS.map(({ icon, label, to, primary }) => (
              <Link
                key={label}
                to={to}
                className={`quick-action-pill${primary ? ' quick-action-primary' : ''}`}
              >
                <span className="quick-action-icon">{icon}</span>
                <span className="quick-action-label">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Stats Section ────────────────────────── */}
        <section className="dash-stats-grid" aria-label="Statistics">
          {STATS.map(({ icon, label, value, badge, color }) => (
            <div key={label} className={`stat-card card ${color}`}>
              <div className="stat-icon-wrap" aria-hidden="true">{icon}</div>
              <div className="stat-content">
                <div className="stat-top">
                  <span className="stat-value">{value}</span>
                  <span className="stat-pill">{badge}</span>
                </div>
                <div className="stat-label">{label}</div>
              </div>
            </div>
          ))}
        </section>

        {/* ── Two Column Content ───────────────────── */}
        <div className="dash-two-col">
          {/* Recent & Upcoming Trips */}
          <section className="dash-section" aria-labelledby="recent-trips-heading">
            <div className="dash-section-header">
              <div>
                <h2 id="recent-trips-heading" className="dash-section-title">
                  My Trips
                </h2>
                <p className="dash-section-sub">
                  Active, upcoming, and saved travel plans
                </p>
              </div>
              <Link to="/saved-trips" className="dash-see-all">
                View all ({MOCK_SAVED_TRIPS.length}) →
              </Link>
            </div>

            <div className="trips-list">
              {MOCK_SAVED_TRIPS.map((trip) => (
                <div key={trip.id} className="trip-card card card-hover">
                  <div className="trip-card-thumb">
                    <img
                      src={trip.coverImage}
                      alt={trip.destination}
                      className="trip-card-img"
                    />
                    <span className={`trip-status-badge status-${trip.status.toLowerCase()}`}>
                      {trip.status}
                    </span>
                  </div>

                  <div className="trip-card-body">
                    <div className="trip-card-dates">{trip.dates}</div>
                    <h3 className="trip-card-dest">{trip.destination}</h3>

                    <div className="trip-card-details">
                      <span>🗓️ {trip.numberOfDays} Days</span>
                      <span>👥 {trip.travelers} Travelers</span>
                      <span>💰 {trip.budget}</span>
                    </div>

                    <div className="trip-card-footer">
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => navigate('/itinerary')}
                      >
                        View Itinerary
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => navigate('/trip-summary')}
                      >
                        Summary →
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recommended Destinations Column */}
          <section className="dash-section" aria-labelledby="explore-heading">
            <div className="dash-section-header">
              <div>
                <h2 id="explore-heading" className="dash-section-title">
                  Recommended For You
                </h2>
                <p className="dash-section-sub">
                  Trending destinations matched with your style
                </p>
              </div>
              <Link to="/destinations" className="dash-see-all">
                Browse all →
              </Link>
            </div>

            <div className="explore-list">
              {POPULAR_CITIES.map((city) => (
                <div
                  key={city.id}
                  className="explore-item card card-hover"
                  onClick={() => handleDestinationClick(city.name)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleDestinationClick(city.name)}
                >
                  <img
                    src={city.image}
                    alt={city.name}
                    className="explore-item-img"
                  />
                  <div className="explore-item-info">
                    <div className="explore-item-header">
                      <h4 className="explore-item-city">{city.name}</h4>
                      <span className="explore-item-rating">★ {city.rating}</span>
                    </div>
                    <p className="explore-item-desc">{city.tagline}</p>
                    <div className="explore-item-bottom">
                      <span className="explore-item-places">📍 {city.placesCount} attractions</span>
                      <span className="explore-item-action">Plan Trip →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Travel Tip Card */}
            <div className="travel-tip-card card">
              <div className="travel-tip-icon">💡</div>
              <div>
                <h4 className="travel-tip-title">Smart Route Optimizer Tip</h4>
                <p className="travel-tip-text">
                  Grouping sights by neighborhood saves an average of 42 minutes per day in transit. Our AI automatically sequences your route!
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

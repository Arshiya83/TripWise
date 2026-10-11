import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import Button from '../components/Button';
import { CITY_OPTIONS } from '../data/destination';
import { MOCK_SAVED_TRIPS } from '../data/mockData';
import './Dashboard.css';
const SUPPORTED_CITIES = CITY_OPTIONS.filter((city) => city.supported);

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
      <div className="container dashboard-shell">
        <section className="dashboard-hero animate-fade-in-up" aria-label="Welcome hero section">
          <div className="dashboard-hero-content">
            <div className="dashboard-hero-copy">
              <span className="dashboard-badge">AI-POWERED TRAVEL PLANNER</span>
              <h1>
                Plan Your Next Adventure.
                <span>Travel Smarter.</span>
              </h1>
              <p>
                Create personalized itineraries, discover amazing destinations, optimize your routes, and stay within your budget.
              </p>
              <div className="dashboard-hero-actions">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/plan-trip')}
                  id="dash-create-trip-btn"
                >
                  + Create New Trip
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate('/destinations')}
                  id="dash-explore-destinations-btn"
                >
                  Explore Destinations
                </Button>
              </div>
            </div>

            <div className="dashboard-hero-panel" aria-label="Trip summary preview">
              <div className="hero-panel-card hero-panel-main">
                <span className="hero-panel-label">Next getaway</span>
                <strong>Goa Coastal Escape</strong>
                <small>3 nights • beachside stays • curated dining</small>
              </div>
              <div className="hero-panel-card hero-panel-secondary">
                <span className="hero-panel-label">Route efficiency</span>
                <strong>92%</strong>
                <small>AI-optimized plan</small>
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard-section" aria-labelledby="popular-destinations-heading">
          <div className="dashboard-section-header">
            <h2 id="popular-destinations-heading">EXPLORE POPULAR DESTINATIONS</h2>
          </div>

          <div className="destination-grid">
            {SUPPORTED_CITIES.map((city) => (
              <article key={city.id} className="destination-card">
                <div className="destination-card-media">
                  <img src={city.image} alt={city.name} className="destination-card-image" />
                  <div className="destination-card-image-overlay">
                    <span className="destination-card-location">
                      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path d="M16 8.3c0 4.2-6 9-6 9s-6-4.8-6-9a6 6 0 1 1 12 0Z" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="10" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                      India
                    </span>
                    <strong>{city.name}</strong>
                  </div>
                </div>
                <div className="destination-card-body">
                  <div className="destination-card-topline">
                    <span className="destination-card-ready">Featured destination</span>
                    <span className="destination-rating">★ {city.rating}</span>
                  </div>
                  <p className="destination-card-description">{city.tagline}</p>
                  <div className="destination-card-footer">
                    <span>Curated itinerary</span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleDestinationClick(city.name)}
                    >
                      Plan Trip
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="dashboard-lower-grid">
          <section className="dashboard-section" aria-labelledby="recent-trips-heading">
            <div className="dashboard-section-header">
              <h2 id="recent-trips-heading">MY RECENT TRIPS</h2>
            </div>

            <div className="recent-trip-list">
              {MOCK_SAVED_TRIPS.slice(0, 3).map((trip) => (
                <article key={trip.id} className="recent-trip-card">
                  <img src={trip.coverImage} alt={trip.destination} className="recent-trip-image" />
                  <div className="recent-trip-content">
                    <div className="recent-trip-topline">
                      <span className="recent-trip-status">{trip.status}</span>
                      <span className="recent-trip-date">{trip.dates}</span>
                    </div>
                    <h3>{trip.destination}</h3>
                    <div className="recent-trip-meta">
                      <span>{trip.numberOfDays} days</span>
                      <span>{trip.travelers} travelers</span>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => navigate('/itinerary')}>
                      View Trip
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="dashboard-section" aria-labelledby="travel-tip-heading">
            <div className="dashboard-section-header">
              <h2 id="travel-tip-heading">SMART TRAVEL TIP</h2>
            </div>

            <div className="travel-tip-card">
              <div className="travel-tip-icon">💡</div>
              <div>
                <h3>Best time to explore</h3>
                <p>
                  Start each day early for iconic sights, then save afternoon hours for food trails and relaxed evenings.
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

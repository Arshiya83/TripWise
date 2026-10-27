import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import Button from '../components/Button';
import { CITY_OPTIONS } from '../data/destination';
import { getSavedTrips } from '../services/api';
import { getVerifiedAttractionImage, handleAttractionImageError } from '../utils/imageFallback';
import './Dashboard.css';

const SUPPORTED_CITIES = CITY_OPTIONS.filter((city) => city.supported);

function Dashboard() {
  const { isAuthenticated, user } = useAuth();
  const { setTripPreferences, loadTrip } = useTrip();
  const navigate = useNavigate();

  const [recentTrips, setRecentTrips] = useState([]);

  useEffect(() => {
    async function loadRecent() {
      let trips = [];

      if (isAuthenticated) {
        try {
          const res = await getSavedTrips();
          if (res?.data?.success && Array.isArray(res.data.trips)) {
            trips = res.data.trips;
          }
        } catch {
          // Fall through to user-scoped local cache
        }

        if (trips.length === 0 && user?.id) {
          try {
            const localRaw = localStorage.getItem(`tripwise_local_saved_trips_${user.id}`);
            if (localRaw) {
              const parsed = JSON.parse(localRaw);
              if (Array.isArray(parsed)) trips = parsed;
            }
          } catch {
            // Ignore
          }
        }
      } else {
        try {
          const localRaw = localStorage.getItem('tripwise_local_saved_trips');
          if (localRaw) {
            const parsed = JSON.parse(localRaw);
            if (Array.isArray(parsed)) trips = parsed;
          }
        } catch {
          // Ignore
        }
      }

      setRecentTrips(trips.slice(0, 3));
    }

    loadRecent();
  }, [isAuthenticated, user?.id]);

  const handleDestinationClick = (cityName) => {
    setTripPreferences({
      destination: cityName,
      numberOfDays: 3,
      travelType: 'Couple',
    });
    navigate('/destinations');
  };

  const handleOpenTrip = (targetTrip) => {
    loadTrip(targetTrip);
    navigate('/itinerary');
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

            {recentTrips.length === 0 ? (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', background: '#ffffff' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  No saved trips yet. Create your first smart travel plan to access it anytime!
                </p>
                <Button variant="outline" size="sm" onClick={() => navigate('/plan-trip')}>
                  Plan a Trip Now →
                </Button>
              </div>
            ) : (
              <div className="recent-trip-list">
                {recentTrips.map((tripItem) => (
                  <article key={tripItem._id || tripItem.id} className="recent-trip-card">
                    <img
                      src={
                        tripItem.coverImage && !tripItem.coverImage.includes('photo-1488646953014')
                          ? tripItem.coverImage
                          : getVerifiedAttractionImage(tripItem.selectedPlaces?.[0] || tripItem.destination, tripItem.destination)
                      }
                      alt={tripItem.destination}
                      className="recent-trip-image"
                      loading="lazy"
                      onError={(e) => handleAttractionImageError(e, `${tripItem.destination} Trip`, tripItem.destination)}
                    />
                    <div className="recent-trip-content">
                      <div className="recent-trip-topline">
                        <span className="recent-trip-status">{tripItem.status || 'Planned'}</span>
                        <span className="recent-trip-date">{tripItem.dates || `${tripItem.numberOfDays} Days`}</span>
                      </div>
                      <h3>{tripItem.destination}</h3>
                      <div className="recent-trip-meta">
                        <span>{tripItem.numberOfDays} days</span>
                        <span>{tripItem.travelers} travelers</span>
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => handleOpenTrip(tripItem)}>
                        View Trip
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
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

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import Button from '../components/Button';
import { getHotelsByDestination } from '../data/mockData';
import './Hotels.css';

function Hotels() {
  const navigate = useNavigate();
  const { trip } = useTrip();

  const currentCity = trip.destination || 'Hyderabad';
  const [selectedHotels, setSelectedHotels] = useState([]);

  // Use canonical helper — ONLY returns hotels for the current destination city.
  // Never falls back to all hotels. Architecture: replace body with API call when backend is ready.
  const displayHotels = getHotelsByDestination(currentCity);

  const toggleSelectHotel = (id) => {
    setSelectedHotels((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]
    );
  };

  return (
    <div className="stays-page">
      <div className="container">
        {/* ── Header ───────────────────────────────── */}
        <div className="stays-header animate-fade-in-up">
          <div className="stays-header-top">
            <div>
              <div className="stays-tabs-switch">
                <span className="switch-pill active">🏨 Hotels & Stays</span>
                <Link to="/restaurants" className="switch-pill">
                  🍽️ Dining & Cafes
                </Link>
              </div>
              <h1 className="stays-title">Handpicked Accommodations in {currentCity}</h1>
              <p className="stays-subtitle">
                Strategically situated hotels curated for proximity to your planned sightseeing waypoints.
              </p>
            </div>

            <div className="stays-header-actions">
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
                onClick={() => navigate('/trip-summary')}
              >
                Trip Summary →
              </Button>
            </div>
          </div>
        </div>

        {/* ── Hotels Grid ──────────────────────────── */}
        {displayHotels.length === 0 ? (
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center', marginTop: '2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏨</div>
            <h3 style={{ marginBottom: '0.5rem' }}>No hotels listed for {currentCity} yet</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Hotel recommendations for {currentCity} will be available soon. Check back later or browse other cities.
            </p>
            <Button variant="outline" size="md" onClick={() => navigate('/itinerary')}>
              ← Back to Itinerary
            </Button>
          </div>
        ) : (
        <div className="stays-grid">
          {displayHotels.map((hotel) => {
            const isSelected = selectedHotels.includes(hotel.id);
            return (
              <div
                key={hotel.id}
                className={`stay-card card card-hover${isSelected ? ' stay-card-selected' : ''}`}
              >
                <div className="stay-img-wrap">
                  <img
                    src={hotel.image}
                    alt={hotel.name}
                    className="stay-img"
                    loading="lazy"
                  />
                  <div className="stay-price-pill">
                    <strong>₹{hotel.pricePerNight.toLocaleString('en-IN')}</strong> / night
                  </div>
                  <div className="stay-rating-pill">
                    ★ {hotel.rating} <span className="reviews">({hotel.reviewsCount})</span>
                  </div>
                  {isSelected && (
                    <div className="stay-selected-flag">
                      ✓ Reserved in Trip
                    </div>
                  )}
                </div>

                <div className="stay-body">
                  <div className="stay-location-row">
                    <span className="stay-loc">📍 {hotel.location}</span>
                    <span className="stay-distance">🚗 {hotel.distance}</span>
                  </div>

                  <h3 className="stay-name">{hotel.name}</h3>

                  <div className="stay-tags">
                    {hotel.tags.map((tag) => (
                      <span key={tag} className="stay-tag">{tag}</span>
                    ))}
                  </div>

                  <div className="stay-amenities-row">
                    {hotel.amenities.map((amenity) => (
                      <span key={amenity} className="amenity-item">✓ {amenity}</span>
                    ))}
                  </div>

                  <div className="stay-actions">
                    <Button
                      variant={isSelected ? 'secondary' : 'primary'}
                      fullWidth
                      size="sm"
                      onClick={() => toggleSelectHotel(hotel.id)}
                    >
                      {isSelected ? '✓ Hotel Selected (Remove)' : 'Select for Trip'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}

export default Hotels;

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import Button from '../components/Button';
import { MOCK_HOTELS } from '../data/mockData';
import './Hotels.css';

function Hotels() {
  const navigate = useNavigate();
  const { trip } = useTrip();

  const currentCity = trip.destination || 'Hyderabad';
  const [selectedHotels, setSelectedHotels] = useState(['hotel-2']);

  const hotels = MOCK_HOTELS.filter(
    (h) => !currentCity || h.city.toLowerCase() === currentCity.toLowerCase()
  );
  const displayHotels = hotels.length > 0 ? hotels : MOCK_HOTELS;

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
      </div>
    </div>
  );
}

export default Hotels;

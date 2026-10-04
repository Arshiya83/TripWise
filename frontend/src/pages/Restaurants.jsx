import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import Button from '../components/Button';
import { MOCK_RESTAURANTS } from '../data/mockData';
import './Hotels.css';

function Restaurants() {
  const navigate = useNavigate();
  const { trip } = useTrip();

  const currentCity = trip.destination || 'Hyderabad';
  const [selectedSpots, setSelectedSpots] = useState(['rest-1', 'rest-3']);

  const restaurants = MOCK_RESTAURANTS.filter(
    (r) => !currentCity || r.city.toLowerCase() === currentCity.toLowerCase()
  );
  const displayRestaurants = restaurants.length > 0 ? restaurants : MOCK_RESTAURANTS;

  const toggleSelectSpot = (id) => {
    setSelectedSpots((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
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
                <Link to="/hotels" className="switch-pill">
                  🏨 Hotels & Stays
                </Link>
                <span className="switch-pill active">🍽️ Dining & Cafes</span>
              </div>
              <h1 className="stays-title">Iconic Culinary Spots in {currentCity}</h1>
              <p className="stays-subtitle">
                Authentic dining establishments and heritage cafes along your travel itinerary.
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

        {/* ── Restaurants Grid ─────────────────────── */}
        <div className="stays-grid">
          {displayRestaurants.map((spot) => {
            const isSelected = selectedSpots.includes(spot.id);
            return (
              <div
                key={spot.id}
                className={`stay-card card card-hover${isSelected ? ' stay-card-selected' : ''}`}
              >
                <div className="stay-img-wrap">
                  <img
                    src={spot.image}
                    alt={spot.name}
                    className="stay-img"
                    loading="lazy"
                  />
                  <div className="stay-price-pill">
                    {spot.priceRange} • ~₹{spot.avgCostForTwo} for two
                  </div>
                  <div className="stay-rating-pill">
                    ★ {spot.rating} <span className="reviews">({spot.reviewsCount})</span>
                  </div>
                  {isSelected && (
                    <div className="stay-selected-flag">
                      ✓ Added to Dining Plan
                    </div>
                  )}
                </div>

                <div className="stay-body">
                  <div className="stay-location-row">
                    <span className="stay-loc">📍 {spot.location}</span>
                    <span className="stay-distance">🚶 {spot.distance}</span>
                  </div>

                  <h3 className="stay-name">{spot.name}</h3>
                  <div className="rest-cuisine">{spot.cuisine}</div>

                  <div className="stay-tags">
                    {spot.tags.map((tag) => (
                      <span key={tag} className="stay-tag">{tag}</span>
                    ))}
                  </div>

                  <div className="rest-dishes">
                    <strong>Must Try:</strong>{' '}
                    <span>{spot.recommendedDishes.join(', ')}</span>
                  </div>

                  <div className="stay-actions">
                    <Button
                      variant={isSelected ? 'secondary' : 'primary'}
                      fullWidth
                      size="sm"
                      onClick={() => toggleSelectSpot(spot.id)}
                    >
                      {isSelected ? '✓ In Dining Plan (Remove)' : 'Add to Dining Plan'}
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

export default Restaurants;

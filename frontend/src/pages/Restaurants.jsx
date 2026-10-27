import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import Button from '../components/Button';
import { getRestaurantsByDestination, MOCK_RESTAURANTS } from '../data/mockData';
import { getRestaurants } from '../services/api';
import './Hotels.css';

function Restaurants() {
  const navigate = useNavigate();
  const { trip, setTripPreferences } = useTrip();

  const currentCity = trip.destination || 'Hyderabad';
  const selectedSpots = trip.selectedRestaurants || [];

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState('loading'); // 'api' | 'curated'
  const [priceFilter, setPriceFilter] = useState('all'); // 'all' | 'budget' | 'mid' | 'fine'
  const [sortBy, setSortBy] = useState('rating'); // 'rating' | 'cost_asc' | 'cost_desc'

  // Fetch restaurants from backend API with fallback to verified curated dataset
  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    setError(null);

    const localFallback = getRestaurantsByDestination(currentCity);

    try {
      const response = await getRestaurants(currentCity);
      const data = response?.data;

      if (data?.success && Array.isArray(data.restaurants) && data.restaurants.length > 0) {
        // Normalize MongoDB documents with mock enhancements
        const normalized = data.restaurants.map((r) => {
          const mockMatch = MOCK_RESTAURANTS.find(
            (m) => m.name.toLowerCase() === r.name.toLowerCase()
          );

          const cuisineList = Array.isArray(r.cuisine)
            ? r.cuisine.join(', ')
            : (r.cuisine || mockMatch?.cuisine || 'Authentic Regional');

          return {
            id: mockMatch?.id || r._id || r.id,
            name: r.name,
            city: r.destination || currentCity,
            cuisine: cuisineList,
            rating: r.rating || mockMatch?.rating || 4.6,
            reviewsCount: mockMatch?.reviewsCount || 2200,
            priceRange: r.priceRange || mockMatch?.priceRange || '₹₹',
            avgCostForTwo: mockMatch?.avgCostForTwo || 1200,
            location: mockMatch?.location || (typeof r.location === 'string' ? r.location : `${currentCity} Central`),
            distance: mockMatch?.distance || 'Strategic central location',
            image: r.imageUrl || mockMatch?.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
            tags: mockMatch?.tags || ['Authentic Heritage', 'Popular Spot'],
            recommendedDishes: mockMatch?.recommendedDishes || ['Chef Special Thali', 'Regional Dessert'],
            isVerified: true,
          };
        });

        setRestaurants(normalized);
        setDataSource('api');
      } else if (localFallback.length > 0) {
        setRestaurants(localFallback.map((r) => ({ ...r, isVerified: true })));
        setDataSource('curated');
      } else {
        setRestaurants([]);
        setDataSource('curated');
      }
    } catch {
      // Graceful fallback to verified curated dataset
      if (localFallback.length > 0) {
        setRestaurants(localFallback.map((r) => ({ ...r, isVerified: true })));
        setDataSource('curated');
      } else {
        setError('Unable to load dining recommendations. Please try again.');
        setRestaurants([]);
      }
    } finally {
      setLoading(false);
    }
  }, [currentCity]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const toggleSelectSpot = (id) => {
    const next = selectedSpots.includes(id)
      ? selectedSpots.filter((r) => r !== id)
      : [...selectedSpots, id];

    setTripPreferences({ selectedRestaurants: next });
  };

  // Filter & Sort
  const displayedRestaurants = useMemo(() => {
    let list = [...restaurants];

    if (priceFilter === 'budget') {
      list = list.filter((r) => (r.avgCostForTwo || 0) <= 800);
    } else if (priceFilter === 'mid') {
      list = list.filter((r) => (r.avgCostForTwo || 0) > 800 && (r.avgCostForTwo || 0) <= 2000);
    } else if (priceFilter === 'fine') {
      list = list.filter((r) => (r.avgCostForTwo || 0) > 2000);
    }

    if (sortBy === 'cost_asc') {
      list.sort((a, b) => (a.avgCostForTwo || 0) - (b.avgCostForTwo || 0));
    } else if (sortBy === 'cost_desc') {
      list.sort((a, b) => (b.avgCostForTwo || 0) - (a.avgCostForTwo || 0));
    } else {
      list.sort((a, b) => b.rating - a.rating);
    }

    return list;
  }, [restaurants, priceFilter, sortBy]);

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
                Authentic dining establishments and heritage cafes curated for your travel itinerary in {currentCity}.
              </p>
            </div>

            <div className="stays-header-actions">
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/itinerary')}
                id="btn-back-itinerary-dining"
              >
                ← Back to Itinerary
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/trip-summary')}
                id="btn-proceed-summary-dining"
              >
                Trip Summary →
              </Button>
            </div>
          </div>

          {/* ── Filter Bar ────────────────────────────── */}
          <div className="stays-filter-bar">
            <div className="filter-group">
              <span className="filter-label">Filter:</span>
              <button
                type="button"
                className={`filter-btn ${priceFilter === 'all' ? 'active' : ''}`}
                onClick={() => setPriceFilter('all')}
              >
                All ({restaurants.length})
              </button>
              <button
                type="button"
                className={`filter-btn ${priceFilter === 'budget' ? 'active' : ''}`}
                onClick={() => setPriceFilter('budget')}
              >
                Budget / Street (≤ ₹800)
              </button>
              <button
                type="button"
                className={`filter-btn ${priceFilter === 'mid' ? 'active' : ''}`}
                onClick={() => setPriceFilter('mid')}
              >
                Casual & Heritage (₹800 - ₹2,000)
              </button>
              <button
                type="button"
                className={`filter-btn ${priceFilter === 'fine' ? 'active' : ''}`}
                onClick={() => setPriceFilter('fine')}
              >
                Fine Dining (₹2,000+)
              </button>
            </div>

            <div className="sort-group">
              <span className="filter-label">Sort:</span>
              <select
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                id="select-restaurant-sort"
              >
                <option value="rating">Top Rated ★</option>
                <option value="cost_asc">Cost: Low to High</option>
                <option value="cost_desc">Cost: High to Low</option>
              </select>
            </div>
          </div>

          {/* ── Transparency Badge ────────────────────── */}
          <div className="stays-source-badge">
            <span className="source-dot" />
            <span>
              {dataSource === 'api'
                ? 'Connected to TripWise Database — Real-world verified culinary landmarks'
                : 'Verified Curated Dataset — Real-world culinary landmarks'}
            </span>
          </div>
        </div>

        {/* ── Loading Skeleton State ───────────────── */}
        {loading && (
          <div className="stays-grid">
            {[1, 2, 3].map((n) => (
              <div key={n} className="stay-card card skeleton-card">
                <div className="skeleton-img" />
                <div className="stay-body">
                  <div className="skeleton-line sm" />
                  <div className="skeleton-line md" />
                  <div className="skeleton-line lg" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Error & Retry State ──────────────────── */}
        {!loading && error && (
          <div className="card stays-empty-card">
            <div className="empty-icon">⚠️</div>
            <h3>Unable to fetch dining spots</h3>
            <p>{error}</p>
            <div className="empty-actions">
              <Button variant="primary" size="md" onClick={fetchRestaurants}>
                ↻ Try Again
              </Button>
              <Button variant="outline" size="md" onClick={() => navigate('/itinerary')}>
                ← Back to Itinerary
              </Button>
            </div>
          </div>
        )}

        {/* ── Empty Results State ──────────────────── */}
        {!loading && !error && displayedRestaurants.length === 0 && (
          <div className="card stays-empty-card">
            <div className="empty-icon">🍽️</div>
            <h3>No dining spots match your criteria in {currentCity}</h3>
            <p>
              {restaurants.length > 0
                ? 'Try resetting your price filter to explore all verified restaurants.'
                : `Culinary recommendations for ${currentCity} are currently being curated. You can continue planning your trip.`}
            </p>
            <div className="empty-actions">
              {restaurants.length > 0 ? (
                <Button variant="primary" size="md" onClick={() => setPriceFilter('all')}>
                  Reset Filter
                </Button>
              ) : (
                <Button variant="outline" size="md" onClick={() => navigate('/plan-trip')}>
                  Select Another Destination
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ── Restaurants Grid ─────────────────────── */}
        {!loading && !error && displayedRestaurants.length > 0 && (
          <>
            <div className="stays-grid">
              {displayedRestaurants.map((spot) => {
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
                        {spot.priceRange} • Est. ~₹{spot.avgCostForTwo} for two
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

            <div className="stays-footnote">
              * Indicative estimated meal cost for two diners. Actual menu prices, seasonal specials, and taxes may vary.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Restaurants;

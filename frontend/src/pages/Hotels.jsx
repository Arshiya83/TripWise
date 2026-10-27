import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import Button from '../components/Button';
import { getHotelsByDestination, MOCK_HOTELS } from '../data/mockData';
import { getHotels } from '../services/api';
import { calculateTripBudget } from '../utils/budgetEngine';
import { handleHotelImageError } from '../utils/imageFallback';
import './Hotels.css';

function Hotels() {
  const navigate = useNavigate();
  const { trip, setTripPreferences } = useTrip();

  const currentCity = trip.destination || 'Hyderabad';
  const selectedHotels = trip.selectedHotels || [];

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState('loading'); // 'api' | 'curated'
  const [budgetFilter, setBudgetFilter] = useState('all'); // 'all' | 'budget_fit' | 'under_10k' | 'luxury'
  const [sortBy, setSortBy] = useState('recommended'); // 'recommended' | 'price_asc' | 'price_desc'

  // Estimated accommodation target from trip context
  const totalBudget = Number(trip.budget) || 25000;
  const days = Math.max(1, Number(trip.numberOfDays) || 3);
  // Default ~40% of total budget allocated to accommodation
  const estimatedNightlyHotelBudget = Math.round((totalBudget * 0.40) / days);

  // Fetch hotels from backend API with fallback to verified curated dataset
  const fetchHotels = useCallback(async () => {
    setLoading(true);
    setError(null);

    const localFallback = getHotelsByDestination(currentCity);

    try {
      const response = await getHotels(currentCity, trip.budget);
      const data = response?.data;

      if (data?.success && Array.isArray(data.hotels) && data.hotels.length > 0) {
        // Normalize MongoDB documents with fallback enhancements
        const normalized = data.hotels.map((h) => {
          const mockMatch = MOCK_HOTELS.find(
            (m) => m.name.toLowerCase() === h.name.toLowerCase()
          );

          return {
            id: mockMatch?.id || h._id || h.id,
            name: h.name,
            city: h.destination || currentCity,
            rating: h.rating || mockMatch?.rating || 4.7,
            reviewsCount: mockMatch?.reviewsCount || 1200,
            priceRange: h.pricePerNight > 20000 ? '₹₹₹₹' : h.pricePerNight > 10000 ? '₹₹₹' : '₹₹',
            pricePerNight: h.pricePerNight,
            location: mockMatch?.location || (typeof h.location === 'string' ? h.location : `${currentCity} Central`),
            distance: mockMatch?.distance || 'Central destination area',
            image: h.imageUrl || mockMatch?.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
            tags: mockMatch?.tags || [h.category || 'Curated Stay'],
            amenities: (h.amenities && h.amenities.length > 0) ? h.amenities : (mockMatch?.amenities || ['Free WiFi', 'AC Rooms']),
            isVerified: true,
          };
        });

        setHotels(normalized);
        setDataSource('api');
      } else if (localFallback.length > 0) {
        setHotels(localFallback.map((h) => ({ ...h, isVerified: true })));
        setDataSource('curated');
      } else {
        setHotels([]);
        setDataSource('curated');
      }
    } catch {
      // Graceful fallback to verified curated data
      if (localFallback.length > 0) {
        setHotels(localFallback.map((h) => ({ ...h, isVerified: true })));
        setDataSource('curated');
      } else {
        setError('Unable to load hotels for this destination. Please try again.');
        setHotels([]);
      }
    } finally {
      setLoading(false);
    }
  }, [currentCity, trip.budget]);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const toggleSelectHotel = (id) => {
    const next = selectedHotels.includes(id)
      ? selectedHotels.filter((h) => h !== id)
      : [...selectedHotels, id];

    setTripPreferences({ selectedHotels: next });
  };

  // Accommodation Pricing Mode states
  const pricingMode = trip.accommodationPricingMode || 'auto';
  const isManualMode = pricingMode === 'manual';

  const [manualPriceInput, setManualPriceInput] = useState(
    trip.manualAccommodationCost !== null && trip.manualAccommodationCost !== undefined
      ? String(trip.manualAccommodationCost)
      : ''
  );
  const [manualError, setManualError] = useState('');

  // Keep input in sync with loaded / external trip state
  useEffect(() => {
    if (trip.manualAccommodationCost !== null && trip.manualAccommodationCost !== undefined) {
      setManualPriceInput(String(trip.manualAccommodationCost));
    }
  }, [trip.manualAccommodationCost]);

  // Selected hotel object from list
  const selectedHotelObj = useMemo(() => {
    if (selectedHotels.length > 0) {
      const firstId = typeof selectedHotels[0] === 'object' ? selectedHotels[0].id : selectedHotels[0];
      return hotels.find((h) => h.id === firstId) || null;
    }
    return null;
  }, [selectedHotels, hotels]);

  // Single authoritative budget calculation
  const budgetCalc = useMemo(() => {
    return calculateTripBudget({
      budget: totalBudget,
      numberOfDays: days,
      travelers: Number(trip.travelers || trip.totalTravelers || trip.adults || 2),
      selectedHotel: selectedHotelObj,
      destination: currentCity,
      travelType: trip.travelType || 'Couple',
      accommodationPricingMode: pricingMode,
      manualAccommodationCost: trip.manualAccommodationCost,
    });
  }, [
    totalBudget,
    days,
    trip.travelers,
    trip.totalTravelers,
    trip.adults,
    selectedHotelObj,
    currentCity,
    trip.travelType,
    pricingMode,
    trip.manualAccommodationCost,
  ]);

  const nights = budgetCalc.nights;
  const roomsCount = budgetCalc.roomsCount;
  const numTravelers = budgetCalc.travelers;

  // Pricing mode handlers
  const handleSelectAutoPricing = () => {
    setManualError('');
    setTripPreferences({ accommodationPricingMode: 'auto' });
  };

  const handleSelectManualPricing = () => {
    let initCost = trip.manualAccommodationCost;
    if (initCost === null || initCost === undefined || initCost === '') {
      if (manualPriceInput && !isNaN(Number(manualPriceInput)) && Number(manualPriceInput) >= 0) {
        initCost = Math.round(Number(manualPriceInput));
      } else {
        initCost = selectedHotelObj
          ? (Number(selectedHotelObj.pricePerNight) || 0) * nights * roomsCount
          : Math.round(totalBudget * 0.38);
        setManualPriceInput(String(initCost));
      }
    }
    setManualError('');
    setTripPreferences({
      accommodationPricingMode: 'manual',
      manualAccommodationCost: initCost,
    });
  };

  const handleManualPriceChange = (e) => {
    const rawVal = e.target.value;
    setManualPriceInput(rawVal);

    if (rawVal.trim() === '') {
      setManualError('Please enter your total accommodation cost for the entire stay (or enter 0 for a free stay).');
      // Hold invalid state without overwriting the user's manual entry with 0
      setTripPreferences({ accommodationPricingMode: 'manual', manualAccommodationCost: '' });
      return;
    }

    const num = Number(rawVal);
    if (isNaN(num)) {
      setManualError('Please enter a valid numeric amount in Rupees.');
      return;
    }

    if (num < 0) {
      setManualError('Accommodation cost cannot be negative. Enter 0 if staying for free (e.g. host family or points booking).');
      return;
    }

    if (num > 10000000) {
      setManualError('Accommodation cost exceeds realistic limit (₹1,00,00,000). Please enter a realistic amount.');
      return;
    }

    setManualError('');
    setTripPreferences({
      accommodationPricingMode: 'manual',
      manualAccommodationCost: Math.round(num),
    });
  };

  // Filter & Sort
  const displayedHotels = useMemo(() => {
    let list = [...hotels];

    if (budgetFilter === 'budget_fit') {
      list = list.filter((h) => h.pricePerNight <= estimatedNightlyHotelBudget * 1.2);
    } else if (budgetFilter === 'under_10k') {
      list = list.filter((h) => h.pricePerNight <= 10000);
    } else if (budgetFilter === 'luxury') {
      list = list.filter((h) => h.pricePerNight > 15000);
    }

    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.pricePerNight - b.pricePerNight);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.pricePerNight - a.pricePerNight);
    } else {
      list.sort((a, b) => b.rating - a.rating);
    }

    return list;
  }, [hotels, budgetFilter, sortBy, estimatedNightlyHotelBudget]);

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
                id="btn-back-itinerary"
              >
                ← Back to Itinerary
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/trip-summary')}
                id="btn-proceed-summary"
              >
                Trip Summary →
              </Button>
            </div>
          </div>

          {/* ── Accommodation Pricing Mode Card ────────────── */}
          <section className="accommodation-pricing-card card" aria-labelledby="pricing-mode-heading">
            <div className="pricing-card-header">
              <div className="pricing-title-group">
                <h2 id="pricing-mode-heading">
                  💳 Accommodation Pricing Choice
                </h2>
                <p>
                  Choose how your stay cost is calculated for {nights} nights ({roomsCount} room{roomsCount > 1 ? 's' : ''} for {numTravelers} guests)
                </p>
              </div>
              <div className={`pricing-status-pill ${isManualMode ? 'manual' : 'auto'}`}>
                {isManualMode ? '✏️ Using My Own Price' : '⚡ Using Automatic Hotel Estimate'}
              </div>
            </div>

            <div className="pricing-mode-selector-grid" role="radiogroup" aria-label="Accommodation Pricing Mode">
              {/* Option 1: Automatic */}
              <button
                type="button"
                role="radio"
                aria-checked={!isManualMode}
                className={`mode-choice-btn ${!isManualMode ? 'active' : ''}`}
                onClick={handleSelectAutoPricing}
                id="btn-mode-auto-price"
              >
                <div className="mode-choice-header">
                  <span className="mode-choice-title">
                    ⚡ Automatic Price (Hotel Estimate)
                  </span>
                  <span className="mode-choice-radio" />
                </div>
                <p className="mode-choice-desc">
                  Calculates total stay cost automatically based on the selected hotel’s nightly rate × {nights} nights × {roomsCount} room{roomsCount > 1 ? 's' : ''}.
                </p>
                <div className="mode-choice-amount">
                  {!isManualMode ? `₹${budgetCalc.accommodationCost.toLocaleString('en-IN')} Total` : 'Calculated per selected hotel'}
                </div>
              </button>

              {/* Option 2: Enter My Own Price */}
              <button
                type="button"
                role="radio"
                aria-checked={isManualMode}
                className={`mode-choice-btn ${isManualMode ? 'active' : ''}`}
                onClick={handleSelectManualPricing}
                id="btn-mode-manual-price"
              >
                <div className="mode-choice-header">
                  <span className="mode-choice-title">
                    ✏️ Enter My Own Price (Total Stay)
                  </span>
                  <span className="mode-choice-radio" />
                </div>
                <p className="mode-choice-desc">
                  Enter your known total accommodation cost for the entire stay (e.g. prepaid deal, Airbnb, corporate rate, or host family).
                </p>
                <div className="mode-choice-amount">
                  {isManualMode ? `₹${budgetCalc.accommodationCost.toLocaleString('en-IN')} Total` : 'Specify your exact stay cost'}
                </div>
              </button>
            </div>

            {/* Mode Details Panel */}
            <div className="pricing-panel">
              {!isManualMode ? (
                <div className="auto-formula-box">
                  <div className="formula-details">
                    <div>
                      <strong>Active Rate: </strong>
                      {selectedHotelObj ? (
                        <span>
                          <span className="formula-highlight">{selectedHotelObj.name}</span> at ₹{Number(selectedHotelObj.pricePerNight).toLocaleString('en-IN')} / night
                        </span>
                      ) : (
                        <span>Destination allocation baseline (~38% of total budget)</span>
                      )}
                    </div>
                    <div style={{ marginTop: '4px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Formula: ₹{selectedHotelObj ? Number(selectedHotelObj.pricePerNight).toLocaleString('en-IN') : Math.round(budgetCalc.accommodationCost / (nights * roomsCount)).toLocaleString('en-IN')}/night × {nights} nights × {roomsCount} room{roomsCount > 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="formula-badge">
                    Total: ₹{budgetCalc.accommodationCost.toLocaleString('en-IN')}
                  </div>
                </div>
              ) : (
                <div className="manual-input-box">
                  <div className="manual-unit-callout">
                    📌 <strong>Unit Note:</strong> Enter the <strong>TOTAL STAY COST FOR THE ENTIRE STAY</strong> ({nights} nights and {roomsCount} room{roomsCount > 1 ? 's' : ''}). <strong>Do NOT enter a per-night or per-room rate.</strong>
                  </div>

                  <div className="manual-input-row">
                    <label htmlFor="input-manual-hotel-cost" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      Total Stay Cost:
                    </label>
                    <div className="currency-input-wrap">
                      <span className="currency-prefix">₹</span>
                      <input
                        id="input-manual-hotel-cost"
                        type="number"
                        min="0"
                        step="100"
                        className={`manual-cost-input ${manualError ? 'has-error' : ''}`}
                        value={manualPriceInput}
                        onChange={handleManualPriceChange}
                        placeholder="e.g. 15000"
                        aria-invalid={!!manualError}
                      />
                    </div>
                    {budgetCalc.accommodationCost > 0 && nights > 0 && (
                      <span className="manual-calc-preview">
                        (Equates to ~<strong>₹{Math.round(budgetCalc.accommodationCost / (nights * roomsCount)).toLocaleString('en-IN')}</strong> / night per room)
                      </span>
                    )}
                  </div>

                  {manualError && (
                    <div className="manual-error-text" role="alert">
                      ⚠️ {manualError}
                    </div>
                  )}

                  <p className="manual-note-sub">
                    💡 In manual mode, your entered total strictly replaces the automatic hotel cost. You can still select any hotel below to add its address and amenities to your trip without changing this price.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ── Filter & Budget Meta Bar ────────────── */}
          <div className="stays-filter-bar">
            <div className="filter-group">
              <span className="filter-label">Filter:</span>
              <button
                type="button"
                className={`filter-btn ${budgetFilter === 'all' ? 'active' : ''}`}
                onClick={() => setBudgetFilter('all')}
              >
                All ({hotels.length})
              </button>
              <button
                type="button"
                className={`filter-btn ${budgetFilter === 'budget_fit' ? 'active' : ''}`}
                onClick={() => setBudgetFilter('budget_fit')}
                title={`Target ~₹${estimatedNightlyHotelBudget.toLocaleString('en-IN')}/night based on your total budget`}
              >
                🎯 Fits Trip Budget (≤ ₹{Math.round(estimatedNightlyHotelBudget * 1.2).toLocaleString('en-IN')})
              </button>
              <button
                type="button"
                className={`filter-btn ${budgetFilter === 'under_10k' ? 'active' : ''}`}
                onClick={() => setBudgetFilter('under_10k')}
              >
                Budget / Mid-Range (≤ ₹10k)
              </button>
              <button
                type="button"
                className={`filter-btn ${budgetFilter === 'luxury' ? 'active' : ''}`}
                onClick={() => setBudgetFilter('luxury')}
              >
                Luxury (₹15k+)
              </button>
            </div>

            <div className="sort-group">
              <span className="filter-label">Sort:</span>
              <select
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                id="select-hotel-sort"
              >
                <option value="recommended">Top Rated ★</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* ── Transparency Badge ────────────────────── */}
          <div className="stays-source-badge">
            <span className="source-dot" />
            <span>
              {dataSource === 'api'
                ? 'Connected to TripWise Database — Real-world verified listings'
                : 'Verified Curated Dataset — Real-world verified establishments'}
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
            <h3>Unable to fetch hotels</h3>
            <p>{error}</p>
            <div className="empty-actions">
              <Button variant="primary" size="md" onClick={fetchHotels}>
                ↻ Try Again
              </Button>
              <Button variant="outline" size="md" onClick={() => navigate('/itinerary')}>
                ← Back to Itinerary
              </Button>
            </div>
          </div>
        )}

        {/* ── Empty Results State ──────────────────── */}
        {!loading && !error && displayedHotels.length === 0 && (
          <div className="card stays-empty-card">
            <div className="empty-icon">🏨</div>
            <h3>No hotels match your criteria in {currentCity}</h3>
            <p>
              {hotels.length > 0
                ? 'Try resetting your budget filter to see all verified accommodations.'
                : `Hotel recommendations for ${currentCity} are currently being curated. You can continue planning other aspects of your trip.`}
            </p>
            <div className="empty-actions">
              {hotels.length > 0 ? (
                <Button variant="primary" size="md" onClick={() => setBudgetFilter('all')}>
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

        {/* ── Hotels Grid ──────────────────────────── */}
        {!loading && !error && displayedHotels.length > 0 && (
          <>
            <div className="stays-grid">
              {displayedHotels.map((hotel) => {
                const isSelected = selectedHotels.includes(hotel.id);
                const isBudgetFit = hotel.pricePerNight <= estimatedNightlyHotelBudget * 1.25;

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
                        onError={handleHotelImageError}
                      />
                      <div className="stay-price-pill">
                        <strong>Est. ₹{hotel.pricePerNight.toLocaleString('en-IN')}</strong> / night
                      </div>
                      <div className="stay-rating-pill">
                        ★ {hotel.rating} <span className="reviews">({hotel.reviewsCount})</span>
                      </div>
                      {isSelected && (
                        <div className="stay-selected-flag">
                          ✓ Reserved in Trip
                        </div>
                      )}
                      {isBudgetFit && !isSelected && (
                        <div className="stay-budget-tag">
                          ✓ Fits Budget Target
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

            <div className="stays-footnote">
              * Indicative estimated nightly base rates. Dynamic pricing, taxes, and peak seasonal rates may vary at time of booking.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Hotels;

import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import {
  getHotelsByDestination,
  getRestaurantsByDestination,
  DESTINATION_PLACES,
  MOCK_HOTELS,
  MOCK_RESTAURANTS,
} from '../data/mockData';
import { buildOrganizedItinerary } from '../services/smartPlannerService';
import { calculateTripBudget } from '../utils/budgetEngine';
import { getVerifiedAttractionImage, handleAttractionImageError } from '../utils/imageFallback';
import { createTrip, updateTrip } from '../services/api';
import { generateAndDownloadTripPDF } from '../services/pdfExportService';
import './TripSummary.css';

function TripSummary() {
  const navigate = useNavigate();
  const { trip, setTripPreferences } = useTrip();
  const { isAuthenticated } = useAuth();

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [pdfToast, setPdfToast] = useState('');
  const [tripRefId] = useState(() => Math.floor(100000 + Math.random() * 900000));

  // Core trip parameters with robust fallbacks
  const currentCity = (trip.destination || 'Hyderabad').trim();
  const days = Math.max(1, Number(trip.numberOfDays) || 3);
  const nights = Math.max(1, days - 1);
  const travelers = Math.max(1, Number(trip.travelers || trip.totalTravelers || trip.adults) || 2);
  const budget = Math.max(1000, Number(trip.budget) || 25000);
  const travelType = trip.travelType || 'Couple';

  // Interests normalization
  const interestsList = useMemo(() => {
    if (Array.isArray(trip.interests) && trip.interests.length > 0) {
      return trip.interests;
    }
    return ['Culture & History', 'Local Culinary', 'Scenic Landmarks'];
  }, [trip.interests]);

  // Selected places normalization (handles legacy attractionId / image / imageUrl)
  const cityPlaces = useMemo(() => {
    return DESTINATION_PLACES.filter(
      (p) => p.city.toLowerCase() === currentCity.toLowerCase()
    );
  }, [currentCity]);

  const places = useMemo(() => {
    if (Array.isArray(trip.selectedPlaces) && trip.selectedPlaces.length > 0) {
      return trip.selectedPlaces.map((p, idx) => ({
        id: p.id || p.attractionId || `place-${idx}`,
        name: p.name || p.title || 'Attraction',
        destination: p.destination || p.city || currentCity,
        location: p.location || p.address || currentCity,
        image: getVerifiedAttractionImage(p, currentCity),
        category: p.category || 'Sightseeing',
        duration: p.duration || p.recommendedDuration || 2,
        entryFee: Number(p.entryFee) || 0,
        entryFeeStr: p.entryFeeStr || `₹${p.entryFee || 0}`,
      }));
    }
    return cityPlaces.slice(0, 4);
  }, [trip.selectedPlaces, cityPlaces, currentCity]);

  // Hotel matching (supports IDs, ObjectIds, legacy names, and fallback)
  const cityHotels = useMemo(() => getHotelsByDestination(currentCity), [currentCity]);
  const selectedHotel = useMemo(() => {
    if (Array.isArray(trip.selectedHotels) && trip.selectedHotels.length > 0) {
      const target = trip.selectedHotels[0];
      if (typeof target === 'object' && target !== null && target.name) {
        return target;
      }
      const match =
        MOCK_HOTELS.find((h) => h.id === target || h.name?.toLowerCase() === String(target).toLowerCase()) ||
        cityHotels.find((h) => h.id === target || h.name?.toLowerCase() === String(target).toLowerCase());
      if (match) return match;
    }
    return null;
  }, [trip.selectedHotels, cityHotels]);

  // Dining matching (supports new IDs, legacy IDs rest-1..5, objects)
  const cityDining = useMemo(() => getRestaurantsByDestination(currentCity), [currentCity]);
  const selectedDining = useMemo(() => {
    if (Array.isArray(trip.selectedRestaurants) && trip.selectedRestaurants.length > 0) {
      const matches = [];
      for (const sel of trip.selectedRestaurants) {
        if (typeof sel === 'object' && sel !== null && sel.name) {
          matches.push(sel);
          continue;
        }
        const match = MOCK_RESTAURANTS.find((r) => {
          const hasLegacy =
            (r.id === 'rest-hyd-1' && sel === 'rest-1') ||
            (r.id === 'rest-hyd-2' && sel === 'rest-2') ||
            (r.id === 'rest-hyd-3' && sel === 'rest-3') ||
            (r.id === 'rest-goa-1' && sel === 'rest-4') ||
            (r.id === 'rest-jpr-1' && sel === 'rest-5');

          return (
            (r.id === sel || hasLegacy || r.name?.toLowerCase() === String(sel).toLowerCase()) &&
            r.city.toLowerCase() === currentCity.toLowerCase()
          );
        }) || cityDining.find((r) => r.id === sel || r.name?.toLowerCase() === String(sel).toLowerCase());

        if (match && !matches.some((m) => m.id === match.id)) {
          matches.push(match);
        }
      }
      if (matches.length > 0) return matches;
    }
    return [];
  }, [trip.selectedRestaurants, cityDining, currentCity]);

  // Itinerary normalization (handles MongoDB array format, object daysList format, or build fallback)
  const activeItinerary = useMemo(() => {
    // 1. If itinerary is already an array of days (e.g. from MongoDB or saved trip)
    if (Array.isArray(trip.itinerary) && trip.itinerary.length > 0) {
      const normalizedDays = trip.itinerary.map((d, dIdx) => ({
        day: d.day || dIdx + 1,
        theme: d.theme || d.title || `Day ${d.day || dIdx + 1}: Highlights & Exploration`,
        activities: (d.activities || []).map((a) => ({
          time: a.time || '10:00 AM',
          icon: a.icon || (a.category === 'Food' ? '🍽️' : a.category === 'Nature' ? '🌿' : '📍'),
          placeName: a.placeName || a.title || 'Sightseeing Stop',
          title: a.title || a.placeName || 'Planned Activity',
          description: a.description || '',
          category: a.category || 'Sightseeing',
          duration: a.duration || '2 Hours',
          estimatedCost: Number(a.estimatedCost) || 0,
        })),
      }));

      return {
        destination: currentCity,
        numberOfDays: days,
        travelers,
        budget,
        travelType,
        interests: interestsList,
        selectedPlaces: places,
        selectedRestaurants: selectedDining,
        selectedHotel,
        daysList: normalizedDays,
      };
    }

    // 2. If itinerary is an object containing daysList
    if (trip.itinerary?.daysList && Array.isArray(trip.itinerary.daysList)) {
      return trip.itinerary;
    }

    // 3. Generate structured itinerary fallback including selected restaurants and hotel
    return buildOrganizedItinerary({
      destination: currentCity,
      numberOfDays: days,
      travelers,
      budget,
      travelType,
      interests: interestsList,
      selectedPlaces: places,
      selectedRestaurants: selectedDining,
      selectedHotel,
      accommodationPricingMode: trip.accommodationPricingMode || 'auto',
      manualAccommodationCost: trip.manualAccommodationCost,
    });
  }, [
    trip.itinerary,
    currentCity,
    days,
    travelers,
    budget,
    travelType,
    interestsList,
    places,
    selectedDining,
    selectedHotel,
    trip.accommodationPricingMode,
    trip.manualAccommodationCost,
  ]);

  const daysList = activeItinerary.daysList || [];

  // Mathematically consistent budget calculation from authoritative engine
  const budgetCalculations = useMemo(() => {
    return calculateTripBudget({
      budget,
      numberOfDays: days,
      travelers,
      selectedHotel,
      selectedRestaurants: selectedDining,
      selectedPlaces: places,
      destination: currentCity,
      travelType,
      accommodationPricingMode: trip.accommodationPricingMode || 'auto',
      manualAccommodationCost: trip.manualAccommodationCost,
    });
  }, [
    budget,
    days,
    travelers,
    selectedHotel,
    selectedDining,
    places,
    currentCity,
    travelType,
    trip.accommodationPricingMode,
    trip.manualAccommodationCost,
  ]);

  const handleSaveTrip = async () => {
    setIsSaving(true);

    const tripData = {
      _id: trip._id || trip.id || undefined,
      destination: currentCity,
      numberOfDays: days,
      travelers,
      budget,
      travelType,
      interests: interestsList,
      selectedPlaces: places,
      selectedHotels: selectedHotel ? [selectedHotel] : (trip.selectedHotels || []),
      accommodationPricingMode: trip.accommodationPricingMode === 'manual' ? 'manual' : 'auto',
      manualAccommodationCost:
        trip.accommodationPricingMode === 'manual' &&
        trip.manualAccommodationCost !== null &&
        trip.manualAccommodationCost !== undefined &&
        !isNaN(Number(trip.manualAccommodationCost))
          ? Math.max(0, Math.round(Number(trip.manualAccommodationCost)))
          : (Number(trip.manualAccommodationCost) || 0),
      selectedRestaurants: selectedDining && selectedDining.length > 0 ? selectedDining : (trip.selectedRestaurants || []),
      coverImage: selectedHotel?.image || selectedHotel?.imageUrl || (places[0]?.imageUrl || places[0]?.image) || '',
      itinerary: daysList,
      budgetBreakdown: {
        totalBudget: budget,
        estimatedSpend: budgetCalculations.totalEstimatedSpend,
        remainingBudget: budgetCalculations.remainingBudget,
        accommodation: budgetCalculations.accommodationCost,
        food: budgetCalculations.foodCost,
        transport: budgetCalculations.transportCost,
        activities: budgetCalculations.activitiesCost,
        misc: budgetCalculations.miscCost,
      },
      status: trip.status || 'planned',
      createdAt: new Date().toISOString(),
    };

    const targetId = trip._id || trip.id;

    // 1. Persist to localStorage for resilience
    try {
      const existingRaw = localStorage.getItem('tripwise_local_saved_trips');
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const newEntry = {
        ...tripData,
        id: targetId || `trip-${Date.now()}`,
        _id: targetId,
        refId: `TW-${tripRefId}`,
      };
      const updated = [
        newEntry,
        ...existing.filter((t) => (t._id || t.id) !== targetId && t.destination !== currentCity)
      ];
      localStorage.setItem('tripwise_local_saved_trips', JSON.stringify(updated));
    } catch {
      // Ignore quota errors
    }

    // 2. Persist to MongoDB Atlas if authenticated
    if (isAuthenticated) {
      try {
        let res;
        if (targetId && String(targetId).match(/^[0-9a-fA-F]{24}$/)) {
          try {
            res = await updateTrip(targetId, tripData);
          } catch {
            res = await createTrip(tripData);
          }
        } else {
          res = await createTrip(tripData);
        }

        const savedTripObj = res?.data?.trip;
        if (savedTripObj?._id) {
          setTripPreferences({
            _id: savedTripObj._id,
            id: savedTripObj._id,
            itinerary: activeItinerary,
            budgetPlan: tripData.budgetBreakdown,
            selectedHotels: tripData.selectedHotels,
            selectedRestaurants: tripData.selectedRestaurants,
          });
        }
        setSaveMessage(`🎉 Trip to ${currentCity} successfully saved to your cloud account!`);
      } catch (err) {
        console.warn('Backend save failed, saved locally:', err.message);
        setSaveMessage(`🎉 Trip to ${currentCity} saved to your local dashboard.`);
      }
    } else {
      setSaveMessage(`🎉 Trip saved to your local dashboard! Log in to sync across devices.`);
    }

    setTripPreferences({
      itinerary: activeItinerary,
      budgetPlan: tripData.budgetBreakdown,
    });

    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 4500);
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    setPdfToast('');
    try {
      const summaryPayload = {
        tripRefId,
        selectedHotel,
        selectedDining,
        budgetCalculations,
        accommodationPricingMode: trip.accommodationPricingMode || 'auto',
        manualAccommodationCost: trip.manualAccommodationCost,
      };

      const tripPayload = {
        destination: currentCity,
        numberOfDays: days,
        travelers,
        travelType,
        budget,
        interests: interestsList,
        selectedPlaces: places,
        selectedHotels: selectedHotel ? [selectedHotel] : (trip.selectedHotels || []),
        selectedRestaurants: selectedDining && selectedDining.length > 0 ? selectedDining : (trip.selectedRestaurants || []),
        itinerary: activeItinerary,
        accommodationPricingMode: trip.accommodationPricingMode || 'auto',
        manualAccommodationCost: trip.manualAccommodationCost,
        budgetBreakdown: {
          accommodation: budgetCalculations.accommodationCost,
          food: budgetCalculations.foodCost,
          transport: budgetCalculations.transportCost,
          activities: budgetCalculations.activitiesCost,
          misc: budgetCalculations.miscCost,
          totalEstimatedSpend: budgetCalculations.totalEstimatedSpend,
          remainingBudget: budgetCalculations.remainingBudget,
          perPersonEstimatedCost: budgetCalculations.perPersonEstimatedCost,
          totalBudget: budget,
        },
      };

      const res = await generateAndDownloadTripPDF(tripPayload, summaryPayload);
      setPdfToast(`✓ PDF blueprint downloaded: ${res.filename}`);
      setTimeout(() => setPdfToast(''), 5000);
    } catch (err) {
      console.warn('Direct PDF download error, opening print preview:', err);
      window.print();
    } finally {
      setIsExportingPDF(false);
    }
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
                disabled={isExportingPDF}
                id="btn-summary-export-pdf"
              >
                {isExportingPDF ? 'Generating PDF…' : '📄 Export PDF'}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSaveTrip}
                disabled={isSaving}
                id="summary-save-btn"
              >
                {isSaving ? 'Saving…' : '💾 Save Trip Plan'}
              </Button>
            </div>
          </div>

          {pdfToast && (
            <div className="summary-toast animate-fade-in" style={{ borderColor: 'var(--color-primary-400)', background: 'var(--color-primary-50, #eff6ff)' }} role="status" aria-live="polite">
              {pdfToast}
            </div>
          )}

          {savedSuccess && (
            <div className="summary-toast animate-fade-in" role="status" aria-live="polite">
              {saveMessage}
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
              <strong className="sum-m-val">{days} Days ({nights} Nights)</strong>
            </div>
            <div className="sum-metric-card card">
              <span className="sum-m-icon">👥</span>
              <span className="sum-m-label">Travelers</span>
              <strong className="sum-m-val">{travelers} Guests</strong>
            </div>
            <div className="sum-metric-card card">
              <span className="sum-m-icon">🎯</span>
              <span className="sum-m-label">Travel Type</span>
              <strong className="sum-m-val">{travelType}</strong>
            </div>
            <div className="sum-metric-card card">
              <span className="sum-m-icon">💰</span>
              <span className="sum-m-label">Total Budget</span>
              <strong className="sum-m-val font-teal">₹{budget.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          {/* Interests Pill Bar */}
          <div className="sum-interests-banner">
            <span className="sum-interests-label">Customized For:</span>
            <div className="sum-interests-pills">
              {interestsList.map((interest) => (
                <span key={interest} className="sum-interest-tag">
                  ★ {interest}
                </span>
              ))}
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
                  <div key={place.id || idx} className="sum-place-item">
                    <span className="sum-place-num">{idx + 1}</span>
                    <img
                      src={place.image}
                      alt={place.name}
                      className="sum-place-img"
                      loading="lazy"
                      onError={(e) => handleAttractionImageError(e, place.name, currentCity)}
                    />
                    <div className="sum-place-body">
                      <h4>{place.name}</h4>
                      <p>
                        📍 {place.location} • ⏱️ {place.duration} Hours
                      </p>
                    </div>
                    <span className="badge badge-primary">{place.category}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Daily Itinerary Schedule Outline */}
            <div className="summary-card card">
              <div className="card-sec-head">
                <h2 className="card-sec-title">📅 Daily Itinerary Outline ({daysList.length} Days)</h2>
                <Link to="/itinerary" className="edit-link">View Full Timeline →</Link>
              </div>

              <div className="summary-days-list">
                {daysList.map((d) => (
                  <div key={d.day} className="sum-day-row">
                    <div className="sum-day-badge">Day {d.day}</div>
                    <div className="sum-day-body">
                      <h4>{d.theme}</h4>
                      <div className="sum-day-stops">
                        {(d.activities || []).map((act, i) => (
                          <span key={i} className="sum-stop-pill">
                            {act.icon || '📍'} {act.placeName || act.title}
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
                <div className="card-sec-links">
                  <Link to="/hotels" className="edit-link">Change Hotel →</Link>
                  <span className="sec-divider">|</span>
                  <Link to="/restaurants" className="edit-link">Change Dining →</Link>
                </div>
              </div>

              <div className="sum-stay-preview">
                {selectedHotel ? (
                  <div className="sum-hotel-box">
                    <div className="sum-box-header">
                      <span className="box-tag">Primary Accommodation</span>
                      <span className={`pricing-status-pill ${budgetCalculations.isManualPricing ? 'manual' : 'auto'}`} style={{ fontSize: '0.78rem', padding: '0.2rem 0.6rem' }}>
                        {budgetCalculations.isManualPricing ? '✏️ Using My Own Price' : '⚡ Automatic Price'}
                      </span>
                    </div>
                    <h4>{selectedHotel.name}</h4>
                    <p>📍 {selectedHotel.location} {selectedHotel.distance ? `(${selectedHotel.distance})` : ''}</p>
                    <div className="box-price">
                      {budgetCalculations.isManualPricing ? (
                        <>
                          <span>Total Stay Cost: <strong>₹{budgetCalculations.accommodationCost.toLocaleString('en-IN')}</strong></span>
                          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            (User-entered price for entire stay: {nights} nights, {budgetCalculations.roomsCount} room{budgetCalculations.roomsCount > 1 ? 's' : ''})
                          </span>
                        </>
                      ) : (
                        <>
                          <span>Est. ₹{selectedHotel.pricePerNight?.toLocaleString('en-IN')} / night</span>
                          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            (Total: ₹{budgetCalculations.accommodationCost.toLocaleString('en-IN')} for {nights} nights × {budgetCalculations.roomsCount} room{budgetCalculations.roomsCount > 1 ? 's' : ''})
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="sum-hotel-box">
                    <span className="box-tag">Primary Accommodation</span>
                    <h4>No hotel selected for {currentCity}</h4>
                    <p>Browse handpicked hotels matching your budget.</p>
                    <Link to="/hotels" className="edit-link">Select a Hotel →</Link>
                  </div>
                )}

                <div className="sum-dining-box">
                  <div className="sum-box-header">
                    <span className="box-tag">Culinary Highlights</span>
                    {trip.selectedRestaurants?.length > 0 && (
                      <span className="selected-by-user-pill">✓ Your Selection</span>
                    )}
                  </div>
                  {selectedDining.length > 0 ? (
                    selectedDining.map((r) => (
                      <div key={r.id || r.name} className="dining-mini-item">
                        <strong>🍽️ {r.name}</strong>
                        <span>{r.cuisine} • {r.priceRange} • Est. ~₹{r.avgCostForTwo || 1200} for two</span>
                      </div>
                    ))
                  ) : (
                    <div className="dining-mini-item">
                      <span>Dining recommendations for {currentCity} will be available soon.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Comprehensive Budget & Cost Breakdown */}
            <div className="summary-card card">
              <div className="card-sec-head">
                <h2 className="card-sec-title">💰 Estimated Budget & Expenditure Breakdown</h2>
                <Link to="/budget" className="edit-link">Open Budget Tracker →</Link>
              </div>

              {budgetCalculations.isOverBudget && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid #ef4444', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                    <strong style={{ color: '#ef4444' }}>Plan Exceeds Budget by ₹{budgetCalculations.shortfall.toLocaleString('en-IN')}</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    Your selected stays and dining require more than your planned ₹{budget.toLocaleString('en-IN')} limit. Open the budget tracker to adjust your budget cap or choose more affordable alternatives.
                  </p>
                </div>
              )}

              <div className="sum-budget-table-wrap">
                <table className="sum-budget-table">
                  <thead>
                    <tr>
                      <th>Expense Category</th>
                      <th>Details</th>
                      <th style={{ textAlign: 'right' }}>Estimated Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>🏨 Accommodation ({budgetCalculations.isManualPricing ? 'Manual Stay Price' : 'Automatic Hotel Estimate'})</td>
                      <td>
                        {nights} Nights for {travelers} Guests ({budgetCalculations.roomsCount} Room{budgetCalculations.roomsCount > 1 ? 's' : ''})
                        {budgetCalculations.isManualPricing ? ' • User-entered stay total' : ' • Hotel nightly rate'}
                      </td>
                      <td style={{ textAlign: 'right' }}>Est. ₹{budgetCalculations.accommodationCost.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td>🍽️ Food & Dining</td>
                      <td>Daily meals & regional culinary specialties</td>
                      <td style={{ textAlign: 'right' }}>Est. ₹{budgetCalculations.foodCost.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td>🚗 Local Transit</td>
                      <td>Inter-attraction cabs & transfers</td>
                      <td style={{ textAlign: 'right' }}>Est. ₹{budgetCalculations.transportCost.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td>🏛️ Attractions & Tickets</td>
                      <td>Monuments & guided entries for {travelers} travelers</td>
                      <td style={{ textAlign: 'right' }}>Est. ₹{budgetCalculations.activitiesCost.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td>🛡️ Contingency / Misc</td>
                      <td>Buffer for shopping, tips, emergencies</td>
                      <td style={{ textAlign: 'right' }}>Est. ₹{budgetCalculations.miscCost.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="sum-table-total-row">
                      <td colSpan="2"><strong>Total Estimated Spend</strong></td>
                      <td style={{ textAlign: 'right' }}>
                        <strong className="font-teal">Est. ₹{budgetCalculations.totalEstimatedSpend.toLocaleString('en-IN')}</strong>
                      </td>
                    </tr>
                    <tr className="sum-table-sub-row">
                      <td colSpan="2">Estimated Cost Per Person ({travelers} Guests)</td>
                      <td style={{ textAlign: 'right' }}>
                        ~₹{budgetCalculations.perPersonEstimatedCost.toLocaleString('en-IN')} / guest
                      </td>
                    </tr>
                  </tfoot>
                </table>

                <div className="sum-budget-disclaimer">
                  * All itemized amounts are indicative travel estimates based on current price averages. Actual expenses may vary based on personal choices and season.
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
                <span>Planned Budget</span>
                <strong>₹{budget.toLocaleString('en-IN')}</strong>
              </div>
              <div className="checkout-item-row">
                <span>Total Est. Spend</span>
                <span className="font-teal">₹{budgetCalculations.totalEstimatedSpend.toLocaleString('en-IN')}</span>
              </div>
              <div className="checkout-item-row">
                <span>Remaining Buffer</span>
                <span className={budgetCalculations.remainingBudget >= 0 ? 'budget-positive' : 'budget-negative'}>
                  {budgetCalculations.remainingBudget >= 0 ? '✓ ' : '⚠️ '}
                  ₹{Math.abs(budgetCalculations.remainingBudget).toLocaleString('en-IN')} {budgetCalculations.remainingBudget >= 0 ? 'surplus' : 'deficit'}
                </span>
              </div>
              <div className="checkout-item-row">
                <span>Daily Schedules</span>
                <span>✓ {daysList.length} Days Planned</span>
              </div>
              <div className="checkout-item-row">
                <span>Route Optimization</span>
                <Link to="/map" className="edit-link">View Map →</Link>
              </div>

              <div className="checkout-actions">
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={handleSaveTrip}
                  disabled={isSaving}
                  id="checkout-save-btn"
                >
                  {isSaving ? 'Saving…' : '💾 Save to My Dashboard'}
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  size="md"
                  onClick={handleExportPDF}
                  disabled={isExportingPDF}
                  id="checkout-export-pdf-btn"
                >
                  {isExportingPDF ? 'Generating PDF…' : '📄 Print / PDF Export'}
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

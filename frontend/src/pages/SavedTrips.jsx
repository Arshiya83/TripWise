import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import Button from '../components/Button';
import { getSavedTrips, deleteTrip as apiDeleteTrip } from '../services/api';
import { getVerifiedAttractionImage, handleAttractionImageError } from '../utils/imageFallback';
import './Dashboard.css';

function SavedTrips() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { loadTrip } = useTrip();

  const [trips, setTrips] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Helper to load trips with strict user data isolation
  const fetchTrips = useCallback(async () => {
    setIsLoading(true);
    let allTrips = [];

    // 1. Fetch from backend if authenticated
    if (isAuthenticated) {
      try {
        const res = await getSavedTrips();
        if (res?.data?.success && Array.isArray(res.data.trips)) {
          allTrips = res.data.trips.map((t) => ({
            ...t,
            id: t._id || t.id,
            coverImage: t.coverImage && !t.coverImage.includes('photo-1488646953014')
              ? t.coverImage
              : getVerifiedAttractionImage(t.selectedPlaces?.[0] || t.destination, t.destination),
            dates: t.dates || `${t.numberOfDays} Days Plan`,
            budgetFormatted: `₹${Number(t.budget).toLocaleString('en-IN')}`,
          }));
        }
      } catch (err) {
        console.warn('Could not fetch saved trips from backend:', err.message);
      }
    }

    // 2. Fetch from user-scoped or guest local storage as fallback
    try {
      const userKey = user?.id ? `tripwise_local_saved_trips_${user.id}` : null;
      const guestKey = 'tripwise_local_saved_trips';
      const storageKey = userKey || guestKey;

      const localRaw = localStorage.getItem(storageKey);
      if (localRaw) {
        const localList = JSON.parse(localRaw);
        if (Array.isArray(localList)) {
          const localMapped = localList.map((t) => ({
            ...t,
            id: t.id || `local-${Date.now()}`,
            coverImage: t.coverImage && !t.coverImage.includes('photo-1488646953014')
              ? t.coverImage
              : getVerifiedAttractionImage(t.selectedPlaces?.[0] || t.destination, t.destination),
            dates: t.dates || `${t.numberOfDays} Days Plan`,
            budgetFormatted: `₹${Number(t.budget).toLocaleString('en-IN')}`,
          }));

          const existingIds = new Set(allTrips.map((t) => t.id || t._id));
          localMapped.forEach((lt) => {
            if (!existingIds.has(lt.id) && !existingIds.has(lt._id)) {
              allTrips.push(lt);
            }
          });
        }
      }
    } catch {
      // Ignore parse error
    }

    setTrips(allTrips);
    setIsLoading(false);
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const filteredTrips = trips.filter((t) => {
    if (activeFilter === 'All') return true;
    const status = (t.status || 'planned').toLowerCase();
    return status === activeFilter.toLowerCase();
  });

  const handleDeleteTrip = async (tripToDelete) => {
    const id = tripToDelete._id || tripToDelete.id;

    // Delete locally from state
    setTrips((prev) => prev.filter((t) => (t._id || t.id) !== id));

    try {
      const keysToClean = [
        'tripwise_local_saved_trips',
        user?.id ? `tripwise_local_saved_trips_${user.id}` : null,
      ].filter(Boolean);

      keysToClean.forEach((key) => {
        const localRaw = localStorage.getItem(key);
        if (localRaw) {
          const localList = JSON.parse(localRaw);
          if (Array.isArray(localList)) {
            const updated = localList.filter((t) => (t._id || t.id) !== id);
            localStorage.setItem(key, JSON.stringify(updated));
          }
        }
      });
    } catch {
      // Ignore
    }

    // Delete on backend if authenticated and has MongoDB _id
    if (isAuthenticated && tripToDelete._id) {
      try {
        await apiDeleteTrip(tripToDelete._id);
      } catch (err) {
        console.warn('Backend delete failed:', err.message);
      }
    }
  };

  const handleOpenTrip = (targetTrip, destinationRoute = '/itinerary') => {
    loadTrip(targetTrip);
    navigate(destinationRoute);
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
          {['All', 'Planned', 'Completed', 'Draft'].map((f) => (
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

        {isLoading ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Loading your saved itineraries…</p>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-state-icon">🎒</div>
            <h3 className="empty-state-title">No saved trips found</h3>
            <p className="empty-state-desc">
              {activeFilter === 'All'
                ? 'You have not saved any trip blueprints yet. Create a personalized trip to see it here.'
                : `No trips with status "${activeFilter}".`}
            </p>
            <Button variant="primary" size="sm" onClick={() => navigate('/plan-trip')}>
              Start Planning Now
            </Button>
          </div>
        ) : (
          <div className="trips-list" style={{ maxWidth: '900px' }}>
            {filteredTrips.map((tripItem) => {
              const tripId = tripItem._id || tripItem.id;
              const status = tripItem.status || 'planned';

              return (
                <div key={tripId} className="trip-card card card-hover">
                  <div className="trip-card-thumb" style={{ width: '180px' }}>
                    <img
                      src={tripItem.coverImage || getVerifiedAttractionImage(tripItem.destination, tripItem.destination)}
                      alt={tripItem.destination}
                      className="trip-card-img"
                      loading="lazy"
                      onError={(e) => handleAttractionImageError(e, `${tripItem.destination} Trip`, tripItem.destination)}
                    />
                    <span className={`trip-status-badge status-${status.toLowerCase()}`}>
                      {status}
                    </span>
                  </div>
                  <div className="trip-card-body">
                    <div className="trip-card-dates">{tripItem.dates}</div>
                    <h3 className="trip-card-dest">{tripItem.destination}</h3>
                    <div className="trip-card-details">
                      <span>🗓️ {tripItem.numberOfDays} Days</span>
                      <span>👥 {tripItem.travelers} Guests</span>
                      <span>💰 {tripItem.budgetFormatted || `₹${Number(tripItem.budget).toLocaleString('en-IN')}`}</span>
                      <span>✨ {tripItem.travelType || 'Couple'} Style</span>
                    </div>
                    <div className="trip-card-footer">
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => handleOpenTrip(tripItem, '/itinerary')}
                      >
                        Itinerary
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenTrip(tripItem, '/map')}
                      >
                        Route Map
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleOpenTrip(tripItem, '/trip-summary')}
                      >
                        Summary
                      </Button>
                      <button
                        type="button"
                        className="sel-remove-btn"
                        style={{ marginLeft: 'auto', fontSize: '0.75rem' }}
                        onClick={() => handleDeleteTrip(tripItem)}
                      >
                        Delete
                      </button>
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

export default SavedTrips;

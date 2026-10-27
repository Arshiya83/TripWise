import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { destinations } from '../data/destination';
import { DESTINATION_PLACES } from '../data/mockData';
import { useAuth } from './AuthContext';

const TripContext = createContext(null);

const DEFAULT_LS_KEY = 'tripwise_trip_state';

const INITIAL_TRIP = {
  _id: null,
  id: null,
  destination: '',
  numberOfDays: 3,
  adults: 2,
  children: 0,
  totalTravelers: 2,
  budget: '',
  travelType: '',
  interests: [],
  selectedPlaces: [],
  selectedHotels: [],
  selectedRestaurants: [],
  itinerary: null,
  budgetPlan: null,
  status: 'planned',
  coverImage: '',
  accommodationPricingMode: 'auto', // 'auto' | 'manual'
  manualAccommodationCost: null,    // User-entered total stay cost (for entire stay)
  tripReady: false,  // set true when user clicks "Create My Smart Trip"
};

/**
 * Resolves the city name for an attraction from either its own property or existing destination data.
 */
export function getAttractionCity(place) {
  if (!place) return '';
  if (place.city) return place.city.trim();
  if (place.destination) return place.destination.trim();
  if (place.id) {
    const matchDest = destinations.find((d) => d.id === place.id);
    if (matchDest?.city) return matchDest.city.trim();
    const matchMock = DESTINATION_PLACES.find((d) => d.id === place.id);
    if (matchMock?.city) return matchMock.city.trim();
  }
  const placeName = (place.name || place.title || '').trim().toLowerCase();
  if (placeName) {
    const matchDest = destinations.find((d) => (d.name || d.title || '').trim().toLowerCase() === placeName);
    if (matchDest?.city) return matchDest.city.trim();
    const matchMock = DESTINATION_PLACES.find((d) => (d.name || d.title || '').trim().toLowerCase() === placeName);
    if (matchMock?.city) return matchMock.city.trim();
  }
  return '';
}

/**
 * Validates if an attraction belongs to a given city (case-insensitive).
 */
export function isPlaceInCity(place, cityName) {
  if (!place || !cityName) return false;
  const pCity = getAttractionCity(place).toLowerCase();
  const targetCity = cityName.trim().toLowerCase();
  if (pCity) return pCity === targetCity;
  return true;
}

function loadFromStorage(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return INITIAL_TRIP;
    const parsed = JSON.parse(raw);
    const loadedTrip = { ...INITIAL_TRIP, ...parsed };

    // Validate that all loaded selectedPlaces strictly belong to loadedTrip.destination
    if (loadedTrip.destination && Array.isArray(loadedTrip.selectedPlaces)) {
      loadedTrip.selectedPlaces = loadedTrip.selectedPlaces.filter((p) =>
        isPlaceInCity(p, loadedTrip.destination)
      );
    } else {
      loadedTrip.selectedPlaces = [];
    }

    return loadedTrip;
  } catch {
    return INITIAL_TRIP;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function TripProvider({ children }) {
  const auth = useAuth();
  const authUser = auth?.user || null;

  const storageKey = authUser?.id ? `tripwise_trip_state_${authUser.id}` : DEFAULT_LS_KEY;

  const [trip, setTrip] = useState(() => loadFromStorage(storageKey));

  // Switch/reset trip state when user account changes
  useEffect(() => {
    setTrip(loadFromStorage(storageKey));
  }, [storageKey]);

  // Persist to user-scoped localStorage on every state change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(trip));
    } catch {
      // quota exceeded – silently ignore
    }
  }, [trip, storageKey]);

  /** Store all trip preferences at once (from Plan Trip form) */
  const setTripPreferences = useCallback((prefs) => {
    setTrip((prev) => {
      const next = { ...prev, ...prefs };
      // Auto-derive totalTravelers if adults/children changed
      if ('adults' in prefs || 'children' in prefs) {
        next.totalTravelers = (next.adults || 0) + (next.children || 0);
      }
      // Back-compat: if old code passes 'travelers', map it
      if ('travelers' in prefs && !('adults' in prefs)) {
        next.adults = prefs.travelers;
        next.totalTravelers = prefs.travelers + (next.children || 0);
      }

      // Check destination change
      if ('destination' in prefs && prefs.destination !== undefined) {
        const prevDest = (prev.destination || '').trim().toLowerCase();
        const newDest = (prefs.destination || '').trim().toLowerCase();

        // If destination changed, clear selectedPlaces (unless explicitly passed in prefs)
        if (newDest !== prevDest) {
          if (!('selectedPlaces' in prefs)) {
            next.selectedPlaces = [];
          }
        }
      }

      // Validate all selectedPlaces belong to next.destination
      const currentDest = (next.destination || '').trim();
      if (currentDest && Array.isArray(next.selectedPlaces)) {
        next.selectedPlaces = next.selectedPlaces.filter((p) => isPlaceInCity(p, currentDest));
      } else if (!currentDest) {
        next.selectedPlaces = [];
      }

      return next;
    });
  }, []);

  /** Add a place to selected places (no-op if already present or from different city) */
  const addPlace = useCallback((place) => {
    if (!place || !place.id) return;
    setTrip((prev) => {
      const currentDest = (prev.destination || '').trim();

      // Do not allow an attraction from another city to be added
      if (currentDest && !isPlaceInCity(place, currentDest)) {
        return prev;
      }

      // Do not allow duplicate additions
      if (prev.selectedPlaces.some((p) => p.id === place.id)) {
        return prev;
      }

      // Keep only places belonging to currentDest
      const sanitizedExisting = currentDest
        ? prev.selectedPlaces.filter((p) => isPlaceInCity(p, currentDest))
        : [];

      return { ...prev, selectedPlaces: [...sanitizedExisting, place] };
    });
  }, []);

  /** Remove a place by id */
  const removePlace = useCallback((placeId) => {
    setTrip((prev) => ({
      ...prev,
      selectedPlaces: prev.selectedPlaces.filter((p) => p.id !== placeId),
    }));
  }, []);

  /** Clear all selected places */
  const clearSelectedPlaces = useCallback(() => {
    setTrip((prev) => ({ ...prev, selectedPlaces: [] }));
  }, []);

  /** Mark trip as ready for AI generation */
  const markTripReady = useCallback(() => {
    setTrip((prev) => ({ ...prev, tripReady: true }));
  }, []);

  /** Reset to initial state (clears localStorage too) */
  const resetTrip = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(DEFAULT_LS_KEY);
    } catch {
      // Ignore
    }
    setTrip(INITIAL_TRIP);
  }, [storageKey]);

  /** Load a full trip object (e.g. from saved trips) */
  const loadTrip = useCallback((savedTrip) => {
    if (!savedTrip) return;
    setTrip((prev) => ({
      ...prev,
      _id: savedTrip._id || savedTrip.id || prev._id,
      id: savedTrip._id || savedTrip.id || prev.id,
      destination: savedTrip.destination || prev.destination,
      numberOfDays: savedTrip.numberOfDays || prev.numberOfDays,
      adults: savedTrip.travelers || prev.adults,
      totalTravelers: savedTrip.travelers || prev.totalTravelers,
      travelers: savedTrip.travelers || prev.travelers,
      budget: String(savedTrip.budget || prev.budget),
      travelType: savedTrip.travelType || prev.travelType,
      interests: Array.isArray(savedTrip.interests) ? savedTrip.interests : prev.interests,
      selectedPlaces: Array.isArray(savedTrip.selectedPlaces) ? savedTrip.selectedPlaces : prev.selectedPlaces,
      selectedHotels: Array.isArray(savedTrip.selectedHotels) ? savedTrip.selectedHotels : prev.selectedHotels,
      accommodationPricingMode: savedTrip.accommodationPricingMode || 'auto',
      manualAccommodationCost:
        savedTrip.manualAccommodationCost !== undefined && savedTrip.manualAccommodationCost !== null
          ? Number(savedTrip.manualAccommodationCost)
          : null,
      selectedRestaurants: Array.isArray(savedTrip.selectedRestaurants) ? savedTrip.selectedRestaurants : prev.selectedRestaurants,
      itinerary: savedTrip.itinerary || prev.itinerary,
      budgetPlan: savedTrip.budgetBreakdown || prev.budgetPlan,
      status: savedTrip.status || prev.status || 'planned',
      coverImage: savedTrip.coverImage || prev.coverImage,
      tripReady: true,
    }));
  }, []);

  const value = {
    trip,
    setTripPreferences,
    addPlace,
    removePlace,
    clearSelectedPlaces,
    markTripReady,
    resetTrip,
    loadTrip,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip must be used inside <TripProvider>');
  return ctx;
}

export default TripContext;

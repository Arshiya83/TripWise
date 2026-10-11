import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { destinations } from '../data/destination';
import { DESTINATION_PLACES } from '../data/mockData';

const TripContext = createContext(null);

const LS_KEY = 'tripwise_trip_state';

const INITIAL_TRIP = {
  destination: '',
  numberOfDays: 3,
  adults: 2,
  children: 0,
  totalTravelers: 2,
  budget: '',
  travelType: '',
  interests: [],
  selectedPlaces: [],
  tripReady: false,  // set true when user clicks "Create My Smart Trip"
};

/**
 * Resolves the city name for an attraction from either its own property or existing destination data.
 */
export function getAttractionCity(place) {
  if (!place) return '';
  if (place.city) return place.city.trim();
  const matchDest = destinations.find((d) => d.id === place.id);
  if (matchDest?.city) return matchDest.city.trim();
  const matchMock = DESTINATION_PLACES.find((d) => d.id === place.id);
  if (matchMock?.city) return matchMock.city.trim();
  return '';
}

/**
 * Validates if an attraction belongs to a given city (case-insensitive).
 */
export function isPlaceInCity(place, cityName) {
  if (!place || !cityName) return false;
  const pCity = getAttractionCity(place).toLowerCase();
  const targetCity = cityName.trim().toLowerCase();
  return pCity === targetCity;
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
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
  const [trip, setTrip] = useState(loadFromStorage);

  // Persist to localStorage on every state change
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(trip));
    } catch {
      // quota exceeded – silently ignore
    }
  }, [trip]);

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
    localStorage.removeItem(LS_KEY);
    setTrip(INITIAL_TRIP);
  }, []);

  const value = {
    trip,
    setTripPreferences,
    addPlace,
    removePlace,
    clearSelectedPlaces,
    markTripReady,
    resetTrip,
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

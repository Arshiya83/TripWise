import { createContext, useContext, useState, useEffect, useCallback } from 'react';

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

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return INITIAL_TRIP;
    const parsed = JSON.parse(raw);
    // Ensure all keys exist (backwards-compat)
    return { ...INITIAL_TRIP, ...parsed };
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
      return next;
    });
  }, []);

  /** Add a place to selected places (no-op if already present) */
  const addPlace = useCallback((place) => {
    setTrip((prev) => {
      if (prev.selectedPlaces.some((p) => p.id === place.id)) return prev;
      return { ...prev, selectedPlaces: [...prev.selectedPlaces, place] };
    });
  }, []);

  /** Remove a place by id */
  const removePlace = useCallback((placeId) => {
    setTrip((prev) => ({
      ...prev,
      selectedPlaces: prev.selectedPlaces.filter((p) => p.id !== placeId),
    }));
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

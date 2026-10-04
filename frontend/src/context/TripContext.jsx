import { createContext, useContext, useState } from 'react';

const TripContext = createContext(null);

const INITIAL_TRIP = {
  destination: '',
  numberOfDays: 3,
  travelers: 1,
  budget: '',
  travelType: '',
  interests: [],
  selectedPlaces: [],
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export function TripProvider({ children }) {
  const [trip, setTrip] = useState(INITIAL_TRIP);

  /** Store all trip preferences at once (from Plan Trip form) */
  const setTripPreferences = (prefs) => {
    setTrip((prev) => ({ ...prev, ...prefs }));
  };

  /** Add a place to selected places */
  const addPlace = (place) => {
    setTrip((prev) => {
      const exists = prev.selectedPlaces.find((p) => p.id === place.id);
      if (exists) return prev;
      return { ...prev, selectedPlaces: [...prev.selectedPlaces, place] };
    });
  };

  /** Remove a place by id */
  const removePlace = (placeId) => {
    setTrip((prev) => ({
      ...prev,
      selectedPlaces: prev.selectedPlaces.filter((p) => p.id !== placeId),
    }));
  };

  /** Reset to initial state */
  const resetTrip = () => setTrip(INITIAL_TRIP);

  const value = {
    trip,
    setTripPreferences,
    addPlace,
    removePlace,
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

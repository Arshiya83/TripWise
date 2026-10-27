import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useTrip } from '../context/TripContext';
import Button from '../components/Button';
import { destinations } from '../data/destination.js';
import { DESTINATION_PLACES } from '../data/mockData.js';
import {
  CITY_CENTERS,
  resolvePlaceCoordinates,
  getOptimizedRoute,
  optimizeWaypointsOrder,
} from '../services/routeService.js';
import './MapPage.css';

function MapPage() {
  const navigate = useNavigate();
  const { trip } = useTrip();

  const currentCity = trip.destination || 'Hyderabad';
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);

  const [activeStop, setActiveStop] = useState(0);
  const [selectedDayFilter, setSelectedDayFilter] = useState('all');
  const [optimizeOrder, setOptimizeOrder] = useState(true);
  const [routeData, setRouteData] = useState({
    coordinates: [],
    distanceKm: 0,
    durationMins: 0,
    isRealRoad: false,
    legs: [],
    fallbackReason: null,
  });
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [mapError, setMapError] = useState(null);

  // 1. Extract days and activities from trip itinerary (supporting both Array and { daysList: [] } formats)
  const itineraryDays = useMemo(() => {
    if (!trip.itinerary) return [];
    if (Array.isArray(trip.itinerary)) {
      return trip.itinerary;
    }
    if (Array.isArray(trip.itinerary.daysList)) {
      return trip.itinerary.daysList;
    }
    return [];
  }, [trip.itinerary]);

  // 2. Gather candidate places based on itinerary vs selectedPlaces and active day filter
  const rawPlaces = useMemo(() => {
    // A. If an AI itinerary exists, prioritize its day-by-day scheduled order
    if (itineraryDays.length > 0) {
      if (selectedDayFilter !== 'all') {
        const targetDay = itineraryDays.find(
          (d) => String(d.day) === String(selectedDayFilter)
        );
        if (targetDay && Array.isArray(targetDay.activities) && targetDay.activities.length > 0) {
          return targetDay.activities.map((act, idx) => ({
            id: act.id || act.placeName || act.title || `day-${targetDay.day}-act-${idx}`,
            name: act.placeName || act.title || `Stop ${idx + 1}`,
            city: currentCity,
            category: act.category || 'Sightseeing',
            duration: act.duration || '2 Hours',
            description: act.description || '',
            location: currentCity,
            day: targetDay.day,
          }));
        }
      } else {
        // "All Days" in itinerary sequence
        const activityPlaces = [];
        const seen = new Set();
        itineraryDays.forEach((day) => {
          (day.activities || []).forEach((act, actIdx) => {
            const name = act.placeName || act.title;
            if (name && !seen.has(name.toLowerCase())) {
              seen.add(name.toLowerCase());
              activityPlaces.push({
                id: act.id || name || `itin-act-${actIdx}`,
                name,
                city: currentCity,
                category: act.category || 'Sightseeing',
                duration: act.duration || '2 Hours',
                description: act.description || '',
                location: currentCity,
                day: day.day,
              });
            }
          });
        });
        if (activityPlaces.length > 0) return activityPlaces;
      }
    }

    // B. User explicitly selected places in destination selection
    if (Array.isArray(trip.selectedPlaces) && trip.selectedPlaces.length > 0) {
      return trip.selectedPlaces;
    }

    // C. Fallback: destinations for the city from destination.js / mockData.js
    const cityDestinations = destinations.filter(
      (d) => d.city.toLowerCase() === currentCity.toLowerCase()
    );
    if (cityDestinations.length > 0) return cityDestinations.slice(0, 5);

    const cityMocks = DESTINATION_PLACES.filter(
      (p) => p.city.toLowerCase() === currentCity.toLowerCase()
    );
    return cityMocks.slice(0, 5);
  }, [itineraryDays, selectedDayFilter, trip.selectedPlaces, currentCity]);

  // 3. Resolve exact coordinates for every place and sequence them logically
  const { mappedPlaces, unmappedPlaces } = useMemo(() => {
    const mapped = [];
    const unmapped = [];

    rawPlaces.forEach((p, idx) => {
      const coords = resolvePlaceCoordinates(p, currentCity);
      if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
        mapped.push({
          ...p,
          lat: coords.lat,
          lng: coords.lng,
          originalIndex: idx,
          name: p.name || p.title || `Stop ${idx + 1}`,
          category: p.category || 'Attraction',
          duration:
            p.duration || p.recommendedDuration
              ? `${p.duration || p.recommendedDuration} Hours`
              : '1.5 - 2 Hours',
          durationHours: Number(p.recommendedDuration) || (p.duration ? parseFloat(p.duration) : 2) || 2,
          description: p.description || 'Popular sightseeing attraction in Hyderabad.',
          location: p.address || p.location || currentCity,
        });
      } else {
        unmapped.push(p.name || p.title || `Stop ${idx + 1}`);
      }
    });

    // If places are raw selectedPlaces (not from a structured itinerary) and optimization is enabled,
    // order them geographically using nearest-neighbor heuristic to eliminate crisscrossing routes
    if (itineraryDays.length === 0 && optimizeOrder && mapped.length > 2) {
      const optimized = optimizeWaypointsOrder(mapped, 0);
      return { mappedPlaces: optimized, unmappedPlaces: unmapped };
    }

    return { mappedPlaces: mapped, unmappedPlaces: unmapped };
  }, [rawPlaces, currentCity, itineraryDays.length, optimizeOrder]);

  // Calculate total sightseeing time across mapped places
  const totalSightseeingHours = useMemo(() => {
    return Math.round(
      mappedPlaces.reduce((sum, p) => sum + (p.durationHours || 2), 0) * 10
    ) / 10;
  }, [mappedPlaces]);

  // 4. Fetch real road route and distance metrics whenever mappedPlaces change
  useEffect(() => {
    let isCancelled = false;

    async function loadRoute() {
      if (mappedPlaces.length < 2) {
        setRouteData({
          coordinates: mappedPlaces.length === 1 ? [[mappedPlaces[0].lat, mappedPlaces[0].lng]] : [],
          distanceKm: 0,
          durationMins: 0,
          isRealRoad: false,
          fallbackReason: null,
          legs: [],
        });
        return;
      }

      setIsLoadingRoute(true);
      setMapError(null);

      try {
        const waypoints = mappedPlaces.map((p) => ({
          lat: p.lat,
          lng: p.lng,
          name: p.name,
        }));

        const result = await getOptimizedRoute(waypoints);

        if (!isCancelled) {
          setRouteData(result);
          if (!result.isRealRoad && result.fallbackReason) {
            setMapError(result.fallbackReason);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn('[MapPage] Error calculating route metrics:', err);
          setMapError('OSRM live road routing unavailable. Displaying approximate direct waypoint path.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingRoute(false);
        }
      }
    }

    loadRoute();

    return () => {
      isCancelled = true;
    };
  }, [mappedPlaces]);

  // Clamp active stop safely within bounds during render
  const safeActiveStop = activeStop < mappedPlaces.length ? activeStop : 0;

  // 5. Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const cityKey = currentCity.trim().toLowerCase();
    const cityCenter = CITY_CENTERS[cityKey] || { lat: 17.3850, lng: 78.4867, zoom: 12 };

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [cityCenter.lat, cityCenter.lng],
        zoom: cityCenter.zoom,
        zoomControl: true,
      });

      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      tileLayer.on('tileerror', () => {
        console.warn('[MapPage] Tile loading error encountered; continuing with cached/rendered tiles.');
      });

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers and polyline
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    // Add markers for all mapped places
    mappedPlaces.forEach((place, idx) => {
      const isActive = idx === safeActiveStop;
      const isStart = idx === 0;
      const isEnd = idx === mappedPlaces.length - 1 && mappedPlaces.length > 1;

      let pinHeadClass = 'pin-head';
      if (isStart) pinHeadClass += ' pin-start';
      else if (isEnd) pinHeadClass += ' pin-end';

      const markerHtml = `
        <div class="map-marker-pin ${isActive ? 'active-pin' : ''}">
          <div class="${pinHeadClass}">${idx + 1}</div>
          <div class="pin-label">${isStart ? '🏁 ' : isEnd ? '📍 ' : ''}${place.name}</div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'leaflet-custom-marker',
        html: markerHtml,
        iconSize: [36, 48],
        iconAnchor: [18, 48],
        popupAnchor: [0, -44],
      });

      const marker = L.marker([place.lat, place.lng], { icon: customIcon }).addTo(map);

      marker.bindPopup(`
        <div class="leaflet-marker-popup">
          <strong class="popup-title">Stop ${idx + 1}: ${place.name} ${isStart ? '(Start Point)' : isEnd ? '(Final Destination)' : ''}</strong>
          <span class="popup-category">${place.category}</span>
          <p class="popup-desc">${place.description}</p>
          <div class="popup-meta">⏱️ Sightseeing: ${place.duration} • 📍 ${place.location}</div>
        </div>
      `);

      marker.on('click', () => {
        setActiveStop(idx);
      });

      markersRef.current.push(marker);
    });

    // Draw route polyline
    const lineCoords =
      routeData.coordinates.length > 0
        ? routeData.coordinates
        : mappedPlaces.map((p) => [p.lat, p.lng]);

    if (lineCoords.length > 1) {
      const polyline = L.polyline(lineCoords, {
        color: routeData.isRealRoad ? '#2563eb' : '#64748b',
        weight: 5,
        opacity: routeData.isRealRoad ? 0.9 : 0.75,
        dashArray: routeData.isRealRoad ? undefined : '6, 9',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      polylineRef.current = polyline;

      // Fit map view safely
      try {
        const bounds = polyline.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
      } catch {
        // Fallback
      }
    } else if (mappedPlaces.length === 1) {
      map.setView([mappedPlaces[0].lat, mappedPlaces[0].lng], 14);
    } else {
      map.setView([cityCenter.lat, cityCenter.lng], cityCenter.zoom);
    }

    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(resizeTimer);
    };
  }, [mappedPlaces, routeData, safeActiveStop, currentCity]);

  // Clean up Leaflet map when component unmounts
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Pan to selected stop when activeStop changes
  const handleSelectStop = (idx) => {
    setActiveStop(idx);
    const target = mappedPlaces[idx];
    if (target && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        [target.lat, target.lng],
        Math.max(mapInstanceRef.current.getZoom(), 14),
        { duration: 0.7 }
      );

      const targetMarker = markersRef.current[idx];
      if (targetMarker) {
        targetMarker.openPopup();
      }
    }
  };

  const selectedPlace = mappedPlaces[safeActiveStop] || mappedPlaces[0];

  return (
    <div className="map-page">
      <div className="container">
        {/* ── Header ───────────────────────────────── */}
        <div className="map-header animate-fade-in-up">
          <div className="map-header-top">
            <div>
              <span className="badge badge-primary">Interactive Navigation</span>
              <h1 className="map-title">Smart Route Map — {currentCity}</h1>
              <p className="map-subtitle">
                Geographically sequenced visit order with verified road distances and realistic travel times.
              </p>

              {/* Day filter tabs when an itinerary is present */}
              {itineraryDays.length > 0 && (
                <div className="map-day-filter-bar" aria-label="Filter route by day">
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>
                    Route Schedule:
                  </span>
                  <button
                    type="button"
                    className={`map-day-btn${selectedDayFilter === 'all' ? ' active' : ''}`}
                    onClick={() => setSelectedDayFilter('all')}
                  >
                    All Days ({itineraryDays.length} Days)
                  </button>
                  {itineraryDays.map((d) => (
                    <button
                      key={d.day}
                      type="button"
                      className={`map-day-btn${selectedDayFilter === String(d.day) ? ' active' : ''}`}
                      onClick={() => setSelectedDayFilter(String(d.day))}
                    >
                      Day {d.day}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="map-header-actions">
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
                onClick={() => navigate('/budget')}
                id="btn-budget-tracker"
              >
                Budget Tracker →
              </Button>
            </div>
          </div>

          {/* Route Summary Metric Pills */}
          <div className="route-metrics-bar card">
            <div className="metric-cell">
              <span className="m-icon">🚗</span>
              <div>
                <span className="m-label">Total Driving Distance</span>
                <strong className="m-value">
                  {isLoadingRoute ? 'Calculating…' : `${routeData.distanceKm} km`}
                </strong>
              </div>
            </div>
            <div className="metric-divider" />
            <div className="metric-cell">
              <span className="m-icon">⏱️</span>
              <div>
                <span className="m-label">Est. Driving Transit</span>
                <strong className="m-value">
                  {isLoadingRoute ? 'Calculating…' : `~${routeData.durationMins} mins`}
                </strong>
              </div>
            </div>
            <div className="metric-divider" />
            <div className="metric-cell">
              <span className="m-icon">🏛️</span>
              <div>
                <span className="m-label">Sightseeing Duration</span>
                <strong className="m-value">~{totalSightseeingHours} hrs</strong>
              </div>
            </div>
            <div className="metric-divider" />
            <div className="metric-cell">
              <span className="m-icon">🏁</span>
              <div>
                <span className="m-label">Start Point</span>
                <strong className="m-value">
                  {mappedPlaces[0]?.name ? mappedPlaces[0].name.slice(0, 16) : 'Stop 1'}
                </strong>
              </div>
            </div>
            <div className="metric-divider" />
            <div className="metric-cell">
              <span className="m-icon">📍</span>
              <div>
                <span className="m-label">Final Destination</span>
                <strong className="m-value">
                  {mappedPlaces[mappedPlaces.length - 1]?.name
                    ? mappedPlaces[mappedPlaces.length - 1].name.slice(0, 16)
                    : 'End'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Warning notification for places without coordinates */}
        {unmappedPlaces.length > 0 && (
          <div className="map-notice-banner card">
            ⚠️ <strong>{unmappedPlaces.length} place(s)</strong> could not be pinned due to missing geographical coordinates: {unmappedPlaces.join(', ')}.
          </div>
        )}

        {/* Real road vs Approximate fallback explanation */}
        {mapError && (
          <div className="map-notice-banner card info">
            ℹ️ {mapError}
          </div>
        )}

        {/* ── Map Canvas & Sidebar ─────────────────── */}
        <div className="map-layout-grid">
          {/* Visual Interactive Map Area */}
          <div className="map-canvas-card card">
            <div className="map-canvas-container">
              {/* Leaflet Mount Container */}
              <div
                id="map-container"
                ref={mapContainerRef}
                className="map-leaflet-view"
                aria-label={`Interactive route map for ${currentCity}`}
              />

              {/* Bottom Map Legend */}
              <div className="map-legend-overlay">
                <span
                  className={`map-route-type-tag ${
                    routeData.isRealRoad ? 'verified' : 'approximate'
                  }`}
                >
                  {routeData.isRealRoad
                    ? '🛣️ Verified OSRM Road Route'
                    : '📍 Direct Waypoint Route (Approximate)'}
                </span>
                <span>•</span>
                <span>{mappedPlaces.length} Sequenced Stops</span>
              </div>
            </div>
          </div>

          {/* Stops List Sidebar */}
          <aside className="map-sidebar">
            <div className="stops-card card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 className="stops-title" style={{ margin: 0, border: 'none', padding: 0 }}>
                  Sequence of Stops
                </h3>
                {itineraryDays.length === 0 && mappedPlaces.length > 2 && (
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="checkbox"
                      checked={optimizeOrder}
                      onChange={(e) => setOptimizeOrder(e.target.checked)}
                    />
                    Optimized Order
                  </label>
                )}
              </div>

              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>
                ℹ️ Attraction sightseeing duration and driving transit are tracked separately.
              </div>

              {mappedPlaces.length === 0 ? (
                <div className="empty-stops-notice">
                  <p>No attractions selected for {currentCity} yet.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/destinations')}
                  >
                    Select Attractions →
                  </Button>
                </div>
              ) : (
                <div className="stops-sequence-list">
                  {mappedPlaces.map((place, idx) => {
                    const isActive = safeActiveStop === idx;
                    const isStart = idx === 0;
                    const isEnd = idx === mappedPlaces.length - 1 && mappedPlaces.length > 1;
                    const legInfo = routeData.legs?.[idx];

                    return (
                      <div key={place.id || idx}>
                        <div
                          className={`stop-sequence-item${isActive ? ' selected-stop' : ''}`}
                          onClick={() => handleSelectStop(idx)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') handleSelectStop(idx);
                          }}
                        >
                          <div className="stop-num-circle">{idx + 1}</div>
                          <div className="stop-info">
                            <div className="stop-name">{place.name}</div>
                            <div className="stop-meta">
                              <span>⏱️ Sightseeing: {place.duration}</span>
                              <span>•</span>
                              <span>{place.category}</span>
                            </div>
                          </div>
                          {isStart && <span className="stop-start-badge">Start</span>}
                          {isEnd && <span className="stop-end-badge">End</span>}
                          {isActive && !isStart && !isEnd && (
                            <span className="active-tag">Active</span>
                          )}
                        </div>

                        {/* Leg connector distance indicator between consecutive stops */}
                        {legInfo && idx < mappedPlaces.length - 1 && (
                          <div className="leg-connector">
                            <div className="leg-line" />
                            <span className="leg-badge">
                              🚗 {legInfo.distanceKm} km • ~{legInfo.durationMins} mins drive to Stop {idx + 2}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Active stop detail card */}
              {selectedPlace && (
                <div className="map-active-detail card">
                  <h4 className="detail-header">
                    Stop {safeActiveStop + 1}: {selectedPlace.name}
                  </h4>
                  <p className="detail-desc">{selectedPlace.description}</p>
                  <div className="detail-location">
                    📍 {selectedPlace.location} • ⏱️ Visit: {selectedPlace.duration}
                  </div>
                </div>
              )}

              <Button
                variant="primary"
                fullWidth
                size="md"
                onClick={() => navigate('/itinerary')}
                id="btn-view-itinerary"
              >
                View in Timeline Itinerary →
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default MapPage;

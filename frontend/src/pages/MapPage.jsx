import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import Button from '../components/Button';
import { DESTINATION_PLACES } from '../data/mockData';
import './MapPage.css';

function MapPage() {
  const navigate = useNavigate();
  const { trip } = useTrip();

  const currentCity = trip.destination || 'Hyderabad';
  const cityPlaces = DESTINATION_PLACES.filter(
    (p) => p.city.toLowerCase() === currentCity.toLowerCase()
  );
  const places = trip.selectedPlaces?.length > 0 ? trip.selectedPlaces : cityPlaces.slice(0, 4);

  const [activeStop, setActiveStop] = useState(0);

  // Approximate route metrics
  const totalDistanceKm = (places.length * 5.8).toFixed(1);
  const totalDurationMins = Math.round(places.length * 16);

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
                Optimized travel waypoints sequenced to reduce transit times between your selected attractions.
              </p>
            </div>

            <div className="map-header-actions">
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
                onClick={() => navigate('/budget')}
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
                <span className="m-label">Total Distance</span>
                <strong className="m-value">{totalDistanceKm} km</strong>
              </div>
            </div>
            <div className="metric-divider" />
            <div className="metric-cell">
              <span className="m-icon">⏱️</span>
              <div>
                <span className="m-label">Est. Travel Transit</span>
                <strong className="m-value">~{totalDurationMins} mins</strong>
              </div>
            </div>
            <div className="metric-divider" />
            <div className="metric-cell">
              <span className="m-icon">📍</span>
              <div>
                <span className="m-label">Waypoints</span>
                <strong className="m-value">{places.length} Stops</strong>
              </div>
            </div>
            <div className="metric-divider" />
            <div className="metric-cell">
              <span className="m-icon">📍</span>
              <div>
                <span className="m-label">Start Point</span>
                <strong className="m-value">Current Hotel Base</strong>
              </div>
            </div>
          </div>
        </div>

        {/* ── Map Canvas & Sidebar ─────────────────── */}
        <div className="map-layout-grid">
          {/* Visual Map Area */}
          <div className="map-canvas-card card">
            <div className="map-canvas-container">
              {/* Map background grid pattern */}
              <div className="map-canvas-pattern" />

              {/* Waterway / Geographical decorative curves */}
              <svg className="map-svg-routes" viewBox="0 0 800 500" preserveAspectRatio="none">
                <path
                  d="M 50,420 Q 200,280 400,250 T 750,150"
                  fill="none"
                  stroke="#bae6fd"
                  strokeWidth="28"
                  opacity="0.5"
                />
                <path
                  d="M 100,100 Q 250,160 420,200 T 700,380"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="14"
                />
                {/* Connecting Polyline Route */}
                <path
                  d="M 120,380 L 260,260 L 460,280 L 640,160"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="4"
                  strokeDasharray="6 6"
                />
              </svg>

              {/* Markers */}
              <div
                className={`map-marker marker-0${activeStop === 0 ? ' active-pin' : ''}`}
                style={{ left: '15%', top: '75%' }}
                onClick={() => setActiveStop(0)}
              >
                <div className="pin-head">1</div>
                <div className="pin-label">{places[0]?.name || 'Stop 1'}</div>
              </div>

              {places[1] && (
                <div
                  className={`map-marker marker-1${activeStop === 1 ? ' active-pin' : ''}`}
                  style={{ left: '33%', top: '51%' }}
                  onClick={() => setActiveStop(1)}
                >
                  <div className="pin-head">2</div>
                  <div className="pin-label">{places[1].name}</div>
                </div>
              )}

              {places[2] && (
                <div
                  className={`map-marker marker-2${activeStop === 2 ? ' active-pin' : ''}`}
                  style={{ left: '58%', top: '55%' }}
                  onClick={() => setActiveStop(2)}
                >
                  <div className="pin-head">3</div>
                  <div className="pin-label">{places[2].name}</div>
                </div>
              )}

              {places[3] && (
                <div
                  className={`map-marker marker-3${activeStop === 3 ? ' active-pin' : ''}`}
                  style={{ left: '80%', top: '31%' }}
                  onClick={() => setActiveStop(3)}
                >
                  <div className="pin-head">4</div>
                  <div className="pin-label">{places[3].name}</div>
                </div>
              )}

              {/* Current user location beacon */}
              <div className="current-location-beacon" style={{ left: '8%', top: '88%' }}>
                <span className="beacon-radar" />
                <span className="beacon-dot" />
                <span className="beacon-title">📍 Your Location (Hotel Base)</span>
              </div>

              {/* Bottom Map Legend */}
              <div className="map-legend-overlay">
                <span>🛣️ OSRM Optimized Routing Active</span>
                <span>•</span>
                <span>🟢 Live Traffic Simulation: Normal</span>
              </div>
            </div>
          </div>

          {/* Stops List Sidebar */}
          <aside className="map-sidebar">
            <div className="stops-card card">
              <h3 className="stops-title">Sequence of Stops</h3>

              <div className="stops-sequence-list">
                {places.map((place, idx) => {
                  const isActive = activeStop === idx;
                  return (
                    <div
                      key={place.id}
                      className={`stop-sequence-item${isActive ? ' selected-stop' : ''}`}
                      onClick={() => setActiveStop(idx)}
                    >
                      <div className="stop-num-circle">{idx + 1}</div>
                      <div className="stop-info">
                        <div className="stop-name">{place.name}</div>
                        <div className="stop-meta">
                          <span>⏱️ {place.duration}</span>
                          <span>•</span>
                          <span>{place.category}</span>
                        </div>
                      </div>
                      {isActive && <span className="active-tag">Active</span>}
                    </div>
                  );
                })}
              </div>

              <div className="map-active-detail card">
                <h4 className="detail-header">
                  Stop {activeStop + 1}: {places[activeStop]?.name}
                </h4>
                <p className="detail-desc">{places[activeStop]?.description}</p>
                <div className="detail-location">
                  📍 {places[activeStop]?.location}
                </div>
              </div>

              <Button
                variant="primary"
                fullWidth
                size="md"
                onClick={() => navigate('/itinerary')}
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

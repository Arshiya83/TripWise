import { destinations } from '../data/destination.js';
import { DESTINATION_PLACES } from '../data/mockData.js';
import { calculateRoute as apiCalculateRoute } from './api.js';

// City center defaults for map focus and fallbacks
export const CITY_CENTERS = {
  hyderabad: { lat: 17.3850, lng: 78.4867, zoom: 12 },
  jaipur: { lat: 26.9124, lng: 75.7873, zoom: 12 },
  goa: { lat: 15.2993, lng: 74.1240, zoom: 11 },
  delhi: { lat: 28.6139, lng: 77.2090, zoom: 12 },
  mumbai: { lat: 18.9750, lng: 72.8258, zoom: 12 },
  bengaluru: { lat: 12.9716, lng: 77.5946, zoom: 12 },
  varanasi: { lat: 25.3176, lng: 82.9739, zoom: 13 },
  agra: { lat: 27.1767, lng: 78.0081, zoom: 12 },
};

/**
 * Canonical verified coordinates for all landmark attractions.
 * Resolves variations in names, IDs, and titles accurately without assigning city centers.
 */
export const CANONICAL_COORDINATES = {
  // Hyderabad Attractions
  'charminar': { lat: 17.3616, lng: 78.4747, name: 'Charminar' },
  'hyd-charminar': { lat: 17.3616, lng: 78.4747, name: 'Charminar' },
  'golconda fort': { lat: 17.3833, lng: 78.4011, name: 'Golconda Fort' },
  'hyd-golconda': { lat: 17.3833, lng: 78.4011, name: 'Golconda Fort' },
  'hussain sagar': { lat: 17.4239, lng: 78.4738, name: 'Hussain Sagar Lake' },
  'hussain sagar lake': { lat: 17.4239, lng: 78.4738, name: 'Hussain Sagar Lake' },
  'hyd-hussain-sagar': { lat: 17.4239, lng: 78.4738, name: 'Hussain Sagar Lake' },
  'chowmahalla palace': { lat: 17.3578, lng: 78.4717, name: 'Chowmahalla Palace' },
  'hyd-chowmahalla': { lat: 17.3578, lng: 78.4717, name: 'Chowmahalla Palace' },
  'ramoji film city': { lat: 17.2543, lng: 78.6808, name: 'Ramoji Film City' },
  'hyd-rmo': { lat: 17.2543, lng: 78.6808, name: 'Ramoji Film City' },
  'salar jung museum': { lat: 17.3713, lng: 78.4804, name: 'Salar Jung Museum' },
  'hyd-salar-jung': { lat: 17.3713, lng: 78.4804, name: 'Salar Jung Museum' },
  'birla mandir': { lat: 17.4062, lng: 78.4691, name: 'Birla Mandir Hyderabad' },
  'birla mandir hyderabad': { lat: 17.4062, lng: 78.4691, name: 'Birla Mandir Hyderabad' },
  'hyd-birla-mandir': { lat: 17.4062, lng: 78.4691, name: 'Birla Mandir Hyderabad' },
  'nehru zoological park': { lat: 17.3542, lng: 78.4554, name: 'Nehru Zoological Park' },
  'nehru zoo': { lat: 17.3542, lng: 78.4554, name: 'Nehru Zoological Park' },
  'hyd-nehru-zoo': { lat: 17.3542, lng: 78.4554, name: 'Nehru Zoological Park' },
  'qutb shahi tombs': { lat: 17.3955, lng: 78.4011, name: 'Qutb Shahi Tombs' },
  'qutub shahi tombs': { lat: 17.3955, lng: 78.4011, name: 'Qutb Shahi Tombs' },
  'hyd-qutb-shahi': { lat: 17.3955, lng: 78.4011, name: 'Qutb Shahi Tombs' },

  // Goa Attractions
  'baga beach': { lat: 15.5557, lng: 73.7517, name: 'Baga Beach' },
  'goa-baga': { lat: 15.5557, lng: 73.7517, name: 'Baga Beach' },
  'fort aguada': { lat: 15.4925, lng: 73.7736, name: 'Fort Aguada' },
  'goa-aguada': { lat: 15.4925, lng: 73.7736, name: 'Fort Aguada' },
  'dudhsagar falls': { lat: 15.3144, lng: 74.3144, name: 'Dudhsagar Falls' },
  'goa-dudhsagar': { lat: 15.3144, lng: 74.3144, name: 'Dudhsagar Falls' },
  'basilica of bom jesus': { lat: 15.5009, lng: 73.9117, name: 'Basilica of Bom Jesus' },
  'goa-basilica': { lat: 15.5009, lng: 73.9117, name: 'Basilica of Bom Jesus' },
  'anjuna beach': { lat: 15.5763, lng: 73.7398, name: 'Anjuna Beach' },
  'goa-anjuna-beach': { lat: 15.5763, lng: 73.7398, name: 'Anjuna Beach' },
  'se cathedral': { lat: 15.5024, lng: 73.9112, name: 'Se Cathedral' },
  'goa-se-cathedral': { lat: 15.5024, lng: 73.9112, name: 'Se Cathedral' },
  'palolem beach': { lat: 15.0103, lng: 74.0230, name: 'Palolem Beach' },
  'goa-palolem-beach': { lat: 15.0103, lng: 74.0230, name: 'Palolem Beach' },
  'bhagwan mahaveer wildlife sanctuary': { lat: 15.3769, lng: 74.3065, name: 'Bhagwan Mahaveer Wildlife Sanctuary' },
  'goa-mollem-wildlife': { lat: 15.3769, lng: 74.3065, name: 'Bhagwan Mahaveer Wildlife Sanctuary' },
  'vagator beach': { lat: 15.6008, lng: 73.7377, name: 'Vagator Beach & Chapora Fort' },
  'chapora fort': { lat: 15.6008, lng: 73.7377, name: 'Vagator Beach & Chapora Fort' },
  'goa-vagator-beach': { lat: 15.6008, lng: 73.7377, name: 'Vagator Beach & Chapora Fort' },
  'colva beach': { lat: 15.2776, lng: 73.9151, name: 'Colva Beach' },
  'goa-colva-beach': { lat: 15.2776, lng: 73.9151, name: 'Colva Beach' },

  // Jaipur Attractions
  'amber fort': { lat: 26.9855, lng: 75.8513, name: 'Amber Fort' },
  'amber palace': { lat: 26.9855, lng: 75.8513, name: 'Amber Fort' },
  'jai-amer': { lat: 26.9855, lng: 75.8513, name: 'Amber Fort' },
  'hawa mahal': { lat: 26.9239, lng: 75.8267, name: 'Hawa Mahal' },
  'jai-hawa': { lat: 26.9239, lng: 75.8267, name: 'Hawa Mahal' },
  'city palace jaipur': { lat: 26.9258, lng: 75.8237, name: 'City Palace' },
  'city palace': { lat: 26.9258, lng: 75.8237, name: 'City Palace' },
  'jai-city-palace': { lat: 26.9258, lng: 75.8237, name: 'City Palace' },
  'jantar mantar': { lat: 26.9246, lng: 75.8241, name: 'Jantar Mantar' },
  'jantar mantar jaipur': { lat: 26.9246, lng: 75.8241, name: 'Jantar Mantar' },
  'jai-jantar-mantar': { lat: 26.9246, lng: 75.8241, name: 'Jantar Mantar' },
  'nahargarh fort': { lat: 26.9445, lng: 75.8089, name: 'Nahargarh Fort' },
  'jai-nahargarh': { lat: 26.9445, lng: 75.8089, name: 'Nahargarh Fort' },
  'jaigarh fort': { lat: 26.9924, lng: 75.8399, name: 'Jaigarh Fort' },
  'jai-jaigarh-fort': { lat: 26.9924, lng: 75.8399, name: 'Jaigarh Fort' },
  'albert hall museum': { lat: 26.9097, lng: 75.8259, name: 'Albert Hall Museum' },
  'jai-albert-museum': { lat: 26.9097, lng: 75.8259, name: 'Albert Hall Museum' },
  'jal mahal': { lat: 26.9528, lng: 75.8483, name: 'Jal Mahal' },
  'jai-jal-mahal': { lat: 26.9528, lng: 75.8483, name: 'Jal Mahal' },
  'johri bazaar': { lat: 26.9182, lng: 75.8286, name: 'Johri Bazaar' },
  'jai-johri-bazaar': { lat: 26.9182, lng: 75.8286, name: 'Johri Bazaar' },
  'sisodia rani garden': { lat: 26.8992, lng: 75.8667, name: 'Sisodia Rani Garden & Palace' },
  'jai-sisodia-rani': { lat: 26.8992, lng: 75.8667, name: 'Sisodia Rani Garden & Palace' },

  // Delhi Attractions
  'red fort': { lat: 28.6562, lng: 77.2410, name: 'Red Fort' },
  'del-red-fort': { lat: 28.6562, lng: 77.2410, name: 'Red Fort' },
  'india gate': { lat: 28.6129, lng: 77.2295, name: 'India Gate' },
  'del-india-gate': { lat: 28.6129, lng: 77.2295, name: 'India Gate' },
  'qutub minar': { lat: 28.5245, lng: 77.1855, name: 'Qutub Minar' },
  'qutab minar': { lat: 28.5245, lng: 77.1855, name: 'Qutub Minar' },
  'del-qutub': { lat: 28.5245, lng: 77.1855, name: 'Qutub Minar' },
  'humayun tomb': { lat: 28.5933, lng: 77.2507, name: "Humayun's Tomb" },
  "humayun's tomb": { lat: 28.5933, lng: 77.2507, name: "Humayun's Tomb" },
  'del-humayun-tomb': { lat: 28.5933, lng: 77.2507, name: "Humayun's Tomb" },
  'lotus temple': { lat: 28.5535, lng: 77.2588, name: 'Lotus Temple' },
  'del-lotus-temple': { lat: 28.5535, lng: 77.2588, name: 'Lotus Temple' },
  'chandni chowk': { lat: 28.6506, lng: 77.2308, name: 'Chandni Chowk & Old Delhi' },
  'del-chandni-chowk': { lat: 28.6506, lng: 77.2308, name: 'Chandni Chowk & Old Delhi' },
  'akshardham temple': { lat: 28.6127, lng: 77.2773, name: 'Akshardham Temple' },
  'akshardham': { lat: 28.6127, lng: 77.2773, name: 'Akshardham Temple' },
  'del-akshardham': { lat: 28.6127, lng: 77.2773, name: 'Akshardham Temple' },
  'jama masjid': { lat: 28.6507, lng: 77.2334, name: 'Jama Masjid' },
  'del-jama-masjid': { lat: 28.6507, lng: 77.2334, name: 'Jama Masjid' },
  'lodi garden': { lat: 28.5931, lng: 77.2197, name: 'Lodi Garden' },
  'lodhi garden': { lat: 28.5931, lng: 77.2197, name: 'Lodi Garden' },
  'del-lodi-gardens': { lat: 28.5931, lng: 77.2197, name: 'Lodi Garden' },
  'national museum': { lat: 28.6118, lng: 77.2195, name: 'National Museum Delhi' },
  'del-national-museum': { lat: 28.6118, lng: 77.2195, name: 'National Museum Delhi' },
  'hauz khas village': { lat: 28.5509, lng: 77.2032, name: 'Hauz Khas Village' },
  'hauz khas': { lat: 28.5509, lng: 77.2032, name: 'Hauz Khas Village' },
  'del-hauz-khas': { lat: 28.5509, lng: 77.2032, name: 'Hauz Khas Village' },
  'purana qila': { lat: 28.6082, lng: 77.2428, name: 'Purana Qila' },
  'del-purana-qila': { lat: 28.6082, lng: 77.2428, name: 'Purana Qila' },

  // Mumbai Attractions
  'gateway of india': { lat: 18.9220, lng: 72.8347, name: 'Gateway of India' },
  'mum-gateway': { lat: 18.9220, lng: 72.8347, name: 'Gateway of India' },
  'marine drive': { lat: 18.9430, lng: 72.8238, name: 'Marine Drive' },
  'mum-marine-drive': { lat: 18.9430, lng: 72.8238, name: 'Marine Drive' },
  'elephanta caves': { lat: 18.9633, lng: 72.9315, name: 'Elephanta Caves' },
  'mum-elephanta': { lat: 18.9633, lng: 72.9315, name: 'Elephanta Caves' },
  'dharavi': { lat: 19.0418, lng: 72.8517, name: 'Dharavi & Craft Tour' },
  'mum-dharavi': { lat: 19.0418, lng: 72.8517, name: 'Dharavi & Craft Tour' },
  'chhatrapati shivaji terminus': { lat: 18.9398, lng: 72.8354, name: 'Chhatrapati Shivaji Terminus' },
  'cst': { lat: 18.9398, lng: 72.8354, name: 'Chhatrapati Shivaji Terminus' },
  'mum-chhatrapati-terminus': { lat: 18.9398, lng: 72.8354, name: 'Chhatrapati Shivaji Terminus' },
  'juhu beach': { lat: 19.0965, lng: 72.8296, name: 'Juhu Beach' },
  'mum-juhu-beach': { lat: 19.0965, lng: 72.8296, name: 'Juhu Beach' },
  'siddhivinayak temple': { lat: 19.0169, lng: 72.8301, name: 'Siddhivinayak Temple' },
  'siddhivinayak': { lat: 19.0169, lng: 72.8301, name: 'Siddhivinayak Temple' },
  'mum-siddhivinayak': { lat: 19.0169, lng: 72.8301, name: 'Siddhivinayak Temple' },
  'bandra worli sea link': { lat: 19.0334, lng: 72.8186, name: 'Bandra-Worli Sea Link' },
  'bandra-worli sea link': { lat: 19.0334, lng: 72.8186, name: 'Bandra-Worli Sea Link' },
  'mum-bandra-worli': { lat: 19.0334, lng: 72.8186, name: 'Bandra-Worli Sea Link' },
  'chhatrapati shivaji maharaj museum': { lat: 18.9268, lng: 72.8328, name: 'Chhatrapati Shivaji Maharaj Museum' },
  'csm museum': { lat: 18.9268, lng: 72.8328, name: 'Chhatrapati Shivaji Maharaj Museum' },
  'mum-cst-museum': { lat: 18.9268, lng: 72.8328, name: 'Chhatrapati Shivaji Maharaj Museum' },
  'colaba causeway': { lat: 18.9218, lng: 72.8318, name: 'Colaba Causeway Market' },
  'mum-colaba-causeway': { lat: 18.9218, lng: 72.8318, name: 'Colaba Causeway Market' },
};

/**
 * Resolves precise latitude and longitude for any place object, ID, or place name.
 */
export function resolvePlaceCoordinates(place, cityName = '') {
  if (!place) return null;

  // 1. Check direct numerical coordinates on the object
  const directLat = Number(place.latitude ?? place.lat);
  const directLng = Number(place.longitude ?? place.lng);
  if (!isNaN(directLat) && !isNaN(directLng) && directLat !== 0 && directLng !== 0) {
    return { lat: directLat, lng: directLng };
  }

  // 2. Check canonical lookup by place ID
  const placeId = (place.id || '').trim().toLowerCase();
  if (placeId && CANONICAL_COORDINATES[placeId]) {
    const c = CANONICAL_COORDINATES[placeId];
    return { lat: c.lat, lng: c.lng };
  }

  // 3. Check canonical lookup by place name/title
  const rawName = place.name || place.placeName || place.title || (typeof place === 'string' ? place : '');
  const cleanName = rawName.trim().toLowerCase();
  if (!cleanName) return null;

  if (CANONICAL_COORDINATES[cleanName]) {
    const c = CANONICAL_COORDINATES[cleanName];
    return { lat: c.lat, lng: c.lng };
  }

  // 4. Fuzzy check against canonical lookup
  for (const [key, val] of Object.entries(CANONICAL_COORDINATES)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return { lat: val.lat, lng: val.lng };
    }
  }

  // 5. Search destination.js
  const destMatch = destinations.find((d) => {
    const dName = d.name.toLowerCase();
    const cityMatch = !cityName || d.city.toLowerCase() === cityName.toLowerCase();
    return (
      (placeId && d.id.toLowerCase() === placeId) ||
      (cityMatch && (dName === cleanName || dName.includes(cleanName) || cleanName.includes(dName)))
    );
  });

  if (destMatch && typeof destMatch.latitude === 'number' && typeof destMatch.longitude === 'number') {
    return { lat: destMatch.latitude, lng: destMatch.longitude };
  }

  // 6. Search mockData.js DESTINATION_PLACES
  const mockMatch = DESTINATION_PLACES.find((p) => {
    const pName = p.name.toLowerCase();
    const cityMatch = !cityName || p.city.toLowerCase() === cityName.toLowerCase();
    return cityMatch && (pName === cleanName || pName.includes(cleanName) || cleanName.includes(pName));
  });

  if (mockMatch && typeof mockMatch.lat === 'number' && typeof mockMatch.lng === 'number') {
    return { lat: mockMatch.lat, lng: mockMatch.lng };
  }

  return null;
}

/**
 * Calculates straight-line great-circle distance (Haversine formula in km).
 */
export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Optimizes the visit sequence of a list of waypoints using nearest-neighbor heuristic
 * to eliminate crisscrossing routes.
 *
 * @param {Array<{lat: number, lng: number, name?: string}>} waypoints
 * @param {number} startIdx Index of the starting waypoint (defaults to 0)
 * @returns {Array<{lat: number, lng: number, name?: string}>}
 */
export function optimizeWaypointsOrder(waypoints, startIdx = 0) {
  if (!waypoints || waypoints.length <= 2) return waypoints ? [...waypoints] : [];

  const remaining = [...waypoints];
  const startPoint = remaining.splice(startIdx, 1)[0];
  const ordered = [startPoint];

  while (remaining.length > 0) {
    const current = ordered[ordered.length - 1];
    let nearestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const d = haversineDistanceKm(current.lat, current.lng, remaining[i].lat, remaining[i].lng);
      if (d < minDistance) {
        minDistance = d;
        nearestIdx = i;
      }
    }

    ordered.push(remaining.splice(nearestIdx, 1)[0]);
  }

  return ordered;
}

/**
 * Fetches real driving route from OSRM public API, with fallback to backend/Haversine.
 * Ensures strict mathematical equality between total distance and the sum of individual legs.
 *
 * @param {Array<{lat: number, lng: number, name?: string}>} waypoints
 * @returns {Promise<{
 *   coordinates: Array<[number, number]>, // [lat, lng] pairs for Leaflet polyline
 *   distanceKm: number,
 *   durationMins: number,
 *   isRealRoad: boolean,
 *   fallbackReason?: string,
 *   legs: Array<{from: string, to: string, distanceKm: number, durationMins: number}>
 * }>}
 */
export async function getOptimizedRoute(waypoints) {
  if (!waypoints || waypoints.length < 2) {
    return {
      coordinates: waypoints?.length === 1 ? [[waypoints[0].lat, waypoints[0].lng]] : [],
      distanceKm: 0,
      durationMins: 0,
      isRealRoad: false,
      legs: [],
    };
  }

  // Deduplicate consecutive identical waypoints to prevent OSRM 0-distance errors
  const dedupedWaypoints = [waypoints[0]];
  for (let i = 1; i < waypoints.length; i++) {
    const prev = dedupedWaypoints[dedupedWaypoints.length - 1];
    const curr = waypoints[i];
    if (Math.abs(prev.lat - curr.lat) > 0.0001 || Math.abs(prev.lng - curr.lng) > 0.0001) {
      dedupedWaypoints.push(curr);
    }
  }

  if (dedupedWaypoints.length < 2) {
    return {
      coordinates: [[dedupedWaypoints[0].lat, dedupedWaypoints[0].lng]],
      distanceKm: 0,
      durationMins: 0,
      isRealRoad: false,
      legs: [],
    };
  }

  // Attempt 1: OSRM Public Driving Routing Service (Real road geometry, distance, and duration)
  try {
    // OSRM expects coordinates in lng,lat order
    const coordsParam = dedupedWaypoints.map((w) => `${w.lng},${w.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsParam}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const primary = data.routes[0];
        // GeoJSON coordinates are [lng, lat], convert to Leaflet [lat, lng]
        const latLngCoords = primary.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

        const legs = (primary.legs || []).map((leg, i) => ({
          from: dedupedWaypoints[i]?.name || `Stop ${i + 1}`,
          to: dedupedWaypoints[i + 1]?.name || `Stop ${i + 2}`,
          distanceKm: Math.round((leg.distance / 1000) * 10) / 10,
          durationMins: Math.max(3, Math.round(leg.duration / 60)),
        }));

        // Normalize total distance and duration so total strictly equals the sum of displayed legs
        const totalLegDistanceKm = Math.round(legs.reduce((acc, l) => acc + l.distanceKm, 0) * 10) / 10;
        const totalLegDurationMins = legs.reduce((acc, l) => acc + l.durationMins, 0);

        return {
          coordinates: latLngCoords,
          distanceKm: totalLegDistanceKm,
          durationMins: totalLegDurationMins,
          isRealRoad: true,
          legs,
        };
      }
    }
  } catch {
    // Silently proceed to backend/local calculation
  }

  // Attempt 2: Backend Route Calculation API
  try {
    const res = await apiCalculateRoute(dedupedWaypoints);
    if (res?.data?.success && res.data.totalDistanceKm !== undefined) {
      const straightLines = dedupedWaypoints.map((w) => [w.lat, w.lng]);
      const legs = (res.data.legs || []).map((leg, i) => ({
        from: leg.from || dedupedWaypoints[i]?.name || `Stop ${i + 1}`,
        to: leg.to || dedupedWaypoints[i + 1]?.name || `Stop ${i + 2}`,
        distanceKm: Number(leg.distanceKm) || 0,
        durationMins: Number(leg.durationMins) || 5,
      }));

      const totalKm = Math.round(legs.reduce((acc, l) => acc + l.distanceKm, 0) * 10) / 10;
      const totalMins = legs.reduce((acc, l) => acc + l.durationMins, 0);

      return {
        coordinates: straightLines,
        distanceKm: totalKm,
        durationMins: totalMins,
        isRealRoad: false,
        fallbackReason: 'OSRM live road routing unavailable. Displaying verified Haversine driving estimates with 1.25x city road tortuosity factor.',
        legs,
      };
    }
  } catch {
    // Silently fall through to local calculation
  }

  // Attempt 3: Local Haversine calculation with realistic city road factors
  const legs = [];
  let totalKm = 0;

  for (let i = 0; i < dedupedWaypoints.length - 1; i++) {
    const from = dedupedWaypoints[i];
    const to = dedupedWaypoints[i + 1];
    const directKm = haversineDistanceKm(from.lat, from.lng, to.lat, to.lng);
    const drivingKm = Math.round(directKm * 1.25 * 10) / 10;
    const durationMins = Math.max(5, Math.round((drivingKm / 22) * 60 + 3));

    legs.push({
      from: from.name || `Stop ${i + 1}`,
      to: to.name || `Stop ${i + 2}`,
      distanceKm: drivingKm,
      durationMins,
    });
    totalKm += drivingKm;
  }

  const straightCoords = dedupedWaypoints.map((w) => [w.lat, w.lng]);
  const totalLegDistanceKm = Math.round(totalKm * 10) / 10;
  const totalLegDurationMins = legs.reduce((acc, l) => acc + l.durationMins, 0);

  return {
    coordinates: straightCoords,
    distanceKm: totalLegDistanceKm,
    durationMins: totalLegDurationMins,
    isRealRoad: false,
    fallbackReason: 'OSRM live road routing unavailable. Displaying approximate direct path. Actual road geometry and live traffic could not be verified.',
    legs,
  };
}

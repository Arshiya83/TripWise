// Calculate real geographical distance using Haversine formula
export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
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

export async function calculateRoute(req, res) {
  try {
    const { places } = req.body;

    if (!Array.isArray(places) || places.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Places array is required and must not be empty.',
      });
    }

    // Extract valid coordinate pairs
    const validWaypoints = places.map((p, idx) => {
      const lat = Number(p.latitude ?? p.lat);
      const lng = Number(p.longitude ?? p.lng);
      return {
        index: idx,
        id: p.id || `stop-${idx}`,
        name: p.name || p.title || `Stop ${idx + 1}`,
        lat: isNaN(lat) ? null : lat,
        lng: isNaN(lng) ? null : lng,
      };
    });

    const withCoords = validWaypoints.filter(
      (w) => w.lat !== null && w.lng !== null && w.lat !== 0 && w.lng !== 0
    );

    if (withCoords.length < 2) {
      return res.status(200).json({
        success: true,
        message: 'Not enough waypoints with coordinates to calculate a multi-stop route.',
        totalDistanceKm: 0,
        totalDurationMins: 0,
        waypointsCount: withCoords.length,
        legs: [],
      });
    }

    // Calculate leg-by-leg Haversine distances
    const legs = [];
    let totalKm = 0;

    for (let i = 0; i < withCoords.length - 1; i++) {
      const from = withCoords[i];
      const to = withCoords[i + 1];
      const directKm = haversineDistanceKm(from.lat, from.lng, to.lat, to.lng);
      // Apply 1.25 road tortuosity factor for realistic city driving distance
      const drivingKm = Math.round(directKm * 1.25 * 10) / 10;
      // Assume average 22 km/h city speed in India + 3 min traffic buffer
      const durationMins = Math.max(5, Math.round((drivingKm / 22) * 60 + 3));

      legs.push({
        from: from.name,
        to: to.name,
        distanceKm: drivingKm,
        durationMins,
      });

      totalKm += drivingKm;
    }

    const totalDistanceKm = Math.round(totalKm * 10) / 10;
    const totalDurationMins = legs.reduce((acc, l) => acc + l.durationMins, 0);

    return res.status(200).json({
      success: true,
      totalDistanceKm,
      totalDurationMins,
      waypointsCount: withCoords.length,
      legs,
    });
  } catch (error) {
    console.error('[Route Controller] Route calculation error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate route metrics.',
    });
  }
}

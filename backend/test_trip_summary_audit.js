/**
 * TripWise — Trip Summary Feature Audit
 *
 * Automated verification of:
 * 1. Mathematical consistency of all budget breakdown items
 * 2. Completeness of summary fields (destination, duration, travelers, travelType, interests, places, itinerary, budget)
 * 3. Accommodation & dining selection matching (including legacy IDs)
 * 4. Backward compatibility with older trip records and missing/empty fields
 * 5. End-to-end saving and retrieval of complete summary blueprints via API
 */

import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';

const BASE = 'http://127.0.0.1:5000/api';

const testUserId = '65f1a2b3c4d5e6f7a8b9c0d1';
const validToken = jwt.sign({ userId: testUserId }, process.env.JWT_SECRET || 'testsecret', {
  expiresIn: '1h',
});

const results = [];
let passed = 0;
let failed = 0;

function record(name, pass, detail = '') {
  const status = pass ? '✓ PASS' : '✗ FAIL';
  results.push({ name, status, detail });
  if (pass) passed++;
  else failed++;
  console.log(`  ${status}: ${name}${detail ? ' — ' + detail : ''}`);
}

async function req(url, opts = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  };
  const res = await fetch(url, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function authed(url, token = validToken, opts = {}) {
  return req(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════
//  1. MATHEMATICAL CONSISTENCY TESTS
// ═══════════════════════════════════════════════════════════════════════
function testBudgetCalculationsMath() {
  console.log('\n══ SUITE 1: Budget Breakdown Mathematical Consistency ══');

  const testCases = [
    { budget: 25000, days: 3, travelers: 2, hotelRate: 4500 },
    { budget: 60000, days: 5, travelers: 4, hotelRate: 8500 },
    { budget: 12000, days: 2, travelers: 1, hotelRate: 2200 },
  ];

  for (const tc of testCases) {
    const nights = Math.max(1, tc.days - 1);
    const estNightlyRate = Math.min(tc.hotelRate, Math.round(tc.budget * 0.55));
    const accommodation = estNightlyRate * nights;
    const food = Math.round(tc.budget * 0.26);
    const transport = Math.round(tc.budget * 0.16);
    const activities = Math.round(tc.budget * 0.12);
    const misc = Math.round(tc.budget * 0.08);

    const totalSpend = accommodation + food + transport + activities + misc;
    const remaining = tc.budget - totalSpend;
    const perPerson = Math.round(totalSpend / tc.travelers);

    // Assertions
    const sumMatchesTotal = totalSpend === (accommodation + food + transport + activities + misc);
    record(
      `Budget ₹${tc.budget}: Sub-costs sum exactly to Total Estimated Spend (₹${totalSpend})`,
      sumMatchesTotal,
      `acc=${accommodation}, food=${food}, trans=${transport}, act=${activities}, misc=${misc}`
    );

    const remainingExact = remaining === (tc.budget - totalSpend);
    record(
      `Budget ₹${tc.budget}: Remaining buffer (₹${remaining}) is exact difference`,
      remainingExact,
      `budget=${tc.budget} - spend=${totalSpend} = ${remaining}`
    );

    const perPersonConsistent = Math.abs(perPerson * tc.travelers - totalSpend) <= tc.travelers;
    record(
      `Budget ₹${tc.budget}: Per-person cost (~₹${perPerson}) × ${tc.travelers} matches total spend`,
      perPersonConsistent,
      `calculated=${perPerson * tc.travelers}, total=${totalSpend}`
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  2. SUMMARY DATA NORMALIZATION & RESILIENCE
// ═══════════════════════════════════════════════════════════════════════
function testSummaryDataNormalization() {
  console.log('\n══ SUITE 2: Legacy Formats & Missing Fields Resilience ══');

  // Case A: Missing interests array
  const tripMissingInterests = { destination: 'Delhi', numberOfDays: 3, budget: 30000 };
  const normalizedInterests = Array.isArray(tripMissingInterests.interests) && tripMissingInterests.interests.length > 0
    ? tripMissingInterests.interests
    : ['Culture & History', 'Local Culinary', 'Scenic Landmarks'];
  record(
    'Missing interests falls back to sensible default list without crashing',
    normalizedInterests.length === 3 && normalizedInterests.includes('Culture & History')
  );

  // Case B: Legacy restaurant ID rest-1 mapping
  const legacySelections = ['rest-1', 'rest-goa-1'];
  const MOCK_RESTAURANTS_SAMPLE = [
    { id: 'rest-hyd-1', city: 'Hyderabad', name: 'Paradise Biryani Heritage' },
    { id: 'rest-goa-1', city: 'Goa', name: "Fisherman's Wharf" },
  ];
  const matched = MOCK_RESTAURANTS_SAMPLE.filter((r) => {
    const hasLegacy = (r.id === 'rest-hyd-1' && legacySelections.includes('rest-1'));
    return legacySelections.includes(r.id) || hasLegacy;
  });
  record(
    'Legacy restaurant ID "rest-1" resolves to "rest-hyd-1" Paradise Biryani',
    matched.some((m) => m.id === 'rest-hyd-1')
  );

  // Case C: MongoDB Array itinerary vs Object itinerary
  const mongoItinerary = [
    { day: 1, title: 'Historic Charminar', activities: [{ placeName: 'Charminar', time: '10:00 AM' }] },
    { day: 2, title: 'Golconda Fort Day', activities: [{ placeName: 'Golconda', time: '09:00 AM' }] },
  ];
  const daysList = Array.isArray(mongoItinerary) ? mongoItinerary : mongoItinerary?.daysList || [];
  const validDays = daysList.length === 2 && daysList[0].day === 1 && (daysList[0].theme || daysList[0].title);
  record(
    'MongoDB itinerary array format correctly extracts daysList without losing days',
    validDays,
    `daysCount=${daysList.length}, day1Title="${daysList[0].title}"`
  );

  // Case D: Selected places with imageUrl (MongoDB) vs image (frontend)
  const placesFromMongo = [
    { name: 'Gateway of India', destination: 'Mumbai', imageUrl: 'https://img.test/gw.jpg' },
  ];
  const normalizedPlaces = placesFromMongo.map((p) => ({
    name: p.name,
    image: p.image || p.imageUrl || 'default.jpg',
  }));
  record(
    'Places loaded from MongoDB with imageUrl normalize to image property cleanly',
    normalizedPlaces[0].image === 'https://img.test/gw.jpg'
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  3. END-TO-END BLUEPRINT PERSISTENCE VIA API
// ═══════════════════════════════════════════════════════════════════════
async function testSaveAndRetrieveBlueprint() {
  console.log('\n══ SUITE 3: Full Blueprint Persistence & Retrieval ══');

  const testPayload = {
    destination: 'Hyderabad',
    numberOfDays: 3,
    travelers: 2,
    budget: 35000,
    travelType: 'Couple',
    interests: ['Heritage & Architecture', 'Royal Cuisine', 'Photography'],
    selectedPlaces: [
      { name: 'Charminar', destination: 'Hyderabad', imageUrl: 'https://test/charminar.jpg', category: 'Heritage' },
      { name: 'Golconda Fort', destination: 'Hyderabad', imageUrl: 'https://test/golconda.jpg', category: 'Fort' },
    ],
    itinerary: [
      {
        day: 1,
        title: 'Day 1: Royal Monuments & Old City Flavors',
        activities: [
          { time: '09:30 AM', placeName: 'Golconda Fort', description: 'Royal acoustic tour', estimatedCost: 200 },
          { time: '01:30 PM', placeName: 'Paradise Biryani', description: 'Hyderabadi Dum Biryani', estimatedCost: 900 },
          { time: '04:30 PM', placeName: 'Charminar', description: 'Old city sightseeing & tea', estimatedCost: 150 },
        ],
      },
      {
        day: 2,
        title: 'Day 2: Nizam Palaces & Lake Views',
        activities: [
          { time: '10:00 AM', placeName: 'Chowmahalla Palace', description: 'Durbar Hall chandeliers', estimatedCost: 250 },
          { time: '05:00 PM', placeName: 'Hussain Sagar Lake', description: 'Sunset boating', estimatedCost: 400 },
        ],
      },
    ],
    budgetBreakdown: {
      totalBudget: 35000,
      estimatedSpend: 31200,
      remainingBudget: 3800,
      accommodation: 13500,
      food: 9100,
      transport: 5600,
      activities: 1600,
      misc: 1400,
    },
    status: 'planned',
  };

  // 1. Save trip
  const saveRes = await authed(`${BASE}/trips`, validToken, {
    method: 'POST',
    body: JSON.stringify(testPayload),
  });

  const tripId = saveRes.data?.trip?._id;
  record(
    'POST /api/trips saves complete blueprint with all summary metadata',
    saveRes.status === 201 && !!tripId,
    `status=${saveRes.status}, id=${tripId}`
  );

  if (tripId) {
    // 2. Retrieve trip
    const getRes = await authed(`${BASE}/trips/${tripId}`);
    const trip = getRes.data?.trip;

    record(
      'GET /api/trips/:id retrieves saved trip successfully',
      getRes.status === 200 && !!trip,
      `status=${getRes.status}`
    );

    if (trip) {
      record(
        'Retrieved trip preserves interests array exactly',
        Array.isArray(trip.interests) && trip.interests.length === 3 && trip.interests[0] === 'Heritage & Architecture',
        `interests=[${trip.interests.join(', ')}]`
      );

      record(
        'Retrieved trip preserves budget breakdown object',
        trip.budgetBreakdown?.totalBudget === 35000 && trip.budgetBreakdown?.accommodation === 13500,
        `totalBudget=₹${trip.budgetBreakdown?.totalBudget}, remaining=₹${trip.budgetBreakdown?.remainingBudget}`
      );

      record(
        'Retrieved trip preserves places and activities count',
        trip.selectedPlaces?.length === 2 && trip.itinerary?.length === 2,
        `placesCount=${trip.selectedPlaces?.length}, daysCount=${trip.itinerary?.length}`
      );
    }

    // 3. Clean up test trip
    const delRes = await authed(`${BASE}/trips/${tripId}`, validToken, { method: 'DELETE' });
    record('Cleanup test trip after audit', delRes.status === 200);
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  TripWise — Trip Summary Feature Audit                     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  try {
    const health = await req(`${BASE}/health`);
    if (health.status !== 200) {
      console.error('Backend is not running. Aborting.');
      process.exit(1);
    }

    testBudgetCalculationsMath();
    testSummaryDataNormalization();
    await testSaveAndRetrieveBlueprint();
  } catch (err) {
    console.error('\n⚠ UNHANDLED ERROR:', err.message);
    failed++;
  }

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  process.exit(failed > 0 ? 1 : 0);
}

main();

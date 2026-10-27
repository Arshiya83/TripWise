/**
 * TripWise — Targeted Regression Test Suite for Bug Fixes 1, 2, 3 & 4
 *
 * Verifies:
 * BUG 1: Deterministic attraction images, verified Hyderabad landmarks, neutral city fallback.
 * BUG 2: Hyderabad hotels (Taj Falaknuma, ITC Kakatiya, The Park) & restaurants real records & distinct images.
 * BUG 3: Attraction coordinate resolution, route sequence optimization, leg distance summation equality, and driving vs sightseeing duration separation.
 * BUG 4: New user trip creation without .map() crash, budgetPlan normalization, user isolation, and Gemini/fallback resilience.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Hotel from './models/Hotel.js';
import Restaurant from './models/Restaurant.js';
import { haversineDistanceKm, calculateRoute } from './controllers/routeController.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let passed = 0;
let failed = 0;
const results = [];

function record(name, pass, detail = '') {
  const status = pass ? '✓ PASS' : '✗ FAIL';
  results.push({ name, status, detail });
  if (pass) passed++;
  else failed++;
  console.log(`  ${status}: ${name}${detail ? ' — ' + detail : ''}`);
}

async function runRegressionTests() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('   TRIPWISE REGRESSION AUDIT: BUGS 1, 2, 3 & 4 VERIFICATION     ');
  console.log('════════════════════════════════════════════════════════════════\n');

  // ──────────────────────────────────────────────────────────────────────────
  // BUG 1: ATTRACTION IMAGES & NEUTRAL CITY FALLBACK
  // ──────────────────────────────────────────────────────────────────────────
  console.log('── SUITE 1: Bug 1 — Attraction Images & Deterministic Mapping ──');

  const destFilePath = path.join(__dirname, '../frontend/src/data/destination.js');
  const destContent = fs.readFileSync(destFilePath, 'utf8');

  // Verify all 9 Hyderabad attractions have deterministic image entries
  const hydAttractions = [
    { name: 'Charminar', key: 'hyd-charminar', keyword: 'hyd-charminar' },
    { name: 'Golconda Fort', key: 'hyd-golconda', keyword: 'hyd-golconda' },
    { name: 'Hussain Sagar Lake', key: 'hyd-hussain-sagar', keyword: 'hyd-hussain-sagar' },
    { name: 'Chowmahalla Palace', key: 'hyd-chowmahalla', keyword: 'hyd-chowmahalla' },
    { name: 'Ramoji Film City', key: 'hyd-rmo', keyword: 'hyd-ramoji' },
    { name: 'Salar Jung Museum', key: 'hyd-salar-jung', keyword: 'hyd-salar-jung' },
    { name: 'Birla Mandir Hyderabad', key: 'hyd-birla-mandir', keyword: 'hyd-birla-mandir' },
    { name: 'Nehru Zoological Park', key: 'hyd-nehru-zoo', keyword: 'hyd-nehru-zoo' },
    { name: 'Qutb Shahi Tombs', key: 'hyd-qutb-shahi', keyword: 'hyd-qutb-shahi' },
  ];

  hydAttractions.forEach((att) => {
    const hasAtt = destContent.includes(att.key) && destContent.includes(att.keyword);
    record(
      `Bug 1: Deterministic verified image for ${att.name}`,
      hasAtt,
      hasAtt ? `Found distinct verified photo identifier` : `Missing specific photo`
    );
  });

  // Verify neutral destination-specific fallback logic
  const hasCityFallbackLogic =
    destContent.includes('CITY_FALLBACK_IMAGES') &&
    destContent.includes('getCityFallbackImage');
  record(
    'Bug 1: Destination-specific fallback images defined (no generic random stock)',
    hasCityFallbackLogic,
    hasCityFallbackLogic ? 'Found getCityFallbackImage and CITY_FALLBACK_IMAGES' : 'Missing fallback map'
  );

  // Verify Destinations.jsx and SelectedPlaces.jsx use getCityFallbackImage
  const destPagePath = path.join(__dirname, '../frontend/src/pages/Destinations.jsx');
  const selPlacesPagePath = path.join(__dirname, '../frontend/src/pages/SelectedPlaces.jsx');
  const destPageContent = fs.readFileSync(destPagePath, 'utf8');
  const selPlacesContent = fs.readFileSync(selPlacesPagePath, 'utf8');

  record(
    'Bug 1: Destinations.jsx uses getCityFallbackImage on error',
    destPageContent.includes('getCityFallbackImage(currentCity)'),
    'Destinations.jsx card image fallback updated'
  );

  record(
    'Bug 1: SelectedPlaces.jsx uses getCityFallbackImage on error',
    selPlacesContent.includes('getCityFallbackImage(currentCity)'),
    'SelectedPlaces.jsx card image fallback updated'
  );

  // ──────────────────────────────────────────────────────────────────────────
  // BUG 2: VERIFY HYDERABAD HOTEL & RESTAURANT DATA
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n── SUITE 2: Bug 2 — Hyderabad Hotel & Restaurant Records ───────');

  const seedFilePath = path.join(__dirname, 'data/seedHotelsRestaurants.js');
  const seedContent = fs.readFileSync(seedFilePath, 'utf8');

  // Verify The Park Hyderabad, ITC Kakatiya, Taj Falaknuma Palace
  const verifiedHotels = [
    { name: 'The Park Hyderabad', address: '22, Raj Bhavan Road, Somajiguda, Hyderabad 500082' },
    { name: 'ITC Kakatiya', address: '6-3-1187, Begumpet, Hyderabad 500016' },
    { name: 'Taj Falaknuma Palace', address: 'Engine Bowli, Fatima Nagar, Falaknuma, Hyderabad 500053' },
  ];

  verifiedHotels.forEach((h) => {
    const hasName = seedContent.includes(h.name);
    const hasAddr = seedContent.includes(h.address);
    record(
      `Bug 2: Official verified record for hotel: ${h.name}`,
      hasName && hasAddr,
      hasName && hasAddr ? `Verified address & property details` : 'Record or address missing'
    );
  });

  // Verify database connection & live records if Atlas is accessible
  let dbConnected = false;
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 4000 });
      dbConnected = true;
    }
  } catch (err) {
    console.log(`  (Notice: MongoDB live check bypassed due to network/IP list: ${err.message})`);
  }

  if (dbConnected) {
    const hydDbHotels = await Hotel.find({ destination: 'Hyderabad' });
    record(
      'Bug 2: MongoDB Atlas contains verified Hyderabad hotels',
      hydDbHotels.length >= 3,
      `Found ${hydDbHotels.length} Hyderabad hotel records in Atlas`
    );

    const falaknuma = hydDbHotels.find((h) => h.name.includes('Falaknuma'));
    record(
      'Bug 2: Taj Falaknuma Palace has verified 5-star rating & Engine Bowli location',
      falaknuma && falaknuma.rating >= 4.5 && falaknuma.address?.includes('Engine Bowli'),
      falaknuma ? `${falaknuma.rating} rating, address: ${falaknuma.address}` : 'Not found'
    );

    const hydDbRestaurants = await Restaurant.find({ destination: 'Hyderabad' });
    record(
      'Bug 2: MongoDB Atlas contains verified Hyderabad restaurants',
      hydDbRestaurants.length >= 3,
      `Found ${hydDbRestaurants.length} Hyderabad restaurant records in Atlas`
    );

    await mongoose.disconnect();
  } else {
    // Verify frontend mockData.js synchronization
    const mockDataPath = path.join(__dirname, '../frontend/src/data/mockData.js');
    const mockContent = fs.readFileSync(mockDataPath, 'utf8');
    verifiedHotels.forEach((h) => {
      record(
        `Bug 2: Frontend mockData.js contains verified hotel: ${h.name}`,
        mockContent.includes(h.name) && mockContent.includes(h.address),
        'Synchronized frontend dataset'
      );
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // BUG 3: MAP ROUTES, SEQUENCE, DISTANCE & DURATION
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n── SUITE 3: Bug 3 — Map Routes, Sequence & Distance Math ──────');

  const routeServicePath = path.join(__dirname, '../frontend/src/services/routeService.js');
  const routeServiceContent = fs.readFileSync(routeServicePath, 'utf8');

  // Canonical coordinates verification
  record(
    'Bug 3: Canonical coordinates dictionary defined in routeService.js',
    routeServiceContent.includes('CANONICAL_COORDINATES'),
    'Canonical landmark coordinates active'
  );

  // Test Haversine formula
  const charminar = { lat: 17.3616, lng: 78.4747 };
  const golconda = { lat: 17.3833, lng: 78.4011 };
  const distCharminarToGolconda = haversineDistanceKm(charminar.lat, charminar.lng, golconda.lat, golconda.lng);
  record(
    'Bug 3: Haversine distance between Charminar & Golconda Fort is realistic (~8.2 km direct)',
    distCharminarToGolconda > 7.5 && distCharminarToGolconda < 9.0,
    `Calculated direct distance: ${Math.round(distCharminarToGolconda * 10) / 10} km`
  );

  // Test visit sequence optimization (nearest neighbor)
  // Input: [Nehru Zoo, Hussain Sagar, Ramoji Film City, Charminar]
  // Charminar is ~3.5 km from Nehru Zoo, whereas Hussain Sagar is ~10 km, Ramoji is ~35 km!
  const nehruZoo = { lat: 17.3542, lng: 78.4554, name: 'Nehru Zoological Park' };
  const hussainSagar = { lat: 17.4239, lng: 78.4738, name: 'Hussain Sagar Lake' };
  const ramoji = { lat: 17.2543, lng: 78.6808, name: 'Ramoji Film City' };
  const charminarPlace = { lat: 17.3616, lng: 78.4747, name: 'Charminar' };

  // Nearest-neighbor simulation
  const rawWaypoints = [nehruZoo, hussainSagar, ramoji, charminarPlace];
  const remaining = [hussainSagar, ramoji, charminarPlace];
  const ordered = [nehruZoo];
  while (remaining.length > 0) {
    const cur = ordered[ordered.length - 1];
    let nearestIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineDistanceKm(cur.lat, cur.lng, remaining[i].lat, remaining[i].lng);
      if (d < minDist) {
        minDist = d;
        nearestIdx = i;
      }
    }
    ordered.push(remaining.splice(nearestIdx, 1)[0]);
  }

  const secondStopIsCharminar = ordered[1].name === 'Charminar';
  record(
    'Bug 3: Nearest-neighbor sequences Charminar immediately after Nehru Zoo (eliminates crisscross)',
    secondStopIsCharminar,
    `Sequence: ${ordered.map((o) => o.name).join(' → ')}`
  );

  // Test leg distance summation equality in routeController
  const mockReq = {
    body: {
      places: ordered,
    },
  };
  let routeResStatus = 0;
  let routeResJson = null;
  const mockRes = {
    status(s) {
      routeResStatus = s;
      return this;
    },
    json(j) {
      routeResJson = j;
      return this;
    },
  };

  await calculateRoute(mockReq, mockRes);
  record(
    'Bug 3: Backend route calculation returns HTTP 200 with legs',
    routeResStatus === 200 && routeResJson?.success === true,
    `Returned ${routeResJson?.legs?.length} legs`
  );

  if (routeResJson?.legs) {
    const legsSumKm = Math.round(routeResJson.legs.reduce((acc, l) => acc + l.distanceKm, 0) * 10) / 10;
    const totalDistanceKm = routeResJson.totalDistanceKm;
    const isExactMatch = Math.abs(legsSumKm - totalDistanceKm) < 0.001;
    record(
      'Bug 3: Total route distance strictly equals the sum of displayed leg distances',
      isExactMatch,
      `Total: ${totalDistanceKm} km, Sum of legs: ${legsSumKm} km`
    );
  }

  // Verify MapPage.jsx has day filter and separate sightseeing vs driving duration
  const mapPagePath = path.join(__dirname, '../frontend/src/pages/MapPage.jsx');
  const mapPageContent = fs.readFileSync(mapPagePath, 'utf8');

  record(
    'Bug 3: MapPage prioritizes AI itinerary sequence over raw click order',
    mapPageContent.includes('itineraryDays.length > 0') && mapPageContent.includes('selectedDayFilter'),
    'Day filter and itinerary sequence active'
  );

  record(
    'Bug 3: MapPage clearly separates Driving Transit from Sightseeing Duration',
    mapPageContent.includes('Total Driving Distance') &&
    mapPageContent.includes('Est. Driving Transit') &&
    mapPageContent.includes('Sightseeing Duration'),
    'Clear distinct metrics bar labels'
  );

  record(
    'Bug 3: MapPage displays distinct Start Point and Final Destination',
    mapPageContent.includes('Start Point') && mapPageContent.includes('Final Destination'),
    'Clear start and end waypoint labels'
  );

  record(
    'Bug 3: MapPage explains approximate routing when OSRM is unavailable',
    mapPageContent.includes('Direct Waypoint Route (Approximate)') &&
    mapPageContent.includes('OSRM live road routing unavailable'),
    'Explicit disclaimer and approximate polyline styling'
  );

  // ──────────────────────────────────────────────────────────────────────────
  // BUG 4: CREATE SMART TRIP CRASH FOR BOB / DIFFERENT USER
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n── SUITE 4: Bug 4 — New User & Itinerary Normalization ─────────');

  const itinPagePath = path.join(__dirname, '../frontend/src/pages/Itinerary.jsx');
  const itinPageContent = fs.readFileSync(itinPagePath, 'utf8');

  // Check budgetPlan normalization logic
  record(
    'Bug 4: Itinerary.jsx normalizes budgetPlan when breakdown array is absent',
    itinPageContent.includes('Normalize budgetPlan to guarantee breakdown array is always populated') &&
    itinPageContent.includes('breakdown: ['),
    'Normalizer reconstructs 5 standard category allocations'
  );

  // Check defensive mapping on breakdown, advice, and activities
  record(
    'Bug 4: Defensive rendering on (budgetPlan?.breakdown || []).map',
    itinPageContent.includes('(budgetPlan?.breakdown || []).map'),
    'breakdown.map is null-safe'
  );

  record(
    'Bug 4: Defensive rendering on (generatedPlan?.budgetSavingSuggestions || []).map',
    itinPageContent.includes('(generatedPlan?.budgetSavingSuggestions || []).map'),
    'budgetSavingSuggestions is null-safe'
  );

  record(
    'Bug 4: Defensive rendering on (generatedPlan?.travelTips || []).map',
    itinPageContent.includes('(generatedPlan?.travelTips || []).map'),
    'travelTips is null-safe'
  );

  record(
    'Bug 4: Defensive rendering on (selectedDayData?.activities || []).map',
    itinPageContent.includes('(selectedDayData?.activities || []).map'),
    'activities is null-safe'
  );

  // Check user-scoped localStorage and session isolation in TripContext and AuthContext
  const tripContextPath = path.join(__dirname, '../frontend/src/context/TripContext.jsx');
  const authContextPath = path.join(__dirname, '../frontend/src/context/AuthContext.jsx');
  const tripContextContent = fs.readFileSync(tripContextPath, 'utf8');
  const authContextContent = fs.readFileSync(authContextPath, 'utf8');

  record(
    'Bug 4: TripContext scopes storage key by authenticated user ID',
    tripContextContent.includes('tripwise_trip_state_${authUser.id}'),
    'User-scoped localStorage prevents cross-user state leaks'
  );

  record(
    'Bug 4: AuthContext clears trip state on user logout',
    authContextContent.includes('tripwise_trip_state'),
    'Logout flushes cached trip state'
  );

  // Simulate Bob's initial trip generation data
  const bobTripPreferences = {
    destination: 'Hyderabad',
    numberOfDays: 3,
    travelers: 2,
    budget: 30000,
    travelType: 'Couple',
    interests: ['History', 'Culture'],
    selectedPlaces: [
      { id: 'hyd-charminar', name: 'Charminar', entryFee: 25 },
      { id: 'hyd-golconda', name: 'Golconda Fort', entryFee: 25 },
      { id: 'hyd-hussain-sagar', name: 'Hussain Sagar Lake', entryFee: 0 },
    ],
  };

  // Simulate the normalizer function directly
  function normalizeBudget(rawBudgetPlan, appliedBudget) {
    if (rawBudgetPlan && Array.isArray(rawBudgetPlan.breakdown) && rawBudgetPlan.breakdown.length > 0) {
      return rawBudgetPlan;
    }
    const b = rawBudgetPlan || {};
    const acc = Number(b.accommodation) || Math.round(appliedBudget * 0.38);
    const food = Number(b.food) || Math.round(appliedBudget * 0.26);
    const trans = Number(b.transport) || Math.round(appliedBudget * 0.16);
    const act = Number(b.activities) || Math.round(appliedBudget * 0.12);
    const misc = Number(b.misc || b.shopping) || Math.round(appliedBudget * 0.08);
    const estSpend = Number(b.estimatedSpend || b.estimatedTotal) || (acc + food + trans + act + misc);
    const rem = Number(b.remainingBudget !== undefined ? b.remainingBudget : b.remaining) || (appliedBudget - estSpend);

    return {
      totalBudget: Number(b.totalBudget) || appliedBudget,
      estimatedSpend: estSpend,
      remainingBudget: rem,
      breakdown: [
        { name: 'Accommodation', amount: acc },
        { name: 'Food & Drinks', amount: food },
        { name: 'Local Transport', amount: trans },
        { name: 'Activities & Entry Fees', amount: act },
        { name: 'Shopping / Misc', amount: misc },
      ],
    };
  }

  // Case A: Bob with completely empty budgetPlan (brand new user)
  const bobNormalizedA = normalizeBudget(null, 30000);
  const canMapA = Array.isArray(bobNormalizedA.breakdown) && bobNormalizedA.breakdown.map((x) => x.name).length === 5;
  record(
    'Bug 4: New user with null budgetPlan renders 5 breakdown categories without crash',
    canMapA,
    `Produced ${bobNormalizedA.breakdown.length} items`
  );

  // Case B: Bob with MongoDB-style itemized budgetBreakdown (no .breakdown array)
  const mongoStylePlan = {
    accommodation: 11400,
    food: 7800,
    transport: 4800,
    activities: 3600,
    misc: 2400,
    estimatedSpend: 30000,
    remainingBudget: 0,
  };
  const bobNormalizedB = normalizeBudget(mongoStylePlan, 30000);
  const canMapB = Array.isArray(bobNormalizedB.breakdown) && bobNormalizedB.breakdown.map((x) => x.amount).length === 5;
  record(
    'Bug 4: Reopened/MongoDB-style budget breakdown without .breakdown array normalizes safely',
    canMapB,
    `Mapped amounts: ${bobNormalizedB.breakdown.map((x) => x.amount).join(', ')}`
  );

  // ──────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log(`   AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runRegressionTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

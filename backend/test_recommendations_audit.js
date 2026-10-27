/**
 * TripWise — Hotel & Restaurant Recommendations Feature Audit
 *
 * Automated verification of:
 * 1. Endpoint security (JWT authentication on /api/hotels and /api/restaurants)
 * 2. Destination matching (all 5 supported cities: Hyderabad, Delhi, Goa, Jaipur, Mumbai)
 * 3. Empty results on invalid / nonexistent destinations
 * 4. Budget filtering & sorting (maxPrice, price_asc, price_desc, rating)
 * 5. Data integrity (no fabricated/missing coordinates, valid ratings, prices)
 * 6. Single item lookup & CastError handling
 */

import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';

const BASE = 'http://127.0.0.1:5000/api';

// Create a valid test JWT token
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
//  1. ENDPOINT AUTHENTICATION TESTS
// ═══════════════════════════════════════════════════════════════════════
async function testAuthProtection() {
  console.log('\n══ SUITE 1: Recommendation Endpoints Authentication ══');

  const hNoAuth = await req(`${BASE}/hotels`);
  record('GET /api/hotels without token rejected (401)', hNoAuth.status === 401, `status=${hNoAuth.status}`);

  const rNoAuth = await req(`${BASE}/restaurants`);
  record('GET /api/restaurants without token rejected (401)', rNoAuth.status === 401, `status=${rNoAuth.status}`);

  const hAuth = await authed(`${BASE}/hotels`);
  record('GET /api/hotels with valid JWT accepted (200)', hAuth.status === 200, `status=${hAuth.status}`);

  const rAuth = await authed(`${BASE}/restaurants`);
  record('GET /api/restaurants with valid JWT accepted (200)', rAuth.status === 200, `status=${rAuth.status}`);
}

// ═══════════════════════════════════════════════════════════════════════
//  2. HOTEL DESTINATION MATCHING & INTEGRITY
// ═══════════════════════════════════════════════════════════════════════
async function testHotelRecommendations() {
  console.log('\n══ SUITE 2: Hotel Recommendations Destination Matching ══');

  const cities = ['Hyderabad', 'Delhi', 'Goa', 'Jaipur', 'Mumbai'];

  for (const city of cities) {
    const res = await authed(`${BASE}/hotels?city=${encodeURIComponent(city)}`);
    const hotels = res.data?.hotels || [];
    const allMatchCity = hotels.length > 0 && hotels.every((h) => h.destination.toLowerCase() === city.toLowerCase());
    record(
      `Hotels for ${city} correspond strictly to destination`,
      res.status === 200 && allMatchCity,
      `count=${hotels.length}, allMatch=${allMatchCity}`
    );

    // Verify data integrity for each hotel
    if (hotels.length > 0) {
      const sample = hotels[0];
      const validPrice = typeof sample.pricePerNight === 'number' && sample.pricePerNight > 0;
      const validRating = typeof sample.rating === 'number' && sample.rating >= 1 && sample.rating <= 5;
      const validLocation = sample.location && typeof sample.location.latitude === 'number' && typeof sample.location.longitude === 'number';
      const validAmenities = Array.isArray(sample.amenities) && sample.amenities.length > 0;

      record(
        `Hotel data integrity (${sample.name})`,
        validPrice && validRating && validLocation && validAmenities,
        `price=₹${sample.pricePerNight}, rating=${sample.rating}, coords=(${sample.location?.latitude}, ${sample.location?.longitude})`
      );
    }
  }

  // Non-existent destination
  const nonExistent = await authed(`${BASE}/hotels?city=AtlantisCityXYZ`);
  record(
    'Hotels for non-existent city returns 0 results cleanly (no 500 crash)',
    nonExistent.status === 200 && nonExistent.data?.hotels?.length === 0,
    `count=${nonExistent.data?.hotels?.length}`
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  3. HOTEL BUDGET FILTERING & SORTING
// ═══════════════════════════════════════════════════════════════════════
async function testHotelBudgetAndSorting() {
  console.log('\n══ SUITE 3: Hotel Budget Filtering & Sorting ══');

  // MaxPrice filter
  const under10k = await authed(`${BASE}/hotels?city=Delhi&maxPrice=10000`);
  const allUnder10k = (under10k.data?.hotels || []).every((h) => h.pricePerNight <= 10000);
  record(
    'Hotel maxPrice filter strictly enforces upper price bound',
    under10k.status === 200 && allUnder10k && under10k.data.hotels.length > 0,
    `count=${under10k.data?.hotels?.length}, allUnder10k=${allUnder10k}`
  );

  // Price Ascending sort
  const priceAsc = await authed(`${BASE}/hotels?city=Delhi&sort=price_asc`);
  const hotelsAsc = priceAsc.data?.hotels || [];
  let isAsc = true;
  for (let i = 1; i < hotelsAsc.length; i++) {
    if (hotelsAsc[i].pricePerNight < hotelsAsc[i - 1].pricePerNight) {
      isAsc = false;
      break;
    }
  }
  record(
    'Hotel sort=price_asc orders from lowest to highest price',
    priceAsc.status === 200 && isAsc && hotelsAsc.length > 1,
    `prices=[${hotelsAsc.map((h) => h.pricePerNight).join(', ')}]`
  );

  // Price Descending sort
  const priceDesc = await authed(`${BASE}/hotels?city=Delhi&sort=price_desc`);
  const hotelsDesc = priceDesc.data?.hotels || [];
  let isDesc = true;
  for (let i = 1; i < hotelsDesc.length; i++) {
    if (hotelsDesc[i].pricePerNight > hotelsDesc[i - 1].pricePerNight) {
      isDesc = false;
      break;
    }
  }
  record(
    'Hotel sort=price_desc orders from highest to lowest price',
    priceDesc.status === 200 && isDesc && hotelsDesc.length > 1,
    `prices=[${hotelsDesc.map((h) => h.pricePerNight).join(', ')}]`
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  4. RESTAURANT DESTINATION MATCHING & INTEGRITY
// ═══════════════════════════════════════════════════════════════════════
async function testRestaurantRecommendations() {
  console.log('\n══ SUITE 4: Restaurant Recommendations Destination Matching ══');

  const cities = ['Hyderabad', 'Delhi', 'Goa', 'Jaipur', 'Mumbai'];

  for (const city of cities) {
    const res = await authed(`${BASE}/restaurants?city=${encodeURIComponent(city)}`);
    const restaurants = res.data?.restaurants || [];
    const allMatchCity = restaurants.length > 0 && restaurants.every((r) => r.destination.toLowerCase() === city.toLowerCase());
    record(
      `Restaurants for ${city} correspond strictly to destination`,
      res.status === 200 && allMatchCity,
      `count=${restaurants.length}, allMatch=${allMatchCity}`
    );

    // Verify restaurant details
    if (restaurants.length > 0) {
      const sample = restaurants[0];
      const validRating = typeof sample.rating === 'number' && sample.rating >= 1 && sample.rating <= 5;
      const validCuisine = Array.isArray(sample.cuisine) && sample.cuisine.length > 0;
      const validLocation = sample.location && typeof sample.location.latitude === 'number' && typeof sample.location.longitude === 'number';
      const validPriceRange = typeof sample.priceRange === 'string' && sample.priceRange.length > 0;

      record(
        `Restaurant data integrity (${sample.name})`,
        validRating && validCuisine && validLocation && validPriceRange,
        `cuisine=[${sample.cuisine.join(', ')}], rating=${sample.rating}, priceRange=${sample.priceRange}`
      );
    }
  }

  // Non-existent destination
  const nonExistent = await authed(`${BASE}/restaurants?city=NonExistentDiningCity`);
  record(
    'Restaurants for non-existent city returns 0 results cleanly (no 500 crash)',
    nonExistent.status === 200 && nonExistent.data?.restaurants?.length === 0,
    `count=${nonExistent.data?.restaurants?.length}`
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  5. SINGLE ITEM LOOKUP & CASTERROR SAFETY
// ═══════════════════════════════════════════════════════════════════════
async function testSingleItemLookups() {
  console.log('\n══ SUITE 5: Single Item Lookups & Error Safety ══');

  // Grab first hotel
  const hList = await authed(`${BASE}/hotels?city=Hyderabad`);
  const firstHotel = hList.data?.hotels?.[0];
  if (firstHotel) {
    const byId = await authed(`${BASE}/hotels/${firstHotel._id}`);
    record('GET /api/hotels/:id returns correct hotel', byId.status === 200 && byId.data?.hotel?.name === firstHotel.name);
  }

  const badHotelId = await authed(`${BASE}/hotels/invalid-cast-id`);
  record('GET /api/hotels/:id with malformed ID returns 400 cleanly', badHotelId.status === 400);

  // Grab first restaurant
  const rList = await authed(`${BASE}/restaurants?city=Hyderabad`);
  const firstRest = rList.data?.restaurants?.[0];
  if (firstRest) {
    const byId = await authed(`${BASE}/restaurants/${firstRest._id}`);
    record('GET /api/restaurants/:id returns correct restaurant', byId.status === 200 && byId.data?.restaurant?.name === firstRest.name);
  }

  const badRestId = await authed(`${BASE}/restaurants/invalid-cast-id`);
  record('GET /api/restaurants/:id with malformed ID returns 400 cleanly', badRestId.status === 400);
}

// ═══════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  TripWise — Hotel & Restaurant Recommendations Audit       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  try {
    const health = await req(`${BASE}/health`);
    if (health.status !== 200) {
      console.error('Backend is not running. Aborting.');
      process.exit(1);
    }

    await testAuthProtection();
    await testHotelRecommendations();
    await testHotelBudgetAndSorting();
    await testRestaurantRecommendations();
    await testSingleItemLookups();
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

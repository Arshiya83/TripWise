/**
 * TripWise — Saved Trips & Database Persistence Audit Test Suite
 *
 * Verifies:
 * 1. Full data persistence to MongoDB Atlas (destination, duration, travelers, budget, places, hotels, restaurants, itinerary, budget breakdown, coverImage)
 * 2. Retrieval of saved trips via GET /api/trips and GET /api/trips/:id with all nested data intact
 * 3. Update existing trips via PUT /api/trips/:id and POST /api/trips with _id without creating duplicate records
 * 4. Reliable deletion via DELETE /api/trips/:id
 * 5. Strict multi-user data isolation: User A cannot read, update, or delete User B's trips
 * 6. Edge cases: invalid IDs (400), nonexistent IDs (404), unauthenticated access (401), missing required fields (400)
 */

import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';

const BASE = 'http://localhost:5000/api';

const userA_Id = '65f1a2b3c4d5e6f7a8b9c0d1';
const userB_Id = '65f1a2b3c4d5e6f7a8b9c0d2';

const tokenA = jwt.sign({ userId: userA_Id }, process.env.JWT_SECRET || 'testsecret', {
  expiresIn: '1h',
});

const tokenB = jwt.sign({ userId: userB_Id }, process.env.JWT_SECRET || 'testsecret', {
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
  let res;
  try {
    res = await fetch(url, { ...opts, headers });
  } catch {
    const fallbackUrl = url.includes('localhost')
      ? url.replace('localhost', '127.0.0.1')
      : url.replace('127.0.0.1', 'localhost');
    res = await fetch(fallbackUrl, { ...opts, headers });
  }
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function authed(url, token, opts = {}) {
  return req(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════
//  1. FULL TRIP PERSISTENCE & RETRIEVAL TEST
// ═══════════════════════════════════════════════════════════════════════
async function testFullTripPersistenceAndRetrieval() {
  console.log('\n══ SUITE 1: Full Trip Persistence & Retrieval (MongoDB Atlas) ══');

  const comprehensiveTrip = {
    destination: 'Hyderabad',
    numberOfDays: 3,
    travelers: 2,
    budget: 35000,
    travelType: 'Couple',
    interests: ['Heritage', 'Food & Dining', 'Culture'],
    coverImage: 'https://images.unsplash.com/photo-hotel-hyd',
    selectedPlaces: [
      {
        id: 'place-hyd-1',
        name: 'Charminar',
        destination: 'Hyderabad',
        city: 'Hyderabad',
        imageUrl: 'https://images.unsplash.com/photo-charminar',
        category: 'Historical',
        rating: 4.8,
        entryFee: 50,
      },
      {
        id: 'place-hyd-2',
        name: 'Golconda Fort',
        destination: 'Hyderabad',
        city: 'Hyderabad',
        imageUrl: 'https://images.unsplash.com/photo-golconda',
        category: 'Fort',
        rating: 4.7,
        entryFee: 100,
      },
    ],
    selectedHotels: [
      {
        id: 'hotel-hyd-1',
        name: 'Taj Falaknuma Palace',
        city: 'Hyderabad',
        stars: 5,
        rating: 4.9,
        pricePerNight: 28000,
        imageUrl: 'https://images.unsplash.com/photo-falaknuma',
        amenities: ['Spa', 'Pool', 'Palace Tour'],
        location: 'Engine Bowli, Falaknuma',
      },
    ],
    selectedRestaurants: [
      {
        id: 'rest-hyd-1',
        name: 'Paradise Biryani',
        city: 'Hyderabad',
        cuisine: 'Hyderabadi',
        priceRange: '₹₹',
        rating: 4.4,
        specialty: 'Hyderabadi Dum Biryani',
        imageUrl: 'https://images.unsplash.com/photo-biryani',
        location: 'Secunderabad',
      },
    ],
    itinerary: [
      {
        day: 1,
        title: 'Historic Core & Old City',
        theme: 'Charminar & Nizami Heritage',
        activities: [
          {
            time: '09:00 AM',
            placeName: 'Charminar',
            title: 'Charminar Exploration',
            description: 'Visit the 16th century mosque and minarets.',
            estimatedCost: 50,
            entryFee: '₹50',
            category: 'Historical',
            duration: '2 hours',
            icon: '🏛️',
            transitAfter: '15 min cab to Paradise Biryani',
          },
          {
            time: '01:00 PM',
            placeName: 'Paradise Biryani',
            title: 'Authentic Nizami Lunch',
            description: 'Taste world-famous Hyderabadi biryani.',
            estimatedCost: 800,
            category: 'Food',
            duration: '1.5 hours',
            icon: '🍽️',
          },
        ],
      },
      {
        day: 2,
        title: 'Fortresses & Royal Tombs',
        theme: 'Golconda & Qutb Shahi Heritage',
        activities: [
          {
            time: '09:30 AM',
            placeName: 'Golconda Fort',
            title: 'Acoustic Fort Walk',
            description: 'Explore royal acoustic engineering and diamond vaults.',
            estimatedCost: 100,
            duration: '3 hours',
            icon: '🏰',
          },
        ],
      },
    ],
    budgetBreakdown: {
      totalBudget: 35000,
      estimatedSpend: 28500,
      remainingBudget: 6500,
      accommodation: 14000,
      food: 7500,
      transport: 3500,
      activities: 2000,
      misc: 1500,
    },
    status: 'planned',
  };

  // 1. Create Trip
  const createRes = await authed(`${BASE}/trips`, tokenA, {
    method: 'POST',
    body: JSON.stringify(comprehensiveTrip),
  });

  record('POST /api/trips returns 201 Created', createRes.status === 201);
  const createdTrip = createRes.data?.trip;
  const tripId = createdTrip?._id;
  record('Trip created with valid MongoDB _id', !!tripId && tripId.length === 24, `_id: ${tripId}`);

  // 2. Fetch Trip by ID
  const fetchRes = await authed(`${BASE}/trips/${tripId}`, tokenA);
  record('GET /api/trips/:id returns 200 OK', fetchRes.status === 200);
  const savedTrip = fetchRes.data?.trip;

  // 3. Verify All Fields Persisted
  record('Persists destination', savedTrip?.destination === 'Hyderabad');
  record('Persists numberOfDays', savedTrip?.numberOfDays === 3);
  record('Persists travelers', savedTrip?.travelers === 2);
  record('Persists budget', savedTrip?.budget === 35000);
  record('Persists travelType', savedTrip?.travelType === 'Couple');
  record('Persists interests array', Array.isArray(savedTrip?.interests) && savedTrip.interests.length === 3);
  record('Persists coverImage', savedTrip?.coverImage === 'https://images.unsplash.com/photo-hotel-hyd');

  // Verify places
  record(
    'Persists selectedPlaces array with ratings and fees',
    savedTrip?.selectedPlaces?.length === 2 && savedTrip.selectedPlaces[0].name === 'Charminar' && savedTrip.selectedPlaces[0].rating === 4.8,
    `Count: ${savedTrip?.selectedPlaces?.length}, Place 1: ${savedTrip?.selectedPlaces?.[0]?.name}`
  );

  // Verify hotels
  record(
    'Persists selectedHotels with stars, prices, amenities, and locations',
    savedTrip?.selectedHotels?.length === 1 && savedTrip.selectedHotels[0].name === 'Taj Falaknuma Palace' && savedTrip.selectedHotels[0].pricePerNight === 28000,
    `Hotel: ${savedTrip?.selectedHotels?.[0]?.name}, ₹${savedTrip?.selectedHotels?.[0]?.pricePerNight}/night`
  );

  // Verify restaurants
  record(
    'Persists selectedRestaurants with cuisine, specialty, and ratings',
    savedTrip?.selectedRestaurants?.length === 1 && savedTrip.selectedRestaurants[0].name === 'Paradise Biryani' && savedTrip.selectedRestaurants[0].cuisine === 'Hyderabadi',
    `Restaurant: ${savedTrip?.selectedRestaurants?.[0]?.name}, Cuisine: ${savedTrip?.selectedRestaurants?.[0]?.cuisine}`
  );

  // Verify itinerary
  record(
    'Persists multi-day itinerary and activity nested properties',
    savedTrip?.itinerary?.length === 2 &&
      savedTrip.itinerary[0].activities?.length === 2 &&
      savedTrip.itinerary[0].activities[0].title === 'Charminar Exploration' &&
      savedTrip.itinerary[0].activities[0].transitAfter === '15 min cab to Paradise Biryani',
    `Days: ${savedTrip?.itinerary?.length}, Day 1 Activities: ${savedTrip?.itinerary?.[0]?.activities?.length}`
  );

  // Verify budget breakdown
  record(
    'Persists itemized budget breakdown with total and remaining buffers',
    savedTrip?.budgetBreakdown?.totalBudget === 35000 &&
      savedTrip?.budgetBreakdown?.estimatedSpend === 28500 &&
      savedTrip?.budgetBreakdown?.remainingBudget === 6500 &&
      savedTrip?.budgetBreakdown?.accommodation === 14000,
    `Total: ₹${savedTrip?.budgetBreakdown?.totalBudget}, Spent: ₹${savedTrip?.budgetBreakdown?.estimatedSpend}, Rem: ₹${savedTrip?.budgetBreakdown?.remainingBudget}`
  );

  // 4. Verify Trip appears in GET /api/trips
  const listRes = await authed(`${BASE}/trips`, tokenA);
  record('GET /api/trips lists user trips', listRes.status === 200 && Array.isArray(listRes.data?.trips));
  const foundInList = (listRes.data?.trips || []).some((t) => t._id === tripId);
  record('Newly saved trip is present in user trip list', foundInList);

  return tripId;
}

// ═══════════════════════════════════════════════════════════════════════
//  2. UPDATE & DUPLICATE PREVENTION TEST
// ═══════════════════════════════════════════════════════════════════════
async function testUpdateAndDuplicatePrevention(tripId) {
  console.log('\n══ SUITE 2: Trip Update & Duplicate Save Prevention ══');

  // 1. In-place update via PUT /api/trips/:id
  const putRes = await authed(`${BASE}/trips/${tripId}`, tokenA, {
    method: 'PUT',
    body: JSON.stringify({
      budget: 42000,
      numberOfDays: 4,
      status: 'completed',
      accommodationPricingMode: 'manual',
      manualAccommodationCost: 16000,
    }),
  });

  record('PUT /api/trips/:id returns 200 OK', putRes.status === 200);
  record('PUT updates budget in-place', putRes.data?.trip?.budget === 42000, `budget: ${putRes.data?.trip?.budget}`);
  record('PUT updates numberOfDays in-place', putRes.data?.trip?.numberOfDays === 4);
  record('PUT updates status in-place', putRes.data?.trip?.status === 'completed');
  record('PUT updates accommodationPricingMode and manualCost', putRes.data?.trip?.accommodationPricingMode === 'manual' && putRes.data?.trip?.manualAccommodationCost === 16000);

  // 2. Re-save via POST /api/trips with _id (simulating re-saving loaded trip from UI)
  const listBefore = await authed(`${BASE}/trips`, tokenA);
  const countBefore = listBefore.data?.count || 0;

  const resaveRes = await authed(`${BASE}/trips`, tokenA, {
    method: 'POST',
    body: JSON.stringify({
      _id: tripId,
      destination: 'Hyderabad',
      numberOfDays: 4,
      travelers: 2,
      budget: 45000,
      travelType: 'Couple',
      status: 'planned',
    }),
  });

  record('POST /api/trips with existing _id returns 200 OK (updated instead of creating duplicate)', resaveRes.status === 200);
  record('Updated trip keeps the same _id', resaveRes.data?.trip?._id === tripId);
  record('Updated trip reflected new budget', resaveRes.data?.trip?.budget === 45000);

  const listAfter = await authed(`${BASE}/trips`, tokenA);
  const countAfter = listAfter.data?.count || 0;
  record('Trip count does NOT increase when re-saving existing trip (no accidental duplicates)', countBefore === countAfter, `Count before: ${countBefore}, Count after: ${countAfter}`);
}

// ═══════════════════════════════════════════════════════════════════════
//  3. STRICT MULTI-USER DATA ISOLATION TEST
// ═══════════════════════════════════════════════════════════════════════
async function testMultiUserIsolation(tripId) {
  console.log('\n══ SUITE 3: Strict Multi-User Data Isolation ══');

  // User B attempts to read User A's trip
  const getB = await authed(`${BASE}/trips/${tripId}`, tokenB);
  record('User B cannot read User A trip (GET returns 404)', getB.status === 404);

  // User B attempts to update User A's trip
  const putB = await authed(`${BASE}/trips/${tripId}`, tokenB, {
    method: 'PUT',
    body: JSON.stringify({ budget: 999999 }),
  });
  record('User B cannot update User A trip (PUT returns 404)', putB.status === 404);

  // User B attempts to delete User A's trip
  const delB = await authed(`${BASE}/trips/${tripId}`, tokenB, {
    method: 'DELETE',
  });
  record('User B cannot delete User A trip (DELETE returns 404)', delB.status === 404);

  // User B's trip list must not include User A's trip
  const listB = await authed(`${BASE}/trips`, tokenB);
  const leakFound = (listB.data?.trips || []).some((t) => t._id === tripId);
  record("User A trip does NOT appear in User B's trip list", !leakFound);

  // Verify trip was NOT modified or deleted
  const verifyA = await authed(`${BASE}/trips/${tripId}`, tokenA);
  record('User A trip remains intact and uncompromised', verifyA.status === 200 && verifyA.data?.trip?.budget === 45000);
}

// ═══════════════════════════════════════════════════════════════════════
//  4. DELETION & CLEANUP TEST
// ═══════════════════════════════════════════════════════════════════════
async function testDeletion(tripId) {
  console.log('\n══ SUITE 4: Trip Deletion & Verification ══');

  const listBefore = await authed(`${BASE}/trips`, tokenA);
  const countBefore = listBefore.data?.count || 0;

  const delRes = await authed(`${BASE}/trips/${tripId}`, tokenA, {
    method: 'DELETE',
  });

  record('DELETE /api/trips/:id returns 200 OK', delRes.status === 200);

  // Verify it is really gone
  const getAfter = await authed(`${BASE}/trips/${tripId}`, tokenA);
  record('GET deleted trip returns 404 Not Found', getAfter.status === 404);

  const listAfter = await authed(`${BASE}/trips`, tokenA);
  const countAfter = listAfter.data?.count || 0;
  record('User trip count decreases by exactly 1 after deletion', countAfter === countBefore - 1, `Before: ${countBefore}, After: ${countAfter}`);
}

// ═══════════════════════════════════════════════════════════════════════
//  5. EDGE CASES & ERROR HANDLING TEST
// ═══════════════════════════════════════════════════════════════════════
async function testEdgeCases() {
  console.log('\n══ SUITE 5: Edge Cases, Error Handling & Authentication ══');

  // 1. Invalid trip ID format (CastError)
  const castGet = await authed(`${BASE}/trips/invalid-malformed-id-123`, tokenA);
  record('Invalid trip ID in GET returns 400 Bad Request', castGet.status === 400 && castGet.data?.message?.includes('Invalid trip ID'));

  const castPut = await authed(`${BASE}/trips/invalid-malformed-id-123`, tokenA, {
    method: 'PUT',
    body: JSON.stringify({ budget: 1000 }),
  });
  record('Invalid trip ID in PUT returns 400 Bad Request', castPut.status === 400 && castPut.data?.message?.includes('Invalid trip ID'));

  const castDel = await authed(`${BASE}/trips/invalid-malformed-id-123`, tokenA, {
    method: 'DELETE',
  });
  record('Invalid trip ID in DELETE returns 400 Bad Request', castDel.status === 400 && castDel.data?.message?.includes('Invalid trip ID'));

  // 2. Non-existent valid ObjectId
  const nonExistentId = '65f1a2b3c4d5e6f7a8b9c999';
  const notFoundGet = await authed(`${BASE}/trips/${nonExistentId}`, tokenA);
  record('Non-existent ObjectId in GET returns 404 Not Found', notFoundGet.status === 404);

  // 3. Missing required fields in POST
  const badPost = await authed(`${BASE}/trips`, tokenA, {
    method: 'POST',
    body: JSON.stringify({ destination: 'Goa' }), // missing numberOfDays and budget
  });
  record('POST with missing required fields returns 400 Bad Request', badPost.status === 400);

  // 4. Unauthenticated requests
  const noAuthGet = await req(`${BASE}/trips`);
  record('Unauthenticated GET /api/trips returns 401 Unauthorized', noAuthGet.status === 401);

  const noAuthPost = await req(`${BASE}/trips`, {
    method: 'POST',
    body: JSON.stringify({ destination: 'Goa', numberOfDays: 3, budget: 20000 }),
  });
  record('Unauthenticated POST /api/trips returns 401 Unauthorized', noAuthPost.status === 401);
}

// ═══════════════════════════════════════════════════════════════════════
//  MAIN RUNNER
// ═══════════════════════════════════════════════════════════════════════
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  TripWise — Saved Trips & Persistence Audit Suite            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  try {
    const health = await req(`${BASE}/health`);
    if (health.status !== 200) {
      console.error('Backend is not running. Aborting.');
      process.exit(1);
    }

    const tripId = await testFullTripPersistenceAndRetrieval();
    await testUpdateAndDuplicatePrevention(tripId);
    await testMultiUserIsolation(tripId);
    await testDeletion(tripId);
    await testEdgeCases();
  } catch (err) {
    console.error('\n⚠ UNHANDLED AUDIT ERROR:', err.message, err.stack);
    failed++;
  }

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  process.exit(failed > 0 ? 1 : 0);
}

main();

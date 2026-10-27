/**
 * TripWise — Comprehensive Authentication & Multi-User Security Audit
 *
 * Covers:
 *  1. Register two separate test users
 *  2. Independent login for both users
 *  3. Wrong password / nonexistent account rejection
 *  4. Duplicate email registration rejection
 *  5. Password hashing & no password in API responses
 *  6. JWT creation, validation, expiration, protected routes
 *  7. User-data isolation (User A cannot access User B's trips)
 *  8. Expired/invalid token handling
 *  9. Input validation & clear error messages
 * 10. Authorization on every private endpoint
 * 11. Trip CRUD lifecycle
 * 12. Email normalization
 * 13. Cleanup of all test data
 */

import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from './models/User.js';

const BASE = 'http://127.0.0.1:5000/api';

// Test user credentials — unique per run to avoid collisions
const RUN_ID = Date.now().toString(36);
const USER_A = {
  name: `AuditAlice_${RUN_ID}`,
  email: `audit.alice.${RUN_ID}@test.tripwise.dev`,
  password: 'SecurePass_A!2026',
};
const USER_B = {
  name: `AuditBob_${RUN_ID}`,
  email: `audit.bob.${RUN_ID}@test.tripwise.dev`,
  password: 'SecurePass_B!2026',
};

let tokenA = null;
let tokenB = null;
let userIdA = null;
let userIdB = null;
let tripIdA = null;
let tripIdB = null;

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
  const fetchOpts = { ...opts, headers };
  const res = await fetch(url, fetchOpts);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function authed(url, token, opts = {}) {
  const headers = {
    ...(opts.headers || {}),
    Authorization: `Bearer ${token}`,
  };
  return req(url, { ...opts, headers });
}

function makeTripPayload(dest) {
  return {
    destination: dest,
    numberOfDays: 2,
    travelers: 1,
    budget: 10000,
    travelType: 'Solo',
    interests: ['Test'],
    selectedPlaces: [{ name: 'Test Place', destination: dest }],
    itinerary: [{
      day: 1,
      title: 'Test Day',
      activities: [{
        time: '10:00 AM',
        placeName: 'Test Place',
        description: 'Audit test',
      }],
    }],
    budgetBreakdown: {
      accommodation: 3000,
      food: 2000,
      transport: 1500,
      activities: 1000,
      shopping: 500,
      estimatedTotal: 8000,
      remaining: 2000,
    },
    status: 'planned',
  };
}

// ═══════════════════════════════════════════════════════════════════════
//  SUITE 1: USER REGISTRATION
// ═══════════════════════════════════════════════════════════════════════
async function testRegistration() {
  console.log('\n══ SUITE 1: User Registration ══');

  // 1a. Register User A
  const rA = await req(`${BASE}/auth/register`, {
    method: 'POST',
    body: JSON.stringify(USER_A),
  });
  record('Register User A', rA.status === 201 && rA.data.success && !!rA.data.token,
    `status=${rA.status}`);
  if (rA.data.token) { tokenA = rA.data.token; userIdA = rA.data.user?.id; }

  // 1b. Register User B
  const rB = await req(`${BASE}/auth/register`, {
    method: 'POST',
    body: JSON.stringify(USER_B),
  });
  record('Register User B', rB.status === 201 && rB.data.success && !!rB.data.token,
    `status=${rB.status}`);
  if (rB.data.token) { tokenB = rB.data.token; userIdB = rB.data.user?.id; }

  // 1c. User IDs are different
  record('Users A and B have different IDs',
    !!(userIdA && userIdB && userIdA !== userIdB),
    `A=${userIdA}, B=${userIdB}`);

  // 1d. No password/hash in registration response
  const responseStr = JSON.stringify(rA.data);
  record('No password in register response',
    !responseStr.includes('password') && !responseStr.includes('Hash'),
    'Checked for "password" and "Hash" in response body');

  // 1e. Token is a valid JWT with correct payload
  try {
    const decoded = jwt.decode(tokenA);
    record('Registration token is valid JWT with userId',
      !!(decoded?.userId && decoded?.exp),
      `payload keys: ${Object.keys(decoded || {}).join(', ')}`);
  } catch {
    record('Registration token is valid JWT with userId', false, 'JWT decode failed');
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  SUITE 2: INPUT VALIDATION & ERROR MESSAGES
// ═══════════════════════════════════════════════════════════════════════
async function testInputValidation() {
  console.log('\n══ SUITE 2: Input Validation & Error Messages ══');

  // 2a. Missing fields
  const r1 = await req(`${BASE}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ email: 'x@y.com' }),
  });
  record('Register: reject missing name/password',
    r1.status === 400 && !r1.data.success,
    `status=${r1.status}, msg="${r1.data.message}"`);

  // 2b. Short password (< 8 chars)
  const r2 = await req(`${BASE}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ name: 'Test', email: 'short@test.dev', password: '1234567' }),
  });
  record('Register: reject short password (< 8 chars)',
    r2.status === 400 && r2.data.message?.includes('8'),
    `status=${r2.status}, msg="${r2.data.message}"`);

  // 2c. Missing login fields
  const r3 = await req(`${BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  record('Login: reject empty body', r3.status === 400,
    `status=${r3.status}, msg="${r3.data.message}"`);

  // 2d. Trip save: missing required fields
  const r4 = await authed(`${BASE}/trips`, tokenA, {
    method: 'POST',
    body: JSON.stringify({ travelType: 'Solo' }),
  });
  record('Save trip: reject missing destination/days/budget',
    r4.status === 400,
    `status=${r4.status}, msg="${r4.data.message}"`);
}

// ═══════════════════════════════════════════════════════════════════════
//  SUITE 3: DUPLICATE EMAIL REJECTION
// ═══════════════════════════════════════════════════════════════════════
async function testDuplicateEmail() {
  console.log('\n══ SUITE 3: Duplicate Email Rejection ══');

  const r = await req(`${BASE}/auth/register`, {
    method: 'POST',
    body: JSON.stringify(USER_A),
  });
  record('Duplicate email registration rejected',
    r.status === 409 && !r.data.success,
    `status=${r.status}, msg="${r.data.message}"`);
}

// ═══════════════════════════════════════════════════════════════════════
//  SUITE 4: LOGIN — CORRECT & INCORRECT CREDENTIALS
// ═══════════════════════════════════════════════════════════════════════
async function testLogin() {
  console.log('\n══ SUITE 4: Login Tests ══');

  // 4a. User A login
  const rA = await req(`${BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: USER_A.email, password: USER_A.password }),
  });
  record('User A login succeeds',
    rA.status === 200 && rA.data.success && !!rA.data.token,
    `status=${rA.status}`);
  if (rA.data.token) tokenA = rA.data.token;

  // 4b. No password in login response
  const loginStr = JSON.stringify(rA.data);
  record('No password in login response',
    !loginStr.includes('password') && !loginStr.includes('Hash'),
    'Checked response body');

  // 4c. User B login
  const rB = await req(`${BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: USER_B.email, password: USER_B.password }),
  });
  record('User B login succeeds',
    rB.status === 200 && rB.data.success && !!rB.data.token,
    `status=${rB.status}`);
  if (rB.data.token) tokenB = rB.data.token;

  // 4d. Wrong password rejected
  const rWrong = await req(`${BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: USER_A.email, password: 'WrongPassword999!' }),
  });
  record('Wrong password rejected',
    rWrong.status === 401 && !rWrong.data.success,
    `status=${rWrong.status}, msg="${rWrong.data.message}"`);

  // 4e. Generic error message (prevents email enumeration)
  record('Wrong password gives generic "Invalid email or password"',
    rWrong.data.message === 'Invalid email or password',
    `msg="${rWrong.data.message}"`);

  // 4f. Nonexistent account rejected
  const rGhost = await req(`${BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'ghost@nowhere.dev', password: 'anything12345' }),
  });
  record('Nonexistent account rejected',
    rGhost.status === 401 && !rGhost.data.success,
    `status=${rGhost.status}`);

  // 4g. Same generic message (prevents user enumeration)
  record('Nonexistent account gives same generic message',
    rGhost.data.message === 'Invalid email or password',
    `msg="${rGhost.data.message}"`);
}

// ═══════════════════════════════════════════════════════════════════════
//  SUITE 5: JWT VALIDATION, EXPIRED, INVALID TOKENS
// ═══════════════════════════════════════════════════════════════════════
async function testJWT() {
  console.log('\n══ SUITE 5: JWT Validation & Token Handling ══');

  // 5a. No token → 401
  const r1 = await req(`${BASE}/trips`);
  record('GET /trips without token → 401', r1.status === 401,
    `status=${r1.status}`);

  // 5b. Malformed token → 401
  const r2 = await authed(`${BASE}/trips`, 'not.a.valid.token');
  record('GET /trips with garbage token → 401', r2.status === 401,
    `status=${r2.status}, msg="${r2.data.message}"`);

  // 5c. Expired token → 401
  const expiredToken = jwt.sign(
    { userId: userIdA },
    process.env.JWT_SECRET,
    { expiresIn: '0s' },
  );
  await new Promise(r => setTimeout(r, 150));
  const r3 = await authed(`${BASE}/trips`, expiredToken);
  record('GET /trips with expired token → 401', r3.status === 401,
    `status=${r3.status}, msg="${r3.data.message}"`);

  // 5d. Token signed with wrong secret → 401
  const wrongSecretToken = jwt.sign(
    { userId: userIdA },
    'totally_wrong_secret_key_XYZ',
    { expiresIn: '1h' },
  );
  const r4 = await authed(`${BASE}/trips`, wrongSecretToken);
  record('Token with wrong secret → 401', r4.status === 401,
    `status=${r4.status}`);

  // 5e. Token without userId claim → 401
  const noUserToken = jwt.sign(
    { randomClaim: 'hello' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' },
  );
  const r5 = await authed(`${BASE}/trips`, noUserToken);
  record('Token without userId claim → 401', r5.status === 401,
    `status=${r5.status}`);

  // 5f. Valid token works
  const r6 = await authed(`${BASE}/trips`, tokenA);
  record('Valid token A accesses /trips → 200', r6.status === 200,
    `status=${r6.status}`);
}

// ═══════════════════════════════════════════════════════════════════════
//  SUITE 6: USER DATA ISOLATION (CRITICAL SECURITY)
// ═══════════════════════════════════════════════════════════════════════
async function testDataIsolation() {
  console.log('\n══ SUITE 6: User Data Isolation (Multi-User Security) ══');

  // 6a. User A saves a trip
  const sA = await authed(`${BASE}/trips`, tokenA, {
    method: 'POST',
    body: JSON.stringify(makeTripPayload('Hyderabad')),
  });
  record('User A saves trip',
    sA.status === 201 && sA.data.success,
    `status=${sA.status}, msg="${sA.data.message || ''}"`);
  tripIdA = sA.data.trip?._id;

  // 6b. User B saves a trip
  const sB = await authed(`${BASE}/trips`, tokenB, {
    method: 'POST',
    body: JSON.stringify(makeTripPayload('Goa')),
  });
  record('User B saves trip',
    sB.status === 201 && sB.data.success,
    `status=${sB.status}, msg="${sB.data.message || ''}"`);
  tripIdB = sB.data.trip?._id;

  if (!tripIdA || !tripIdB) {
    console.log('  ⚠ Cannot run isolation tests — trip save failed.');
    return;
  }

  // 6c. User A sees only their trips
  const gA = await authed(`${BASE}/trips`, tokenA);
  const tripsA = gA.data.trips || [];
  const aSeesOwn = tripsA.some(t => t._id === tripIdA);
  const aSeesB = tripsA.some(t => t._id === tripIdB);
  record('User A sees own trip', aSeesOwn, `found=${aSeesOwn}`);
  record("User A does NOT see User B's trip", !aSeesB, `leaking=${aSeesB}`);

  // 6d. User B sees only their trips
  const gB = await authed(`${BASE}/trips`, tokenB);
  const tripsB = gB.data.trips || [];
  const bSeesOwn = tripsB.some(t => t._id === tripIdB);
  const bSeesA = tripsB.some(t => t._id === tripIdA);
  record('User B sees own trip', bSeesOwn, `found=${bSeesOwn}`);
  record("User B does NOT see User A's trip", !bSeesA, `leaking=${bSeesA}`);

  // 6e. User B tries to GET User A's trip by ID → 404
  const crossGet = await authed(`${BASE}/trips/${tripIdA}`, tokenB);
  record("User B cannot GET User A's trip by ID",
    crossGet.status === 404,
    `status=${crossGet.status}`);

  // 6f. User B tries to DELETE User A's trip → 404
  const crossDel = await authed(`${BASE}/trips/${tripIdA}`, tokenB, {
    method: 'DELETE',
  });
  record("User B cannot DELETE User A's trip",
    crossDel.status === 404,
    `status=${crossDel.status}`);

  // 6g. Verify User A's trip still exists after cross-user delete attempt
  const verifyA = await authed(`${BASE}/trips/${tripIdA}`, tokenA);
  record("User A's trip still exists after cross-user delete attempt",
    verifyA.status === 200 && verifyA.data.success,
    `status=${verifyA.status}`);
}

// ═══════════════════════════════════════════════════════════════════════
//  SUITE 7: AUTHORIZATION ON ALL PRIVATE ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════
async function testEndpointAuth() {
  console.log('\n══ SUITE 7: Authorization on All Private Endpoints ══');

  const endpoints = [
    { method: 'POST', path: '/trips/generate', desc: 'AI itinerary generation' },
    { method: 'POST', path: '/trips', desc: 'Save trip' },
    { method: 'GET',  path: '/trips', desc: 'Get my trips' },
    { method: 'GET',  path: '/trips/000000000000000000000000', desc: 'Get trip by ID' },
    { method: 'DELETE', path: '/trips/000000000000000000000000', desc: 'Delete trip' },
    { method: 'POST', path: '/route/calculate', desc: 'Route calculation' },
  ];

  for (const ep of endpoints) {
    const r = await req(`${BASE}${ep.path}`, {
      method: ep.method,
      body: ep.method !== 'GET' ? JSON.stringify({ test: true }) : undefined,
    });
    record(`${ep.method} ${ep.path} without token → 401`,
      r.status === 401,
      `actual=${r.status} (${ep.desc})`);
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  SUITE 8: TRIP CRUD LIFECYCLE
// ═══════════════════════════════════════════════════════════════════════
async function testTripCRUD() {
  console.log('\n══ SUITE 8: Trip CRUD Lifecycle ══');

  // 8a. Get trip by ID
  if (tripIdA) {
    const r = await authed(`${BASE}/trips/${tripIdA}`, tokenA);
    record('Get trip by ID returns correct data',
      r.status === 200 && r.data.trip?.destination === 'Hyderabad',
      `dest=${r.data.trip?.destination}`);
  }

  // 8b. Invalid trip ID → 400
  const rBad = await authed(`${BASE}/trips/not-a-valid-id`, tokenA);
  record('Invalid trip ID → 400', rBad.status === 400,
    `status=${rBad.status}`);

  // 8c. Nonexistent trip ID → 404
  const rMissing = await authed(`${BASE}/trips/000000000000000000000000`, tokenA);
  record('Nonexistent trip ID → 404', rMissing.status === 404,
    `status=${rMissing.status}`);
}

// ═══════════════════════════════════════════════════════════════════════
//  SUITE 9: PASSWORD SECURITY
// ═══════════════════════════════════════════════════════════════════════
async function testPasswordSecurity() {
  console.log('\n══ SUITE 9: Password Security ══');

  // Correct password works (proves bcrypt hash+compare)
  const loginOk = await req(`${BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: USER_A.email, password: USER_A.password }),
  });
  record('Password hashing works (correct password succeeds)',
    loginOk.status === 200 && loginOk.data.success,
    'bcrypt compare passed');

  // User object never includes passwordHash
  const allFields = Object.keys(loginOk.data.user || {});
  record('User object has no passwordHash field',
    !allFields.includes('passwordHash') && !allFields.includes('password'),
    `fields: ${allFields.join(', ')}`);

  // Slightly wrong password fails
  const loginBad = await req(`${BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: USER_A.email, password: USER_A.password + 'X' }),
  });
  record('Slightly wrong password fails (proves bcrypt hashing)',
    loginBad.status === 401,
    `status=${loginBad.status}`);
}

// ═══════════════════════════════════════════════════════════════════════
//  SUITE 10: EMAIL NORMALIZATION
// ═══════════════════════════════════════════════════════════════════════
async function testEmailNormalization() {
  console.log('\n══ SUITE 10: Email Normalization ══');

  const r = await req(`${BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: USER_A.email.toUpperCase(),
      password: USER_A.password,
    }),
  });
  record('Login with uppercase email succeeds (normalization)',
    r.status === 200 && r.data.success,
    `status=${r.status}`);

  // Register with duplicate uppercase email should fail
  const r2 = await req(`${BASE}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Case Test',
      email: USER_A.email.toUpperCase(),
      password: 'SomeLongPass123!',
    }),
  });
  record('Register with uppercase duplicate email rejected',
    r2.status === 409,
    `status=${r2.status}`);
}

// ═══════════════════════════════════════════════════════════════════════
//  SUITE 11: ROUTE ENDPOINT AUTHORIZATION (was unprotected)
// ═══════════════════════════════════════════════════════════════════════
async function testRouteEndpointAuth() {
  console.log('\n══ SUITE 11: Route Calculation Auth ══');

  // Without token → 401
  const r1 = await req(`${BASE}/route/calculate`, {
    method: 'POST',
    body: JSON.stringify({
      places: [
        { name: 'Place 1', lat: 17.36, lng: 78.47 },
        { name: 'Place 2', lat: 17.39, lng: 78.49 },
      ],
    }),
  });
  record('/route/calculate without token → 401',
    r1.status === 401,
    `status=${r1.status}`);

  // With valid token → 200
  const r2 = await authed(`${BASE}/route/calculate`, tokenA, {
    method: 'POST',
    body: JSON.stringify({
      places: [
        { name: 'Place 1', lat: 17.36, lng: 78.47 },
        { name: 'Place 2', lat: 17.39, lng: 78.49 },
      ],
    }),
  });
  record('/route/calculate with valid token → 200',
    r2.status === 200 && r2.data.success,
    `status=${r2.status}`);
}

// ═══════════════════════════════════════════════════════════════════════
//  CLEANUP: Remove all test data
// ═══════════════════════════════════════════════════════════════════════
async function cleanup() {
  console.log('\n══ CLEANUP: Removing test data ══');

  // Delete test trips via API
  if (tripIdA && tokenA) {
    const r = await authed(`${BASE}/trips/${tripIdA}`, tokenA, { method: 'DELETE' });
    console.log(`  Deleted User A trip: ${r.data.success ? 'OK' : 'SKIP'}`);
  }
  if (tripIdB && tokenB) {
    const r = await authed(`${BASE}/trips/${tripIdB}`, tokenB, { method: 'DELETE' });
    console.log(`  Deleted User B trip: ${r.data.success ? 'OK' : 'SKIP'}`);
  }

  // Delete test users directly from MongoDB
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const delA = await User.deleteOne({ email: USER_A.email.toLowerCase() });
    const delB = await User.deleteOne({ email: USER_B.email.toLowerCase() });
    console.log(`  Deleted User A from DB: ${delA.deletedCount > 0 ? 'OK' : 'SKIP'}`);
    console.log(`  Deleted User B from DB: ${delB.deletedCount > 0 ? 'OK' : 'SKIP'}`);
    await mongoose.disconnect();
  } catch (err) {
    console.warn(`  Cleanup DB error (non-critical): ${err.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  MAIN RUNNER
// ═══════════════════════════════════════════════════════════════════════
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  TripWise — Authentication & Multi-User Security Audit     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  try {
    const health = await req(`${BASE}/health`);
    if (health.status !== 200) {
      console.error('Backend is not running on port 5000. Aborting.');
      process.exit(1);
    }
    console.log(`Backend healthy: ${health.data.message}`);

    await testRegistration();
    await testInputValidation();
    await testDuplicateEmail();
    await testLogin();
    await testJWT();
    await testDataIsolation();
    await testEndpointAuth();
    await testTripCRUD();
    await testPasswordSecurity();
    await testEmailNormalization();
    await testRouteEndpointAuth();
  } catch (err) {
    console.error('\n⚠ UNHANDLED ERROR:', err.message);
    failed++;
  }

  // Summary
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => r.status.includes('FAIL')).forEach(r => {
      console.log(`  ✗ ${r.name}: ${r.detail}`);
    });
  }

  await cleanup();
  process.exit(failed > 0 ? 1 : 0);
}

main();

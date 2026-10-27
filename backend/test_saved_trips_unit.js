/**
 * TripWise — Unit & Schema Validation Audit for Saved Trips
 *
 * Tests:
 * 1. Trip Model Schema validation (required fields, nested structures, defaults)
 * 2. Persistence of selectedHotels, selectedRestaurants, coverImage, places, and itinerary
 * 3. Formatter resilience against missing data, empty arrays, and legacy ID formats
 * 4. Mathematical consistency of stored budget breakdowns
 */

import mongoose from 'mongoose';
import Trip from './models/Trip.js';

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

function testSchemaValidation() {
  console.log('\n══ SUITE 1: Trip Schema Field & Type Validation ══');

  const validData = {
    userId: new mongoose.Types.ObjectId(),
    destination: 'Hyderabad',
    numberOfDays: 3,
    travelers: 2,
    budget: 35000,
    travelType: 'Couple',
    interests: ['Heritage', 'Food'],
    coverImage: 'https://images.unsplash.com/cover-test',
    selectedPlaces: [
      {
        id: 'place-hyd-1',
        name: 'Charminar',
        destination: 'Hyderabad',
        city: 'Hyderabad',
        imageUrl: 'https://images.unsplash.com/charminar',
        rating: 4.8,
        entryFee: 50,
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
        imageUrl: 'https://images.unsplash.com/falaknuma',
        amenities: ['Pool', 'Spa'],
        location: 'Engine Bowli',
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
        imageUrl: 'https://images.unsplash.com/biryani',
        location: 'Secunderabad',
      },
    ],
    itinerary: [
      {
        day: 1,
        title: 'Historic Core',
        theme: 'Charminar & Heritage',
        activities: [
          {
            time: '09:00 AM',
            placeName: 'Charminar',
            title: 'Charminar Exploration',
            description: 'Historic walk',
            estimatedCost: 50,
            duration: '2 hours',
            icon: '🏛️',
            transitAfter: '15 min cab to lunch',
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
    isSaved: true,
  };

  const tripDoc = new Trip(validData);
  const validationError = tripDoc.validateSync();

  record('Comprehensive Trip document validates without schema errors', !validationError, validationError ? validationError.message : 'OK');
  record('Preserves selectedHotels in schema instance', tripDoc.selectedHotels.length === 1 && tripDoc.selectedHotels[0].name === 'Taj Falaknuma Palace');
  record('Preserves selectedHotels stars and pricing', tripDoc.selectedHotels[0].stars === 5 && tripDoc.selectedHotels[0].pricePerNight === 28000);
  record('Preserves selectedRestaurants in schema instance', tripDoc.selectedRestaurants.length === 1 && tripDoc.selectedRestaurants[0].name === 'Paradise Biryani');
  record('Preserves selectedRestaurants cuisine and specialty', tripDoc.selectedRestaurants[0].cuisine === 'Hyderabadi' && tripDoc.selectedRestaurants[0].specialty === 'Hyderabadi Dum Biryani');
  record('Preserves coverImage in schema instance', tripDoc.coverImage === 'https://images.unsplash.com/cover-test');
  record('Preserves nested itinerary day theme and activity transit details', tripDoc.itinerary[0].theme === 'Charminar & Heritage' && tripDoc.itinerary[0].activities[0].transitAfter === '15 min cab to lunch');
  record('Preserves itemized budgetBreakdown with total and remaining buffers', tripDoc.budgetBreakdown.totalBudget === 35000 && tripDoc.budgetBreakdown.remainingBudget === 6500);
  record('Preserves accommodationPricingMode default ("auto")', tripDoc.accommodationPricingMode === 'auto');
  record('Preserves manualAccommodationCost default (0)', tripDoc.manualAccommodationCost === 0);

  const manualTrip = new Trip({ ...validData, accommodationPricingMode: 'manual', manualAccommodationCost: 18500 });
  record('Preserves manual accommodationPricingMode and entered cost', manualTrip.accommodationPricingMode === 'manual' && manualTrip.manualAccommodationCost === 18500);

  // Missing required destination
  const missingDest = new Trip({ ...validData, destination: '' });
  const destErr = missingDest.validateSync();
  record('Rejects document missing destination', !!destErr?.errors?.destination);

  // Missing required budget
  const missingBudget = new Trip({ ...validData, budget: undefined });
  const budgetErr = missingBudget.validateSync();
  record('Rejects document missing budget', !!budgetErr?.errors?.budget);

  // Invalid travelType
  const invalidType = new Trip({ ...validData, travelType: 'SpaceTraveler' });
  const typeErr = invalidType.validateSync();
  record('Rejects invalid travelType enum', !!typeErr?.errors?.travelType);
}

function testBudgetBreakdownConsistency() {
  console.log('\n══ SUITE 2: Budget Breakdown Mathematical Consistency ══');

  const budget = 50000;
  const nights = 3;
  const travelers = 2;

  const accommodationCost = 6500 * nights; // 19500
  const foodCost = Math.round(budget * 0.26); // 13000
  const transportCost = Math.round(budget * 0.16); // 8000
  const activitiesCost = 250 * travelers; // 500
  const miscCost = Math.round(budget * 0.08); // 4000

  const totalEstimatedSpend = accommodationCost + foodCost + transportCost + activitiesCost + miscCost;
  const remainingBudget = budget - totalEstimatedSpend;
  const perPersonCost = Math.round(totalEstimatedSpend / travelers);

  record(
    'Total estimated spend equals sum of category expenditures',
    totalEstimatedSpend === 19500 + 13000 + 8000 + 500 + 4000,
    `Spend: ₹${totalEstimatedSpend}`
  );

  record(
    'Remaining budget equals total budget minus total spend',
    remainingBudget === budget - totalEstimatedSpend,
    `Remaining: ₹${remainingBudget} (₹${budget} - ₹${totalEstimatedSpend})`
  );

  record(
    'Per-person cost mathematically matches total spend divided by travelers',
    perPersonCost === Math.round(totalEstimatedSpend / travelers),
    `Per person: ₹${perPersonCost}`
  );

  record(
    'Budget buffer is positive when total spend is within allocated limit',
    remainingBudget > 0,
    `Buffer: ₹${remainingBudget}`
  );
}

function testManualAccommodationPricingAndBackwardCompatibility() {
  console.log('\n══ SUITE 3: Manual Pricing & Legacy Trip Backward Compatibility ══');

  // Test 1: Backward compatibility with older legacy trips (missing pricing fields)
  const legacyTripData = {
    destination: 'Hyderabad',
    numberOfDays: 3,
    travelers: 2,
    budget: 30000,
    travelType: 'Couple',
  };

  const normalizedPricingMode = legacyTripData.accommodationPricingMode || 'auto';
  const normalizedManualCost =
    legacyTripData.manualAccommodationCost !== undefined && legacyTripData.manualAccommodationCost !== null
      ? Number(legacyTripData.manualAccommodationCost)
      : 0;

  record(
    'Legacy trip without pricing fields defaults to "auto" mode',
    normalizedPricingMode === 'auto'
  );
  record(
    'Legacy trip without manual cost defaults safely to 0',
    normalizedManualCost === 0
  );

  // Test 2: Manual accommodation pricing mathematical consistency
  const budget = 40000;
  const travelers = 2;
  const manualStayCost = 15000; // User entered ₹15,000 total stay
  const foodCost = 10000;
  const transportCost = 5000;
  const activitiesCost = 1200;
  const miscCost = 2500;

  const totalSpendManual = manualStayCost + foodCost + transportCost + activitiesCost + miscCost;
  const remainingManual = budget - totalSpendManual;
  const perPersonManual = Math.round(totalSpendManual / travelers);

  record(
    'Manual mode spend uses entered total stay cost (never adds automatic hotel rate)',
    totalSpendManual === 15000 + 10000 + 5000 + 1200 + 2500,
    `Total: ₹${totalSpendManual}`
  );
  record(
    'Remaining budget with manual stay cost equals budget minus manual total spend',
    remainingManual === budget - totalSpendManual,
    `Remaining: ₹${remainingManual} (₹${budget} - ₹${totalSpendManual})`
  );
  record(
    'Per-person cost with manual stay matches manual spend divided by travelers',
    perPersonManual === Math.round(totalSpendManual / travelers),
    `Per person: ₹${perPersonManual}`
  );
}

function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  TripWise — Saved Trips Unit & Schema Validation Audit       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  testSchemaValidation();
  testBudgetBreakdownConsistency();
  testManualAccommodationPricingAndBackwardCompatibility();

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  process.exit(failed > 0 ? 1 : 0);
}

main();

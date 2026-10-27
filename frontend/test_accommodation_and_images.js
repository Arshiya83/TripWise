/**
 * TripWise — Verification Suite for Manual Accommodation Pricing & Attraction Images
 */

import { calculateTripBudget } from './src/utils/budgetEngine.js';
import {
  getVerifiedAttractionImage,
  getAttractionPlaceholder,
} from './src/utils/imageFallback.js';
import { destinations, CITY_OPTIONS } from './src/data/destination.js';

let passed = 0;
let failed = 0;

function assert(name, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${name}${detail ? ' — ' + detail : ''}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${name}${detail ? ' — ' + detail : ''}`);
  }
}

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║  TripWise — Accommodation Pricing & Image Audit Suite       ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ── SUITE 1: AUTOMATIC PRICING MODE ──
console.log('── SUITE 1: Automatic Accommodation Pricing Calculation ──');
const mockHotel = {
  id: 'hotel-hyd-1',
  name: 'Taj Falaknuma Palace',
  pricePerNight: 20000,
  city: 'Hyderabad',
};

// 3 days = 2 nights; 2 travelers = 1 room (Math.ceil(2/2) = 1)
const autoBudget1 = calculateTripBudget({
  budget: 50000,
  numberOfDays: 3,
  travelers: 2,
  selectedHotel: mockHotel,
  destination: 'Hyderabad',
  accommodationPricingMode: 'auto',
});

assert('Auto mode uses hotel nightly rate × nights × rooms', autoBudget1.accommodationCost === 40000, `Cost: ₹${autoBudget1.accommodationCost} (20000 × 2 nights × 1 room)`);
assert('Auto mode marks isManualPricing as false', autoBudget1.isManualPricing === false);
assert('Auto mode marks accommodationPricingMode as auto', autoBudget1.accommodationPricingMode === 'auto');
assert('Auto mode includes hotel name and formula in breakdown notes', autoBudget1.breakdown[0].desc.includes('Taj Falaknuma Palace') && autoBudget1.breakdown[0].desc.includes('2 nights'));

// 4 travelers = 2 rooms; 4 days = 3 nights => 20000 * 3 * 2 = 120000
const autoBudgetMultiRoom = calculateTripBudget({
  budget: 150000,
  numberOfDays: 4,
  travelers: 4,
  selectedHotel: mockHotel,
  destination: 'Hyderabad',
  accommodationPricingMode: 'auto',
});
assert('Auto mode scales correctly for 2 rooms and 3 nights', autoBudgetMultiRoom.accommodationCost === 120000, `Cost: ₹${autoBudgetMultiRoom.accommodationCost} (20000 × 3 nights × 2 rooms)`);

// ── SUITE 2: MANUAL PRICING MODE ──
console.log('\n── SUITE 2: Manual Accommodation Pricing Calculation ──');
const manualBudget1 = calculateTripBudget({
  budget: 50000,
  numberOfDays: 3,
  travelers: 2,
  selectedHotel: mockHotel, // Even though a hotel is selected, manual price strictly takes precedence!
  destination: 'Hyderabad',
  accommodationPricingMode: 'manual',
  manualAccommodationCost: 15000, // User entered ₹15,000 for entire stay
});

assert('Manual mode strictly uses user-entered amount for the entire stay', manualBudget1.accommodationCost === 15000, `Cost: ₹${manualBudget1.accommodationCost}`);
assert('Manual mode marks isManualPricing as true', manualBudget1.isManualPricing === true);
assert('Manual mode marks accommodationPricingMode as manual', manualBudget1.accommodationPricingMode === 'manual');
assert('Manual mode does not add automatic hotel price (never double-bills)', manualBudget1.accommodationCost !== 40000 && manualBudget1.accommodationCost !== 55000);
assert('Manual mode labels category as Manual Price in breakdown', manualBudget1.breakdown[0].name.includes('Manual Price'));
assert('Manual mode explains total stay and effective nightly rate in notes', manualBudget1.breakdown[0].desc.includes('₹15,000 total stay') && manualBudget1.breakdown[0].desc.includes('Taj Falaknuma Palace'));

// Changing manual price updates all budget totals
const manualBudget2 = calculateTripBudget({
  budget: 50000,
  numberOfDays: 3,
  travelers: 2,
  selectedHotel: mockHotel,
  destination: 'Hyderabad',
  accommodationPricingMode: 'manual',
  manualAccommodationCost: 28000, // User updated to ₹28,000
});

assert('Updating manual stay cost recalculates total estimated spend', manualBudget2.totalEstimatedSpend === manualBudget1.totalEstimatedSpend + 13000, `Spend: ₹${manualBudget2.totalEstimatedSpend} vs ₹${manualBudget1.totalEstimatedSpend}`);
assert('Updating manual stay cost recalculates remaining budget', manualBudget2.remainingBudget === manualBudget1.remainingBudget - 13000, `Remaining: ₹${manualBudget2.remainingBudget} vs ₹${manualBudget1.remainingBudget}`);
assert('Updating manual stay cost updates per-person cost', manualBudget2.perPersonEstimatedCost === Math.round(manualBudget2.totalEstimatedSpend / 2));

// ── SUITE 3: INPUT VALIDATION & RESILIENCE ──
console.log('\n── SUITE 3: Input Validation & Edge Cases ──');

// Zero cost (e.g. staying with family or credit card points)
const freeStayBudget = calculateTripBudget({
  budget: 50000,
  numberOfDays: 3,
  travelers: 2,
  selectedHotel: mockHotel,
  destination: 'Hyderabad',
  accommodationPricingMode: 'manual',
  manualAccommodationCost: 0,
});
assert('Manual mode accepts ₹0 for free stay (e.g. friends/family/points)', freeStayBudget.accommodationCost === 0, `Cost: ₹${freeStayBudget.accommodationCost}`);
assert('Manual mode with ₹0 does NOT fall back to auto pricing', freeStayBudget.isManualPricing === true && freeStayBudget.totalEstimatedSpend < autoBudget1.totalEstimatedSpend);

// Empty string / invalid / negative input holds 0 without crashing or adding auto cost
const invalidManualBudget = calculateTripBudget({
  budget: 50000,
  numberOfDays: 3,
  travelers: 2,
  selectedHotel: mockHotel,
  destination: 'Hyderabad',
  accommodationPricingMode: 'manual',
  manualAccommodationCost: '',
});
assert('Manual mode with empty input holds 0 without adding auto cost', invalidManualBudget.accommodationCost === 0 && invalidManualBudget.isManualPricing === true);

const negativeManualBudget = calculateTripBudget({
  budget: 50000,
  numberOfDays: 3,
  travelers: 2,
  selectedHotel: mockHotel,
  destination: 'Hyderabad',
  accommodationPricingMode: 'manual',
  manualAccommodationCost: -5000,
});
assert('Manual mode with negative input holds 0 without adding auto cost', negativeManualBudget.accommodationCost === 0);

// ── SUITE 4: ATTRACTION IMAGES AUDIT FOR ALL SUPPORTED CITIES ──
console.log('\n── SUITE 4: Attraction Images Audit Across All Supported Cities ──');

const supportedCities = CITY_OPTIONS.filter((c) => c.supported).map((c) => c.name);
assert('5 supported cities configured (Hyderabad, Goa, Jaipur, Delhi, Mumbai)', supportedCities.length === 5 && supportedCities.includes('Hyderabad') && supportedCities.includes('Goa') && supportedCities.includes('Jaipur') && supportedCities.includes('Delhi') && supportedCities.includes('Mumbai'));

for (const city of supportedCities) {
  const cityAttractions = destinations.filter((d) => d.city.toLowerCase() === city.toLowerCase());
  assert(`City ${city} has verified attractions in dataset`, cityAttractions.length >= 8, `Found ${cityAttractions.length} attractions`);

  let allImagesValid = true;
  let allImagesSpecific = true;

  for (const att of cityAttractions) {
    const resolvedImg = getVerifiedAttractionImage(att, city);
    if (!resolvedImg || typeof resolvedImg !== 'string' || resolvedImg.length < 10) {
      allImagesValid = false;
    }
    // Check it does NOT contain known random stock photos
    if (resolvedImg.includes('photo-1469854523086') || resolvedImg.includes('photo-1488646953014') || resolvedImg.includes('photo-1507525428034')) {
      allImagesSpecific = false;
    }
  }

  assert(`All attractions in ${city} have valid verified images`, allImagesValid);
  assert(`All attractions in ${city} reject generic random stock images`, allImagesSpecific);
}

// ── SUITE 5: NEUTRAL SVG PLACEHOLDER AUDIT ──
console.log('\n── SUITE 5: Neutral SVG Placeholder Fallback Audit ──');

const placeholder = getAttractionPlaceholder('Historic Monument', 'Hyderabad');
assert('Generates SVG data URI for neutral placeholder', placeholder.startsWith('data:image/svg+xml;utf8,<svg'));
assert('Placeholder displays correct attraction name', placeholder.includes('Historic%20Monument') || placeholder.includes('Historic Monument'));
assert('Placeholder displays correct city subtitle', placeholder.includes('Hyderabad'));

// Unknown place object with missing or stock image returns neutral placeholder
const unknownPlace = {
  name: 'Newly Discovered Temple',
  city: 'Jaipur',
  image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800', // Generic stock
};
const unknownResolved = getVerifiedAttractionImage(unknownPlace, 'Jaipur');
assert('Generic stock photo on unknown place is rejected and replaced by neutral placeholder', unknownResolved.startsWith('data:image/svg+xml') && unknownResolved.includes('Newly'));

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log(`║  RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log('╚══════════════════════════════════════════════════════════════╝');

process.exit(failed > 0 ? 1 : 0);

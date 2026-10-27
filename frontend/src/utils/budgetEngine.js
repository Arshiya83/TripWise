/**
 * TripWise — Authoritative Trip Budget Engine
 * 
 * Provides unified, mathematically consistent cost estimations across:
 * - TripSummary.jsx
 * - BudgetPage.jsx
 * - Itinerary.jsx
 * - Hotels.jsx & Restaurants.jsx
 * - SavedTrips.jsx & Dashboard.jsx
 * - pdfExportService.js
 * 
 * Invariants:
 * 1. Remaining balance = User Budget − Total Estimated Spend.
 * 2. User budget is an absolute cap, never silently expanded.
 * 3. Exact guest counts, nights (days - 1), and room occupancy are respected.
 * 4. Over-budget situations produce explicit warnings and actionable alternatives.
 */

import { getHotelsByDestination, getRestaurantsByDestination } from '../data/mockData.js';
import { destinations } from '../data/destination.js';

export function calculateTripBudget(params = {}) {
  const {
    budget = 25000,
    numberOfDays = 3,
    travelers = 2,
    selectedHotel = null,
    selectedHotels = [],
    selectedRestaurants = [],
    selectedDining = [],
    selectedPlaces = [],
    places = [],
    destination = 'Hyderabad',
    travelType = 'Couple',
    accommodationPricingMode = 'auto',
    manualAccommodationCost = null,
  } = params;

  const userBudget = Math.max(1000, Number(budget) || 25000);
  const days = Math.max(1, Number(numberOfDays) || 3);
  const nights = Math.max(1, days - 1);
  const numTravelers = Math.max(1, Number(travelers) || 2);
  const roomsCount = Math.max(1, Math.ceil(numTravelers / 2));

  // Resolve authoritative hotel object from object, string ID, or selectedHotels array
  let effectiveHotel = null;
  if (selectedHotel && typeof selectedHotel === 'object' && selectedHotel.name) {
    effectiveHotel = selectedHotel;
  } else if (typeof selectedHotel === 'string' && selectedHotel.trim()) {
    const cityHotels = getHotelsByDestination(destination);
    effectiveHotel = cityHotels.find(
      (h) => h.id === selectedHotel || h.name?.toLowerCase() === selectedHotel.toLowerCase()
    ) || null;
  } else if (Array.isArray(selectedHotels) && selectedHotels.length > 0) {
    const candidate = selectedHotels[0];
    if (typeof candidate === 'object' && candidate !== null && candidate.name) {
      effectiveHotel = candidate;
    } else if (typeof candidate === 'string' && candidate.trim()) {
      const cityHotels = getHotelsByDestination(destination);
      effectiveHotel = cityHotels.find(
        (h) => h.id === candidate || h.name?.toLowerCase() === candidate.toLowerCase()
      ) || null;
    }
  }

  // 1. ACCOMMODATION CALCULATION
  const isManualPricing = accommodationPricingMode === 'manual';
  let accommodationCost = 0;
  let hotelNotes = '';
  let hotelRatePerNight = 0;

  const parsedManualCost =
    manualAccommodationCost !== null &&
    manualAccommodationCost !== undefined &&
    manualAccommodationCost !== ''
      ? Number(manualAccommodationCost)
      : NaN;

  if (isManualPricing && !isNaN(parsedManualCost) && parsedManualCost >= 0) {
    // MANUAL MODE: Strictly uses user-entered cost for the entire stay
    accommodationCost = Math.round(parsedManualCost);
    const effectiveNightlyRate = nights > 0 ? Math.round(accommodationCost / nights) : accommodationCost;
    const hotelName = effectiveHotel?.name || 'Custom Stay / Booking';
    hotelNotes = `Manual Stay Cost: ₹${accommodationCost.toLocaleString('en-IN')} total stay (~₹${effectiveNightlyRate.toLocaleString('en-IN')}/night for ${nights} night${nights > 1 ? 's' : ''}, ${roomsCount} room${roomsCount > 1 ? 's' : ''}) • ${hotelName}`;
  } else if (isManualPricing && (isNaN(parsedManualCost) || parsedManualCost < 0)) {
    // MANUAL MODE with pending/invalid input: hold 0 without crashing or adding auto cost
    accommodationCost = 0;
    hotelNotes = `Manual Stay Cost: Awaiting valid amount for ${nights} night${nights > 1 ? 's' : ''}`;
  } else {
    // AUTOMATIC MODE: Calculates from selected hotel or destination allocation baseline
    if (effectiveHotel && effectiveHotel.name) {
      hotelRatePerNight = Number(effectiveHotel.pricePerNight) || 0;
      accommodationCost = hotelRatePerNight * nights * roomsCount;
      hotelNotes = `${effectiveHotel.name} (₹${hotelRatePerNight.toLocaleString('en-IN')}/night × ${nights} nights × ${roomsCount} room${roomsCount > 1 ? 's' : ''})`;
    } else {
      // Standard baseline for destination based on budget allocation (38%)
      accommodationCost = Math.round(userBudget * 0.38);
      hotelNotes = `Estimated stay for ${nights} night${nights > 1 ? 's' : ''} (${roomsCount} room${roomsCount > 1 ? 's' : ''} for ${numTravelers} guests)`;
    }
  }

  // 2. FOOD & DINING CALCULATION
  let foodCost = 0;
  let diningNotes = '';
  const totalMainMeals = days * 2; // Lunch & Dinner
  const breakfastEstimate = days * numTravelers * 180; // Moderate breakfast

  // Resolve authoritative restaurant list from objects or string IDs
  const rawDining = Array.isArray(selectedRestaurants) && selectedRestaurants.length > 0
    ? selectedRestaurants
    : (Array.isArray(selectedDining) && selectedDining.length > 0 ? selectedDining : []);

  const effectiveRestaurants = [];
  if (rawDining.length > 0) {
    const cityDiningList = getRestaurantsByDestination(destination);
    rawDining.forEach((r) => {
      if (!r) return;
      if (typeof r === 'object' && r.name) {
        effectiveRestaurants.push(r);
      } else if (typeof r === 'string' && r.trim()) {
        const found = cityDiningList.find(
          (d) => d.id === r || d.name?.toLowerCase() === r.toLowerCase()
        );
        if (found) effectiveRestaurants.push(found);
      }
    });
  }

  if (effectiveRestaurants.length > 0) {
    let selectedMealsSum = 0;
    let scheduledMealCount = 0;

    effectiveRestaurants.forEach((r) => {
      if (!r) return;
      let costPerPerson = 500;
      if (typeof r.avgCostForTwo === 'number' && r.avgCostForTwo > 0) {
        costPerPerson = Math.round(r.avgCostForTwo / 2);
      } else if (r.priceRange) {
        if (r.priceRange === '₹') costPerPerson = 250;
        else if (r.priceRange === '₹₹') costPerPerson = 550;
        else if (r.priceRange === '₹₹₹') costPerPerson = 1200;
        else if (r.priceRange === '₹₹₹₹') costPerPerson = 2500;
      }
      selectedMealsSum += costPerPerson * numTravelers;
      scheduledMealCount++;
    });

    // For remaining unselected meal slots in the trip:
    const remainingMealSlots = Math.max(0, totalMainMeals - scheduledMealCount);
    const avgRemainingMealPerPerson = 450;
    const remainingMealsCost = remainingMealSlots * avgRemainingMealPerPerson * numTravelers;

    foodCost = breakfastEstimate + selectedMealsSum + remainingMealsCost;
    diningNotes = `${scheduledMealCount} selected dining stop${scheduledMealCount > 1 ? 's' : ''} + ${remainingMealSlots} casual meals & breakfast`;
  } else {
    foodCost = Math.round(userBudget * 0.24);
    diningNotes = `Breakfast, lunch and dinner for ${numTravelers} guests across ${days} days`;
  }

  // 3. ACTIVITIES & ATTRACTION ENTRY FEES
  let activitiesCost = 0;
  let activitiesNotes = '';

  const rawPlaces = Array.isArray(selectedPlaces) && selectedPlaces.length > 0
    ? selectedPlaces
    : (Array.isArray(places) && places.length > 0 ? places : []);

  const rawTicketFees = rawPlaces.reduce((sum, p) => {
    if (!p) return sum;
    let fee = 0;
    if (typeof p === 'object') {
      fee = Number(p.rawEntryFee !== undefined ? p.rawEntryFee : p.entryFee) || 0;
    } else if (typeof p === 'string' && p.trim()) {
      const found = destinations.find((d) => d.id === p || d.name?.toLowerCase() === p.toLowerCase());
      if (found) fee = Number(found.entryFee) || 0;
    }
    return sum + fee * numTravelers;
  }, 0);

  if (rawTicketFees > 0) {
    activitiesCost = rawTicketFees;
    activitiesNotes = `Entry passes for ${rawPlaces.length} selected attraction${rawPlaces.length > 1 ? 's' : ''} (${numTravelers} travelers)`;
  } else {
    activitiesCost = Math.round(userBudget * 0.08);
    activitiesNotes = `Monument entries, temple offerings & sightseeing passes`;
  }

  // 4. LOCAL TRANSPORTATION
  const dailyTransitPerGroup = numTravelers > 2 ? 1200 : 700;
  const transitBaseline = days * dailyTransitPerGroup;
  // Bound transit realistically between sensible floor and proportional ceiling
  const transportCost = Math.max(
    days * 400,
    Math.min(transitBaseline, Math.round(userBudget * 0.16))
  );
  const transportNotes = `Local cabs, auto-rickshaws & transit between attractions (${days} days)`;

  // 5. MISCELLANEOUS & CONTINGENCY BUFFER
  // Balanced contingency for water, snacks, tips, and souvenirs
  const miscCost = Math.max(500, Math.round(userBudget * 0.06));
  const miscNotes = `Snacks, bottled water, tips & emergency buffer`;

  // TOTALS & MATHEMATICAL INVARIANTS
  const totalEstimatedSpend =
    accommodationCost + foodCost + transportCost + activitiesCost + miscCost;
  const remainingBudget = userBudget - totalEstimatedSpend;
  const isOverBudget = remainingBudget < 0;
  const shortfall = isOverBudget ? Math.abs(remainingBudget) : 0;
  const utilizationPercent = Math.round((totalEstimatedSpend / userBudget) * 100);

  // AUTOMATIC ALTERNATIVES & RECOMMENDATIONS (When Over Budget)
  const budgetAlternatives = [];

  if (isOverBudget) {
    const cityHotels = getHotelsByDestination(destination);
    if (selectedHotel && hotelRatePerNight > 0) {
      // Find more affordable hotel in same city
      const cheaperHotels = cityHotels.filter(
        (h) => h.id !== selectedHotel.id && (h.pricePerNight || 0) < hotelRatePerNight
      ).sort((a, b) => a.pricePerNight - b.pricePerNight);

      if (cheaperHotels.length > 0) {
        const topCheaper = cheaperHotels[0];
        const savings = (hotelRatePerNight - topCheaper.pricePerNight) * nights * roomsCount;
        budgetAlternatives.push({
          type: 'hotel',
          title: `Switch hotel to ${topCheaper.name}`,
          savings,
          description: `Save ₹${savings.toLocaleString('en-IN')} by choosing ${topCheaper.name} (₹${topCheaper.pricePerNight.toLocaleString('en-IN')}/night) instead of ${selectedHotel.name}.`,
          alternativeId: topCheaper.id,
        });
      }
    }

    // Dining alternatives
    if (Array.isArray(selectedRestaurants) && selectedRestaurants.length > 0) {
      const fineDining = selectedRestaurants.filter((r) => r.priceRange === '₹₹₹₹' || (r.avgCostForTwo || 0) > 2500);
      if (fineDining.length > 0) {
        budgetAlternatives.push({
          type: 'dining',
          title: 'Substitute high-end dining with heritage bistros',
          savings: Math.round(1500 * numTravelers),
          description: `Replace fine dining at ${fineDining[0].name || 'premium venue'} with iconic regional thali eateries to save ~₹${(1500 * numTravelers).toLocaleString('en-IN')}.`,
        });
      }
    }

    // General duration or budget suggestion
    budgetAlternatives.push({
      type: 'budget',
      title: 'Adjust Trip Budget Cap',
      savings: shortfall,
      description: `Increase trip budget to ₹${totalEstimatedSpend.toLocaleString('en-IN')} to comfortably accommodate all requested stays and dining choices.`,
    });
  }

  // STRUCTURED BREAKDOWN FOR UI COMPONENTS
  const breakdown = [
    {
      id: 'acc',
      name: isManualPricing ? 'Accommodation (Manual Price)' : 'Accommodation',
      amount: accommodationCost,
      percent: `${Math.round((accommodationCost / (totalEstimatedSpend || 1)) * 100)}%`,
      icon: '🏨',
      color: '#3b82f6',
      desc: hotelNotes,
    },
    {
      id: 'food',
      name: 'Food & Dining',
      amount: foodCost,
      percent: `${Math.round((foodCost / (totalEstimatedSpend || 1)) * 100)}%`,
      icon: '🍽️',
      color: '#0284c7',
      desc: diningNotes,
    },
    {
      id: 'trans',
      name: 'Local Transport',
      amount: transportCost,
      percent: `${Math.round((transportCost / (totalEstimatedSpend || 1)) * 100)}%`,
      icon: '🚗',
      color: '#8b5cf6',
      desc: transportNotes,
    },
    {
      id: 'act',
      name: 'Activities & Entry Fees',
      amount: activitiesCost,
      percent: `${Math.round((activitiesCost / (totalEstimatedSpend || 1)) * 100)}%`,
      icon: '🎟️',
      color: '#f59e0b',
      desc: activitiesNotes,
    },
    {
      id: 'misc',
      name: 'Miscellaneous & Buffer',
      amount: miscCost,
      percent: `${Math.round((miscCost / (totalEstimatedSpend || 1)) * 100)}%`,
      icon: '🛍️',
      color: '#10b981',
      desc: miscNotes,
    },
  ];

  const perPersonCost = Math.round(totalEstimatedSpend / numTravelers);

  return {
    totalBudget: userBudget,
    budget: userBudget,
    totalEstimatedSpend,
    estimatedTotal: totalEstimatedSpend,
    estimatedSpend: totalEstimatedSpend,
    remainingBudget,
    remaining: remainingBudget,
    isOverBudget,
    shortfall,
    utilizationPercent,
    perPersonCost,
    perPersonEstimatedCost: perPersonCost,
    roomsCount,
    nights,
    travelers: numTravelers,
    accommodationCost,
    accommodationPricingMode: isManualPricing ? 'manual' : 'auto',
    manualAccommodationCost: isManualPricing ? accommodationCost : null,
    isManualPricing,
    foodCost,
    transportCost,
    activitiesCost,
    miscCost,
    breakdown,
    budgetAlternatives,
  };
}

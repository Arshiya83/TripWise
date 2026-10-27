/**
 * TripWise Smart Planner Service
 * 
 * Architecture Note:
 * This service organizes user-selected places into a smart day-by-day itinerary,
 * optimizes budgets, and provides actionable travel suggestions.
 * 
 * Future Gemini Integration:
 * The async wrapper `requestAIGeneratedItinerary` defines the exact contract
 * for POST /api/trips/generate. When the backend Gemini endpoint is ready,
 * it will delegate directly to the API without frontend interface changes.
 */

import { destinations } from '../data/destination.js';
import { generateTrip } from './api.js';
import { calculateTripBudget } from '../utils/budgetEngine.js';
import { MOCK_RESTAURANTS, getRestaurantsByDestination } from '../data/mockData.js';

// Category normalization mapping
const CATEGORY_MAP = {
  History: 'Heritage',
  Monument: 'Heritage',
  Heritage: 'Heritage',
  Nature: 'Nature',
  Beach: 'Beaches',
  Beaches: 'Beaches',
  Culture: 'Culture',
  Entertainment: 'Entertainment',
  Food: 'Food',
  Shopping: 'Shopping',
};

// Interest synonym mapping: expands a user interest label to additional tags
// that should also count as a match when scoring attractions.
const INTEREST_SYNONYMS = {
  history: ['heritage', 'culture', 'monument', 'history'],
  heritage: ['heritage', 'history', 'culture', 'monument'],
  culture: ['culture', 'heritage', 'history'],
  nature: ['nature', 'adventure'],
  adventure: ['adventure', 'nature'],
  beaches: ['beaches', 'beach', 'nature'],
  photography: ['photography'],
  food: ['food'],
  shopping: ['shopping'],
  spiritual: ['spiritual', 'culture'],
  nightlife: ['nightlife', 'entertainment'],
  entertainment: ['entertainment', 'nightlife'],
};

/**
 * Returns normalized attraction list for a city from destination.js
 */
export function getAttractionsForCity(cityName) {
  if (!cityName) return [];
  const cityLower = cityName.trim().toLowerCase();
  
  return destinations
    .filter((d) => d.city.toLowerCase() === cityLower)
    .map((d) => {
      const normalizedCategory = CATEGORY_MAP[d.category] || d.category;
      const durationStr = typeof d.recommendedDuration === 'number'
        ? `${d.recommendedDuration} Hours`
        : d.recommendedDuration || '2 Hours';
      const entryFeeStr = d.entryFee === 0 || d.entryFee === '0'
        ? 'Free'
        : `₹${d.entryFee} / person`;

      return {
        ...d,
        category: normalizedCategory,
        duration: durationStr,
        entryFeeStr,
        rawEntryFee: Number(d.entryFee) || 0,
        interests: d.interests || [normalizedCategory],
      };
    });
}

/**
 * calculateMatchScore
 *
 * Computes a genuine, differentiated interest match score for an attraction.
 *
 * Algorithm:
 *   1. Expand each user interest using INTEREST_SYNONYMS to build a full
 *      set of matching tags.
 *   2. Check the attraction's `interests` array AND its `category` against
 *      the expanded tag set.
 *   3. Count exact matches (direct interest tag match) and partial matches
 *      (synonym match only).
 *   4. Compute a weighted score:
 *        - Each exact interest match adds more weight than a synonym hit.
 *        - Baseline starts at 40% for attractions with no match at all.
 *        - Score is capped at 97% (only a perfect multi-match attraction
 *          should reach that level).
 *   5. isRecommended is true only when the raw match rate exceeds a
 *      meaningful threshold — ensuring not every attraction gets the badge.
 *
 * @param {object} attraction   Normalized attraction object (from getAttractionsForCity)
 * @param {string[]} userInterests  Array of interest labels (e.g. ["Culture","Photography"])
 * @returns {{ isRecommended, score, scoreLabel, badgeText, explanation, matchedInterests }}
 */
export function calculateMatchScore(attraction, userInterests = []) {
  if (!userInterests || userInterests.length === 0) {
    return {
      isRecommended: false,
      score: null,
      scoreLabel: null,
      badgeText: null,
      explanation: 'General recommendation for this destination',
      matchedInterests: [],
    };
  }

  const attractionCategory = (attraction.category || '').toLowerCase();
  // All tags the attraction is tagged with (lowercase)
  const attractionTags = [
    ...((attraction.interests || []).map((i) => i.toLowerCase())),
    attractionCategory,
  ];

  // For each user interest, determine if it's an exact or synonym match
  const exactMatches = [];   // user interests that directly appear in attractionTags
  const synonymMatches = []; // user interests matched via synonym expansion only

  userInterests.forEach((interest) => {
    const interestLower = interest.toLowerCase();
    const synonyms = INTEREST_SYNONYMS[interestLower] || [interestLower];

    if (attractionTags.includes(interestLower)) {
      // Direct / exact match
      exactMatches.push(interest);
    } else {
      // Check synonym expansion
      const synonymHit = synonyms.some((syn) => attractionTags.includes(syn));
      if (synonymHit) {
        synonymMatches.push(interest);
      }
    }
  });

  const totalUserInterests = userInterests.length;
  const exactCount = exactMatches.length;
  const synonymCount = synonymMatches.length;
  const totalMatchCount = exactCount + synonymCount;

  if (totalMatchCount === 0) {
    // No match at all — show the card but mark as low relevance
    return {
      isRecommended: false,
      score: null,
      scoreLabel: null,
      badgeText: null,
      explanation: 'Popular attraction in this city',
      matchedInterests: [],
    };
  }

  // Weighted score:
  //   - Each exact match contributes a higher weight than a synonym match.
  //   - Maximum possible score with all exact matches = 97%
  //   - A single exact match out of 5 interests → ~60%
  //   - Two exact matches out of 5 interests → ~74%
  //   - All 5 exact matches → ~97%
  const exactWeight = 14;    // points per exact match
  const synonymWeight = 6;   // points per synonym-only match
  const base = 46;           // baseline points when there is ≥1 match

  const rawScore = base + (exactCount * exactWeight) + (synonymCount * synonymWeight);
  const score = Math.min(97, rawScore);

  // Only mark as "recommended" when at least one EXACT match exists
  // AND the score clears a meaningful threshold.
  const isRecommended = exactCount >= 1 && score >= 60;

  // Build human-readable match label using matched interest names
  const allMatchedLabels = [...exactMatches, ...synonymMatches];
  const isSingular = allMatchedLabels.length === 1;
  const matchPhrase = isSingular
    ? `Matches your interest in ${allMatchedLabels[0]}`
    : `Matches your interests in ${allMatchedLabels.slice(0, 2).join(' & ')}`;

  return {
    isRecommended,
    score,
    scoreLabel: `${score}% Match`,
    badgeText: isRecommended ? '✨ Recommended for your interests' : null,
    explanation: isRecommended
      ? matchPhrase
      : (allMatchedLabels.length > 0 ? matchPhrase : `Popular attraction in this city`),
    matchedInterests: allMatchedLabels,
  };
}

// Canonical aliases matching Architecture Rule 6
export const getAttractionsByDestination = getAttractionsForCity;
export const calculateInterestMatch = calculateMatchScore;

/**
 * rankAttractions
 *
 * Scores, annotates, and ranks attractions for a destination based on user interests.
 * - Attractions with higher interest match scores appear first.
 * - Recommended attractions (strong matches) are prioritized at top.
 * - Attractions with lower or zero matches remain available below instead of disappearing.
 *
 * Architecture Note: Reusable canonical ranking function that can later wrap backend API scores.
 *
 * @param {Array} attractions - Array of normalized attraction objects
 * @param {string[]} interests - Array of user interest tags
 * @returns {Array} Ranked and annotated attractions
 */
export function rankAttractions(attractions = [], interests = []) {
  if (!Array.isArray(attractions)) return [];

  const annotated = attractions.map((place) => {
    const match = calculateInterestMatch(place, interests);
    return {
      ...place,
      matchScore: match.score,
      matchLabel: match.scoreLabel,
      isRecommended: match.isRecommended,
      badgeText: match.badgeText,
      explanation: match.explanation,
      matchedInterests: match.matchedInterests,
    };
  });

  return annotated.sort((a, b) => {
    // 1. Recommended attractions appear first
    if (a.isRecommended && !b.isRecommended) return -1;
    if (!a.isRecommended && b.isRecommended) return 1;

    // 2. Higher match scores rank above lower ones
    const scoreA = a.matchScore ?? -1;
    const scoreB = b.matchScore ?? -1;
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    // 3. Alphabetical tie-break
    return (a.name || '').localeCompare(b.name || '');
  });
}

/**
 * City culinary highlights for authentic meal stops in itineraries
 */
const CITY_DINING_SPOTS = {
  hyderabad: [
    { title: 'Morning Irani Chai & Osmania Biscuits', desc: 'Traditional morning tea stop near the heritage quarter', time: '08:30 AM' },
    { title: 'Authentic Hyderabadi Dum Biryani Lunch', desc: 'Royal aromatic biryani with mirchi ka salan & double ka meetha', time: '01:00 PM' },
    { title: 'Evening Street Food & Chai at Charminar', desc: 'Chai, tie biscuits and street snacks along the bustling bazaars', time: '05:30 PM' },
    { title: 'Farewell Nizami Terrace Dinner', desc: 'Regal slow-cooked kebab platters with city skyline views', time: '08:00 PM' },
  ],
  jaipur: [
    { title: 'Morning Masala Chai & Pyaaz Kachori', desc: 'Crisp kachoris and saffron-infused chai in the walled pink city', time: '08:30 AM' },
    { title: 'Traditional Rajasthani Thali Lunch', desc: 'Unlimited royal feast with Dal Baati Churma, Gatte ki Sabzi & Ker Sangri', time: '01:00 PM' },
    { title: 'Sunset Rooftop Cafe by Hawa Mahal', desc: 'Chilled lassi and tea overlooking the glowing pink facade', time: '05:30 PM' },
    { title: 'Heritage Courtyard Dining & Folk Music', desc: 'Live sitar music with royal Laal Maas and handcrafted bread', time: '08:00 PM' },
  ],
  goa: [
    { title: 'Tropical Beachside Breakfast & Smoothies', desc: 'Fresh poi bread, tropical fruits and espresso by the waves', time: '08:30 AM' },
    { title: 'Coastal Goan Seafood Lunch', desc: 'Traditional Fish Curry Rice, butter garlic prawns, and coconut kokum cooler', time: '01:00 PM' },
    { title: 'Sunset Beach Shack Refreshments', desc: 'Coconut water, fresh juices and seaside evening appetizers', time: '05:30 PM' },
    { title: 'Portuguese Heritage Dinner in Panjim', desc: 'Charming Latin Quarter dining with Bebinca and Goan peri-peri specialities', time: '08:00 PM' },
  ],
  delhi: [
    { title: 'Old Delhi Morning Street Breakfast', desc: 'Steaming Bedmi Puri, Nagori Halwa and creamy sweet lassi', time: '08:30 AM' },
    { title: 'Classic Mughlai & North Indian Lunch', desc: 'Creamy Dal Makhani, butter chicken and tandoori breads', time: '01:00 PM' },
    { title: 'Evening Snack Walk at Connaught Place', desc: 'Artisanal coffee, chaat and warm jalebis in central avenues', time: '05:30 PM' },
    { title: 'Grand Delhiite Dinner', desc: 'Kebabs and modern fusion curries with live ambient music', time: '08:00 PM' },
  ],
  mumbai: [
    { title: 'Irani Cafe Bun Maska & Chai', desc: 'Classic sourdough bun maska with sweet Irani chai', time: '08:30 AM' },
    { title: 'Coastal Malvani / Coastal Lunch', desc: 'Crispy rava fish fry, sol kadhi and coastal curry with rice', time: '01:00 PM' },
    { title: 'Sunset Bhel Puri at Marine Drive', desc: 'Iconic street chaat with Arabian Sea breezes', time: '05:30 PM' },
    { title: 'Colaba Heritage Bistro Dinner', desc: 'Historic Art Deco dining with continental and Bombay classics', time: '08:00 PM' },
  ],
};

/**
 * Organizes user's SELECTED places into day-by-day smart itinerary
 * 
 * CRITICAL RULE:
 * USER CHOOSES WHAT TO VISIT. AI DECIDES HOW TO ORGANIZE IT.
 * Does NOT delete or replace user's chosen places.
 */
export function buildOrganizedItinerary({
  destination = 'Hyderabad',
  numberOfDays = 3,
  travelers = 2,
  budget = 25000,
  travelType = 'Couple',
  interests = [],
  selectedPlaces = [],
  selectedRestaurants = [],
  selectedHotel = null,
  accommodationPricingMode = 'auto',
  manualAccommodationCost = null,
}) {
  const cityKey = destination.trim().toLowerCase();
  const diningList = CITY_DINING_SPOTS[cityKey] || CITY_DINING_SPOTS.hyderabad;

  const daysCount = Math.max(1, Math.min(30, Number(numberOfDays) || 3));
  const userPlaces = [...selectedPlaces];
  const numTravelers = Math.max(1, Number(travelers) || 2);
  const totalBudget = Number(budget) || 25000;

  // 1. Resolve and normalize selected restaurants
  const allCityRestaurants = getRestaurantsByDestination(destination);
  const normalizedRestaurants = [];
  const seenRestIds = new Set();

  (selectedRestaurants || []).forEach((item) => {
    if (!item) return;
    let resolved = null;
    if (typeof item === 'object' && item.name) {
      resolved = item;
    } else {
      const targetStr = String(item).trim().toLowerCase();
      resolved =
        allCityRestaurants.find(
          (r) => r.id === item || r.name?.toLowerCase() === targetStr
        ) ||
        MOCK_RESTAURANTS.find(
          (r) => (r.id === item || r.name?.toLowerCase() === targetStr) && r.city.toLowerCase() === cityKey
        );
    }

    if (resolved) {
      const uid = resolved.id || resolved.name;
      if (!seenRestIds.has(uid)) {
        seenRestIds.add(uid);
        normalizedRestaurants.push(resolved);
      }
    }
  });

  const restaurantQueue = [...normalizedRestaurants];
  const unscheduledRestaurants = [];

  // Distribute places across available days
  const daysArray = [];
  const placesPerDay = Math.ceil(userPlaces.length / daysCount) || 1;

  for (let d = 1; d <= daysCount; d++) {
    const startIndex = (d - 1) * placesPerDay;
    const daySlice = userPlaces.slice(startIndex, startIndex + placesPerDay);

    const fallbackLunch = diningList[1] || { title: 'Local Cuisine Lunch', desc: 'Authentic regional lunch stop', time: '01:00 PM' };
    const fallbackDinner = diningList[3] || { title: 'Dinner & Evening Relaxation', desc: 'Relaxing dinner near hotel', time: '08:00 PM' };
    const eveningChai = diningList[2] || { title: 'Sunset Tea & Snacks', desc: 'Refreshment break between sightseeing', time: '05:00 PM' };

    const activities = [];

    // Helper to build a scheduled dining activity
    const createDiningActivity = (rest, mealType, defaultTime) => {
      const avgCostPerPerson = rest.avgCostForTwo
        ? Math.round(rest.avgCostForTwo / 2)
        : rest.priceRange === '₹₹₹₹' ? 2500 : rest.priceRange === '₹₹₹' ? 1200 : rest.priceRange === '₹' ? 250 : 550;

      const cuisineNote = rest.cuisine ? `${rest.cuisine} cuisine` : 'Regional culinary specialty';
      const locNote = rest.location || rest.area || destination;
      const dishNote = rest.recommendedDishes?.length ? ` • Must try: ${rest.recommendedDishes.join(', ')}` : '';

      return {
        time: defaultTime,
        title: `${mealType} at ${rest.name}`,
        placeName: rest.name,
        category: 'Food',
        icon: '🍽️',
        duration: mealType === 'Dinner' ? '2 Hours' : '1.5 Hours',
        description: `${cuisineNote} at ${locNote}.${dishNote}`,
        address: rest.location || rest.address || destination,
        area: rest.location || rest.area || destination,
        estimatedCost: avgCostPerPerson,
        cost: rest.priceRange ? `${rest.priceRange} (~₹${avgCostPerPerson * numTravelers} for ${numTravelers} guests)` : `₹${avgCostPerPerson * numTravelers}`,
        mealType,
        isUserSelected: true,
        image: rest.image || rest.imageUrl,
        transitAfter: mealType === 'Dinner' ? '🚗 Return transit to hotel' : '🚶 Relaxed post-lunch stroll',
      };
    };

    if (daySlice.length === 0) {
      // Leisure / Cultural Exploration day
      activities.push({
        time: '09:30 AM',
        title: `Scenic Exploration & Walking Trails in ${destination}`,
        placeName: `${destination} City Centers`,
        category: 'Leisure',
        icon: '🌿',
        duration: '2.5 Hours',
        description: `Relaxed exploration of scenic neighbourhoods, artisanal boutiques, and historic streetscapes.`,
        transitAfter: '🚗 15 mins transit to dining',
      });

      // Lunch slot
      if (restaurantQueue.length > 0) {
        activities.push(createDiningActivity(restaurantQueue.shift(), 'Lunch', '01:00 PM'));
      } else {
        activities.push({
          time: fallbackLunch.time,
          title: fallbackLunch.title,
          placeName: 'Regional Specialty Dining',
          category: 'Food',
          icon: '🍽️',
          duration: '1.5 Hours',
          description: fallbackLunch.desc,
          transitAfter: '🚶 Walking stroll around marketplace',
        });
      }

      activities.push({
        time: eveningChai.time,
        title: eveningChai.title,
        placeName: 'Boutique Promenade',
        category: 'Lifestyle',
        icon: '☕',
        duration: '2 Hours',
        description: 'Explore local handicraft markets and enjoy evening tea.',
        transitAfter: '🚗 Return to hotel base',
      });

      // Dinner slot if available
      if (restaurantQueue.length > 0) {
        activities.push(createDiningActivity(restaurantQueue.shift(), 'Dinner', '08:00 PM'));
      }
    } else {
      // Sequence user's selected places with dining stops and transits
      daySlice.forEach((place, pIdx) => {
        const timeSlot = pIdx === 0 ? '09:30 AM' : pIdx === 1 ? '02:30 PM' : '05:30 PM';

        activities.push({
          time: timeSlot,
          title: `Visit ${place.name}`,
          placeName: place.name,
          category: place.category || 'Sightseeing',
          icon: place.category === 'Nature' ? '🌿' : place.category === 'Beaches' ? '🏖️' : '🏛️',
          duration: place.duration || '2 Hours',
          description: place.description,
          image: place.image,
          entryFee: place.entryFeeStr || `₹${place.entryFee || 0} / person`,
          transitAfter: pIdx < daySlice.length - 1
            ? '🚗 ~15 mins transit to next stop'
            : '🚗 ~20 mins transit to dining',
        });

        // Insert lunch after morning activity
        if (pIdx === 0) {
          if (restaurantQueue.length > 0) {
            activities.push(createDiningActivity(restaurantQueue.shift(), 'Lunch', '01:00 PM'));
          } else {
            activities.push({
              time: fallbackLunch.time,
              title: fallbackLunch.title,
              placeName: 'Curated Dining Stop',
              category: 'Food',
              icon: '🍽️',
              duration: '1.5 Hours',
              description: fallbackLunch.desc,
              transitAfter: '🚗 12 mins transit to afternoon stop',
            });
          }
        }
      });

      // Add Dinner slot
      if (restaurantQueue.length > 0) {
        activities.push(createDiningActivity(restaurantQueue.shift(), 'Dinner', '08:00 PM'));
      } else if (daySlice.length === 1) {
        activities.push({
          time: eveningChai.time,
          title: eveningChai.title,
          placeName: 'Heritage Promenade',
          category: 'Culture',
          icon: '☕',
          duration: '2 Hours',
          description: eveningChai.desc,
          transitAfter: '🚗 Return transit to hotel',
        });
      }
    }

    daysArray.push({
      day: d,
      date: `Day ${d}`,
      theme: d === 1
        ? `Day 1: Iconic Landmarks & Welcome Flavors`
        : d === 2
        ? `Day 2: Heritage Highlights & Scenic Trails`
        : `Day ${d}: Cultural Treasures & Evening Leisure`,
      activities,
    });
  }

  // Any remaining selected restaurants that exceeded trip capacity
  while (restaurantQueue.length > 0) {
    const unassigned = restaurantQueue.shift();
    unscheduledRestaurants.push({
      ...unassigned,
      reason: `Trip schedule reached maximum capacity (${daysCount * 2} main meal slots across ${daysCount} days). Available for spontaneous dining.`,
    });
  }

  // Authoritative, mathematically consistent budget calculation
  const calculatedBudget = calculateTripBudget({
    budget: totalBudget,
    numberOfDays: daysCount,
    travelers: numTravelers,
    selectedHotel,
    selectedRestaurants: normalizedRestaurants,
    selectedPlaces: userPlaces,
    destination,
    travelType,
    accommodationPricingMode,
    manualAccommodationCost,
  });

  // Hotel & Dining tier descriptions
  let hotelTierDesc = 'Comfortable 3-Star / Boutique Hotel';
  let diningTierDesc = 'Authentic local bistros & casual dining';
  let transportTierDesc = 'AC Cabs & App-based rides';

  if (totalBudget < 18000) {
    hotelTierDesc = 'Verified Economy Hotel / Cozy Guesthouse';
    diningTierDesc = 'Iconic local eateries & street food trails';
    transportTierDesc = 'Metro & local auto-rickshaws';
  } else if (totalBudget >= 40000) {
    hotelTierDesc = '5-Star Luxury Heritage Palace / Resort';
    diningTierDesc = 'Fine dining with royal chef tasting menus';
    transportTierDesc = 'Dedicated private chauffeur AC cab';
  }

  const budgetSavingSuggestions = [
    `Group your ${userPlaces.length} selected attractions by proximity to save approximately 25% on local cab transit.`,
    `Visit monuments during early morning hours (before 10:30 AM) to avoid peak heat, crowds, and ticket queues.`,
    `Choose iconic heritage thali spots near the sightseeing clusters for authentic dining without hotel service markups.`,
    `Consider pre-booking online tickets for heritage monuments to bypass physical ticket counter queues.`,
  ];

  const travelTips = [
    `Start by 09:00 AM each morning to make the most of gentle daylight and golden hour photography.`,
    `Wear comfortable walking footwear suitable for historic stone pavilions and fort stairways.`,
    `Carry hydration and modest clothing suitable for temple and heritage sites.`,
    `Leave 30–45 minute buffers between afternoon activities for relaxed dining and spontaneous shopping.`,
  ];

  const interestsStr = interests.length > 0 ? interests.join(', ') : 'History, Culture & Food';
  const overviewText = `A ${daysCount}-day ${travelType.toLowerCase()} journey to ${destination} featuring ${userPlaces.length} handpicked attractions based on your preferences in ${interestsStr}.`;

  return {
    destination,
    numberOfDays: daysCount,
    travelers: numTravelers,
    budget: totalBudget,
    travelType,
    interests,
    selectedPlaces: userPlaces,
    selectedRestaurants: normalizedRestaurants,
    unscheduledRestaurants,
    selectedHotel,
    overviewText,
    daysList: daysArray,
    budgetPlan: {
      ...calculatedBudget,
      hotelTierDesc,
      diningTierDesc,
      transportTierDesc,
    },
    budgetSavingSuggestions,
    travelTips,
  };
}

/**
 * Async wrapper for Gemini AI itinerary generation
 * 
 * Pipeline:
 * React UI -> smartPlannerService -> backend POST /api/trips/generate -> Gemini
 */
export async function requestAIGeneratedItinerary(tripPreferences) {
  try {
    const response = await generateTrip(tripPreferences);
    if (response?.data?.success && response?.data?.itinerary) {
      return {
        ...response.data.itinerary,
        _source: 'gemini',
      };
    }
  } catch (error) {
    console.warn(
      '[TripWise AI] Gemini backend call failed, using local organized fallback:',
      error.response?.data?.message || error.message
    );
  }

  return {
    ...buildOrganizedItinerary(tripPreferences),
    _source: 'local-fallback',
  };
}

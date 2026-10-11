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

import { destinations, CITY_OPTIONS } from '../data/destination';

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
 * Calculates rule-based match score and explanation based on user interests
 */
export function calculateMatchScore(attraction, userInterests = []) {
  if (!userInterests || userInterests.length === 0) {
    return {
      isRecommended: false,
      score: null,
      scoreLabel: null,
      explanation: 'General recommendation for this destination',
    };
  }

  const normalizedUserInterests = userInterests.map((i) => i.toLowerCase());
  const attractionCategory = (attraction.category || '').toLowerCase();
  const attractionInterests = (attraction.interests || []).map((i) => i.toLowerCase());

  // Check matching items
  const matchedInterests = userInterests.filter((interest) => {
    const intLower = interest.toLowerCase();
    return (
      attractionCategory === intLower ||
      attractionInterests.includes(intLower) ||
      (intLower === 'history' && attractionCategory === 'heritage') ||
      (intLower === 'culture' && attractionCategory === 'heritage') ||
      (intLower === 'beaches' && attractionCategory === 'beach')
    );
  });

  const matchCount = matchedInterests.length;

  if (matchCount > 0) {
    // Score calculation: 82% base + 6% per matching interest (capped at 98%)
    const score = Math.min(98, 82 + matchCount * 7);
    const primaryMatch = matchedInterests.slice(0, 2).join(' & ');

    return {
      isRecommended: true,
      score,
      scoreLabel: `${score}% Match`,
      badgeText: '✨ Recommended for your interests',
      explanation: `Matches your interests in ${primaryMatch}`,
      matchedInterests,
    };
  }

  return {
    isRecommended: false,
    score: null,
    scoreLabel: null,
    badgeText: null,
    explanation: 'Popular attraction in this city',
    matchedInterests: [],
  };
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
}) {
  const cityKey = destination.trim().toLowerCase();
  const diningList = CITY_DINING_SPOTS[cityKey] || CITY_DINING_SPOTS.hyderabad;

  const daysCount = Math.max(1, Math.min(30, Number(numberOfDays) || 3));
  const userPlaces = [...selectedPlaces];

  // Distribute places across available days
  // E.g. 4 places across 3 days -> Day 1 gets 2, Day 2 gets 1, Day 3 gets 1
  const daysArray = [];

  const placesPerDay = Math.ceil(userPlaces.length / daysCount) || 1;

  for (let d = 1; d <= daysCount; d++) {
    const dayPlaces = [];
    const startIndex = (d - 1) * placesPerDay;
    const daySlice = userPlaces.slice(startIndex, startIndex + placesPerDay);

    const lunchSpot = diningList[1] || { title: 'Local Cuisine Lunch', desc: 'Authentic regional lunch stop', time: '01:00 PM' };
    const dinnerSpot = diningList[3] || { title: 'Dinner & Evening Relaxation', desc: 'Relaxing dinner near hotel', time: '08:00 PM' };
    const eveningChai = diningList[2] || { title: 'Sunset Tea & Snacks', desc: 'Refreshment break between sightseeing', time: '05:00 PM' };

    const activities = [];

    if (daySlice.length === 0) {
      // Leisure / Cultural Exploration day if fewer places selected than days
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
      activities.push({
        time: lunchSpot.time,
        title: lunchSpot.title,
        placeName: 'Regional Specialty Dining',
        category: 'Food',
        icon: '🍽️',
        duration: '1.5 Hours',
        description: lunchSpot.desc,
        transitAfter: '🚶 Walking stroll around marketplace',
      });
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
            : '🚗 ~20 mins transit back to accommodation',
        });

        // Insert lunch after morning activity
        if (pIdx === 0 && daySlice.length > 1) {
          activities.push({
            time: lunchSpot.time,
            title: lunchSpot.title,
            placeName: 'Curated Dining Stop',
            category: 'Food',
            icon: '🍽️',
            duration: '1.5 Hours',
            description: lunchSpot.desc,
            transitAfter: '🚗 12 mins transit to afternoon stop',
          });
        }
      });

      // Add evening tea or dinner if only 1 place on this day
      if (daySlice.length === 1) {
        activities.push({
          time: lunchSpot.time,
          title: lunchSpot.title,
          placeName: 'Curated Dining Stop',
          category: 'Food',
          icon: '🍽️',
          duration: '1.5 Hours',
          description: lunchSpot.desc,
          transitAfter: '🚶 Relaxed stroll',
        });
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

  // Calculate budget optimization based on total budget and selected places
  const totalBudget = Number(budget) || 25000;
  const numTravelers = Math.max(1, Number(travelers) || 2);

  // Exact entry fees from user's selected places
  const actualTicketsFee = userPlaces.reduce((sum, p) => {
    const feeMatch = (p.entryFeeStr || String(p.entryFee || '')).match(/\d+/);
    const costPerPerson = feeMatch ? parseInt(feeMatch[0], 10) : 0;
    return sum + costPerPerson * numTravelers;
  }, 0);

  // Dynamic distribution adapted to budget scale
  let accPercent = 0.38;
  let foodPercent = 0.26;
  let transPercent = 0.16;
  let miscPercent = 0.08;

  const accommodationCost = Math.round(totalBudget * accPercent);
  const foodCost = Math.round(totalBudget * foodPercent);
  const transportCost = Math.round(totalBudget * transPercent);
  const miscCost = Math.round(totalBudget * miscPercent);

  const estimatedSpend = accommodationCost + foodCost + transportCost + actualTicketsFee + miscCost;
  const remainingBudget = totalBudget - estimatedSpend;

  // Hotel Tier Description based on budget
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

  // Budget saving suggestions
  const budgetSavingSuggestions = [
    `Group your ${userPlaces.length} selected attractions by proximity to save approximately 25% on local cab transit.`,
    `Visit monuments during early morning hours (before 10:30 AM) to avoid peak heat, crowds, and ticket queues.`,
    `Choose iconic heritage thali spots near the sightseeing clusters for authentic dining without hotel service markups.`,
    `Consider pre-booking online tickets for heritage monuments to bypass physical ticket counter queues.`,
  ];

  // Travel tips
  const travelTips = [
    `Start by 09:00 AM each morning to make the most of gentle daylight and golden hour photography.`,
    `Wear comfortable walking footwear suitable for historic stone pavilions and fort stairways.`,
    `Carry hydration and modest clothing suitable for temple and heritage sites.`,
    `Leave 30–45 minute buffers between afternoon activities for relaxed dining and spontaneous shopping.`,
  ];

  // Destination Overview
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
    overviewText,
    daysList: daysArray,
    budgetPlan: {
      totalBudget,
      estimatedSpend,
      remainingBudget,
      hotelTierDesc,
      diningTierDesc,
      transportTierDesc,
      breakdown: [
        {
          name: 'Accommodation',
          icon: '🏨',
          amount: accommodationCost,
          desc: `${hotelTierDesc} (${daysCount - 1} nights for ${numTravelers} guests)`,
          percent: `${Math.round(accPercent * 100)}%`,
          color: '#3b82f6',
        },
        {
          name: 'Food & Drinks',
          icon: '🍽️',
          amount: foodCost,
          desc: `${diningTierDesc} for ${daysCount} days`,
          percent: `${Math.round(foodPercent * 100)}%`,
          color: '#0284c7',
        },
        {
          name: 'Local Transport',
          icon: '🚗',
          amount: transportCost,
          desc: `${transportTierDesc} between attractions`,
          percent: `${Math.round(transPercent * 100)}%`,
          color: '#8b5cf6',
        },
        {
          name: 'Activities & Entry Fees',
          icon: '🎟️',
          amount: actualTicketsFee,
          desc: `Monument tickets & passes for ${userPlaces.length} attractions`,
          percent: `${Math.round((actualTicketsFee / totalBudget) * 100) || 5}%`,
          color: '#f59e0b',
        },
        {
          name: 'Shopping / Miscellaneous',
          icon: '🛍️',
          amount: miscCost,
          desc: 'Handicrafts, tea stops & contingency buffer',
          percent: `${Math.round(miscPercent * 100)}%`,
          color: '#10b981',
        },
      ],
    },
    budgetSavingSuggestions,
    travelTips,
  };
}

/**
 * Async wrapper prepared for future Gemini API integration
 * 
 * Pipeline:
 * React UI -> smartPlannerService -> (future backend POST /api/trips/generate) -> Gemini
 */
export async function requestAIGeneratedItinerary(tripPreferences) {
  // Simulate network generation latency for AI planner steps
  await new Promise((resolve) => setTimeout(resolve, 1400));

  // Future integration point:
  // const response = await axios.post('/api/trips/generate', tripPreferences);
  // return response.data;

  return buildOrganizedItinerary(tripPreferences);
}

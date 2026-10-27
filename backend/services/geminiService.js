
import { GoogleGenAI } from '@google/genai';

export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        this.isValidationError = true;
        this.statusCode = 400;
    }
}

function getGeminiClient() {
    if (!process.env.GEMINI_API_KEY) {
        const error = new Error(
            'GEMINI_API_KEY is not configured in backend environment.'
        );
        error.code = 'CONFIG_ERROR';
        error.statusCode = 503;
        throw error;
    }

    return new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
    });
}

export async function generateTravelItinerary(preferences) {
    const {
        destination,
        numberOfDays,
        travelers = 1,
        budget,
        travelType = 'Solo',
        interests = [],
        selectedPlaces = [],
        selectedRestaurants = [],
    } = preferences || {};

    // Validate trip preferences
    if (
        typeof destination !== 'string' ||
        !destination.trim() ||
        !Number.isInteger(Number(numberOfDays)) ||
        Number(numberOfDays) < 1 ||
        Number(numberOfDays) > 30 ||
        !Number.isFinite(Number(budget)) ||
        Number(budget) <= 0
    ) {
        throw new ValidationError(
            'Enter a destination, 1–30 days, and a valid positive budget.'
        );
    }

    if (
        !Array.isArray(selectedPlaces) ||
        !Array.isArray(interests) ||
        (selectedRestaurants !== undefined && !Array.isArray(selectedRestaurants))
    ) {
        throw new ValidationError(
            'Selected places, interests, and restaurants must be arrays.'
        );
    }

    if (
        !Number.isInteger(Number(travelers)) ||
        Number(travelers) < 1 ||
        Number(travelers) > 100
    ) {
        throw new ValidationError(
            'Travelers must be a number between 1 and 100.'
        );
    }

    // Normalize selectedPlaces, selectedRestaurants, and interests for clean prompt formatting
    const normalizedPlaces = selectedPlaces
        .map((p) => {
            if (!p) return '';
            if (typeof p === 'string') return p.trim();
            if (typeof p === 'object') return (p.name || p.title || p.placeName || '').trim();
            return String(p).trim();
        })
        .filter(Boolean);

    const normalizedRestaurants = (selectedRestaurants || [])
        .map((r) => {
            if (!r) return '';
            if (typeof r === 'string') return r.trim();
            if (typeof r === 'object') return (r.name || r.title || '').trim();
            return String(r).trim();
        })
        .filter(Boolean);

    const normalizedInterests = interests
        .map((i) => {
            if (!i) return '';
            if (typeof i === 'string') return i.trim();
            if (typeof i === 'object') return (i.name || i.label || '').trim();
            return String(i).trim();
        })
        .filter(Boolean);

    const ai = getGeminiClient();
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

    const prompt = `
You are TripWise, a careful personalized travel itinerary planner.

Create a practical itinerary using these trip preferences:
${JSON.stringify({
        destination: destination.trim(),
        numberOfDays: Number(numberOfDays),
        travelers: Number(travelers),
        budget: Number(budget),
        travelType: travelType || 'Solo',
        interests: normalizedInterests,
        selectedPlaces: normalizedPlaces,
        selectedRestaurants: normalizedRestaurants,
    }, null, 2)}

RULES:
1. Return only valid JSON, without Markdown fences.
2. Create exactly ${Number(numberOfDays)} days in daysList.
3. Preserve every user-selected place and user-selected restaurant. Do not silently remove or replace them.
4. Schedule user-selected restaurants at lunch (01:00 PM) or dinner (08:00 PM) slots.
5. Organize selected places across days in a sensible order.
6. Personalize suggestions using interests and travel type.
7. Include realistic activity descriptions, times and durations.
8. Budget amounts are estimates, not verified live prices.
9. Do not invent precise travel distances or claim live availability.
10. Keep estimated spending within the supplied budget when reasonably possible.
11. If no places are selected, suggest suitable attractions for the destination.
12. Use Indian rupees for budget amounts.
13. Every activity must contain time, title, placeName, category, icon,
    duration, description and transitAfter.
14. Include accommodation, food, transport, activities and miscellaneous
    expenses in the budget breakdown.
15. Use numeric values for budget amounts and day numbers.

Return an object with this structure:
{
  "destination": "string",
  "numberOfDays": 1,
  "travelers": 1,
  "budget": 10000,
  "travelType": "Solo",
  "interests": [],
  "selectedPlaces": [],
  "selectedRestaurants": [],
  "overviewText": "string",
  "daysList": [
    {
      "day": 1,
      "date": "Day 1",
      "theme": "string",
      "activities": [
        {
          "time": "09:00 AM",
          "title": "string",
          "placeName": "string",
          "category": "Sightseeing",
          "icon": "📍",
          "duration": "2 Hours",
          "description": "string",
          "transitAfter": "string"
        }
      ]
    }
  ],
  "budgetPlan": {
    "totalBudget": 10000,
    "estimatedSpend": 8000,
    "remainingBudget": 2000,
    "hotelTierDesc": "string",
    "diningTierDesc": "string",
    "transportTierDesc": "string",
    "breakdown": [
      {
        "name": "Accommodation",
        "icon": "🏨",
        "amount": 3000,
        "desc": "Estimated accommodation costs",
        "percent": "30%",
        "color": "#3b82f6"
      }
    ]
  },
  "budgetSavingSuggestions": ["string"],
  "travelTips": ["string"]
}
`;

    const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            temperature: 0.4,
        },
    });

    const responseText = response?.text;

    if (!responseText || !responseText.trim()) {
        const error = new Error('Gemini returned an empty itinerary.');
        error.statusCode = 502;
        throw error;
    }

    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.slice(7);
    } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.slice(3);
    }
    if (cleanedText.endsWith('```')) {
        cleanedText = cleanedText.slice(0, -3);
    }
    cleanedText = cleanedText.trim();

    let itinerary;

    try {
        itinerary = JSON.parse(cleanedText);
    } catch {
        const error = new Error(
            'Gemini returned invalid JSON for the itinerary.'
        );
        error.statusCode = 502;
        throw error;
    }

    // Validate the generated itinerary
    if (
        !itinerary ||
        typeof itinerary !== 'object' ||
        !Array.isArray(itinerary.daysList) ||
        itinerary.daysList.length === 0 ||
        !itinerary.budgetPlan ||
        !Array.isArray(itinerary.budgetPlan.breakdown)
    ) {
        const error = new Error(
            'Gemini returned an incomplete itinerary structure.'
        );
        error.statusCode = 502;
        throw error;
    }

    // Guarantee mathematical budget invariant
    if (itinerary.budgetPlan) {
        const totalB = Number(itinerary.budgetPlan.totalBudget) || Number(budget);
        const estS = Number(itinerary.budgetPlan.estimatedSpend || itinerary.budgetPlan.estimatedTotal) || 0;
        itinerary.budgetPlan.totalBudget = totalB;
        itinerary.budgetPlan.estimatedSpend = estS;
        itinerary.budgetPlan.remainingBudget = totalB - estS;
        itinerary.budgetPlan.isOverBudget = itinerary.budgetPlan.remainingBudget < 0;
    }

    return itinerary;
}

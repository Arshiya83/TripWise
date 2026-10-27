import Trip from '../models/Trip.js';

const VALID_TRAVEL_TYPES = ['Solo', 'Couple', 'Family', 'Friends'];

function formatPlaces(selectedPlaces, destination) {
    return (selectedPlaces || []).map((p) => {
        if (typeof p === 'string') {
            return {
                name: p.trim(),
                destination: String(destination).trim(),
                city: String(destination).trim(),
            };
        }
        return {
            id: p.id || p._id ? String(p.id || p._id) : '',
            name: p.name || p.title || 'Attraction',
            destination: p.city || p.destination || String(destination).trim(),
            city: p.city || p.destination || String(destination).trim(),
            imageUrl: p.image || p.imageUrl || '',
            image: p.image || p.imageUrl || '',
            category: p.category || '',
            rating: Number(p.rating) || 4.5,
            entryFee: Number(p.entryFee) || 0,
        };
    });
}

function formatHotels(selectedHotels, destination) {
    return (selectedHotels || []).map((h) => {
        if (typeof h === 'string') {
            return { name: h.trim(), city: String(destination).trim() };
        }
        return {
            id: h.id || h._id ? String(h.id || h._id) : '',
            name: h.name || 'Hotel',
            city: h.city || String(destination).trim(),
            stars: Number(h.stars) || 3,
            rating: Number(h.rating) || 4,
            pricePerNight: Number(h.pricePerNight) || 0,
            image: h.image || h.imageUrl || '',
            imageUrl: h.imageUrl || h.image || '',
            amenities: Array.isArray(h.amenities) ? h.amenities : [],
            location: h.location || '',
            address: h.address || '',
        };
    });
}

function formatRestaurants(selectedRestaurants, destination) {
    return (selectedRestaurants || []).map((r) => {
        if (typeof r === 'string') {
            return { name: r.trim(), city: String(destination).trim() };
        }
        return {
            id: r.id || r._id ? String(r.id || r._id) : '',
            name: r.name || 'Restaurant',
            city: r.city || String(destination).trim(),
            cuisine: r.cuisine || '',
            priceRange: r.priceRange || '',
            rating: Number(r.rating) || 4,
            image: r.image || r.imageUrl || '',
            imageUrl: r.imageUrl || r.image || '',
            specialty: r.specialty || '',
            famousFor: r.famousFor || '',
            location: r.location || '',
            address: r.address || '',
        };
    });
}

function formatItinerary(itinerary) {
    return (itinerary || []).map((d) => ({
        day: Number(d.day) || 1,
        title: d.title || d.theme || `Day ${d.day || 1}`,
        theme: d.theme || d.title || `Day ${d.day || 1}`,
        activities: (d.activities || []).map((a) => ({
            time: a.time || '',
            placeName: a.placeName || a.title || 'Activity',
            title: a.title || a.placeName || 'Activity',
            description: a.description || '',
            estimatedCost: Number(a.estimatedCost || a.cost) || 0,
            entryFee: a.entryFee || '',
            category: a.category || '',
            duration: a.duration || '',
            icon: a.icon || '📍',
            transitAfter: a.transitAfter || '',
        })),
    }));
}

function formatBudget(budgetBreakdown, defaultBudget = 0) {
    if (typeof budgetBreakdown !== 'object' || budgetBreakdown === null) {
        return {};
    }
    return {
        accommodation: Number(budgetBreakdown.accommodation) || 0,
        food: Number(budgetBreakdown.food) || 0,
        transport: Number(budgetBreakdown.transport) || 0,
        activities: Number(budgetBreakdown.activities) || 0,
        shopping: Number(budgetBreakdown.shopping || budgetBreakdown.misc) || 0,
        misc: Number(budgetBreakdown.misc || budgetBreakdown.shopping) || 0,
        estimatedTotal: Number(budgetBreakdown.estimatedTotal || budgetBreakdown.estimatedSpend) || 0,
        estimatedSpend: Number(budgetBreakdown.estimatedSpend || budgetBreakdown.estimatedTotal) || 0,
        totalBudget: Number(budgetBreakdown.totalBudget || defaultBudget) || 0,
        remaining: Number(budgetBreakdown.remaining !== undefined ? budgetBreakdown.remaining : budgetBreakdown.remainingBudget) || 0,
        remainingBudget: Number(budgetBreakdown.remainingBudget !== undefined ? budgetBreakdown.remainingBudget : budgetBreakdown.remaining) || 0,
    };
}

// Save a new trip for the logged-in user or update existing record if _id is provided
export async function saveTrip(req, res, next) {
    try {
        const {
            _id,
            id,
            destination,
            numberOfDays,
            travelers,
            budget,
            travelType,
            interests = [],
            selectedPlaces = [],
            selectedHotels = [],
            selectedRestaurants = [],
            itinerary = [],
            budgetBreakdown = {},
            status = 'planned',
            coverImage,
            accommodationPricingMode,
            manualAccommodationCost,
        } = req.body;

        if (!destination || !numberOfDays || budget === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Destination, number of days, and budget are required.',
            });
        }

        const normalizedType =
            VALID_TRAVEL_TYPES.find(
                (t) => t.toLowerCase() === String(travelType || '').trim().toLowerCase()
            ) || 'Couple';

        const normalizedPricingMode =
            accommodationPricingMode === 'manual' ? 'manual' : 'auto';
        const parsedManualCost =
            manualAccommodationCost !== undefined && manualAccommodationCost !== null
                ? Math.max(0, Number(manualAccommodationCost) || 0)
                : 0;

        const formattedPlaces = formatPlaces(selectedPlaces, destination);
        const formattedHotels = formatHotels(selectedHotels, destination);
        const formattedRestaurants = formatRestaurants(selectedRestaurants, destination);
        const formattedItinerary = formatItinerary(itinerary);
        const formattedBudget = formatBudget(budgetBreakdown, budget);

        let tripCover = coverImage || '';
        if (!tripCover && formattedPlaces.length > 0 && (formattedPlaces[0].imageUrl || formattedPlaces[0].image)) {
            tripCover = formattedPlaces[0].imageUrl || formattedPlaces[0].image;
        }
        if (!tripCover && formattedHotels.length > 0 && (formattedHotels[0].imageUrl || formattedHotels[0].image)) {
            tripCover = formattedHotels[0].imageUrl || formattedHotels[0].image;
        }

        // If _id or id is provided, check if existing trip exists for this user and update it (prevents duplicate saves)
        const targetId = _id || id;
        if (targetId && String(targetId).match(/^[0-9a-fA-F]{24}$/)) {
            const existingTrip = await Trip.findOne({
                _id: targetId,
                userId: req.user.userId,
            });

            if (existingTrip) {
                existingTrip.destination = String(destination).trim();
                existingTrip.numberOfDays = Math.max(1, Math.min(30, Number(numberOfDays)));
                existingTrip.travelers = Math.max(1, Number(travelers) || 1);
                existingTrip.budget = Number(budget) || 0;
                existingTrip.travelType = normalizedType;
                existingTrip.interests = Array.isArray(interests) ? interests : existingTrip.interests;
                existingTrip.selectedPlaces = formattedPlaces;
                existingTrip.selectedHotels = formattedHotels;
                existingTrip.accommodationPricingMode = normalizedPricingMode;
                existingTrip.manualAccommodationCost = parsedManualCost;
                existingTrip.selectedRestaurants = formattedRestaurants;
                existingTrip.itinerary = formattedItinerary;
                existingTrip.budgetBreakdown = formattedBudget;
                existingTrip.status = ['draft', 'planned', 'completed'].includes(status) ? status : existingTrip.status;
                if (tripCover) existingTrip.coverImage = tripCover;
                existingTrip.isSaved = true;

                await existingTrip.save();

                return res.status(200).json({
                    success: true,
                    message: 'Trip updated successfully.',
                    trip: existingTrip,
                });
            }
        }

        const trip = await Trip.create({
            userId: req.user.userId,
            destination: String(destination).trim(),
            numberOfDays: Math.max(1, Math.min(30, Number(numberOfDays))),
            travelers: Math.max(1, Number(travelers) || 1),
            budget: Number(budget) || 0,
            travelType: normalizedType,
            interests: Array.isArray(interests) ? interests : [],
            selectedPlaces: formattedPlaces,
            selectedHotels: formattedHotels,
            accommodationPricingMode: normalizedPricingMode,
            manualAccommodationCost: parsedManualCost,
            selectedRestaurants: formattedRestaurants,
            itinerary: formattedItinerary,
            budgetBreakdown: formattedBudget,
            status: ['draft', 'planned', 'completed'].includes(status) ? status : 'planned',
            coverImage: tripCover,
            isSaved: true,
        });

        return res.status(201).json({
            success: true,
            message: 'Trip saved successfully.',
            trip,
        });
    } catch (error) {
        next(error);
    }
}

// Update an existing saved trip belonging to the logged-in user
export async function updateTrip(req, res, next) {
    try {
        const { id } = req.params;
        const trip = await Trip.findOne({
            _id: id,
            userId: req.user.userId,
        });

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found.',
            });
        }

        const {
            destination,
            numberOfDays,
            travelers,
            budget,
            travelType,
            interests,
            selectedPlaces,
            selectedHotels,
            selectedRestaurants,
            itinerary,
            budgetBreakdown,
            status,
            coverImage,
            accommodationPricingMode,
            manualAccommodationCost,
        } = req.body;

        if (destination) trip.destination = String(destination).trim();
        if (numberOfDays) trip.numberOfDays = Math.max(1, Math.min(30, Number(numberOfDays)));
        if (travelers) trip.travelers = Math.max(1, Number(travelers) || 1);
        if (budget !== undefined) trip.budget = Number(budget) || 0;
        if (travelType) {
            const normalizedType =
                VALID_TRAVEL_TYPES.find(
                    (t) => t.toLowerCase() === String(travelType || '').trim().toLowerCase()
                ) || trip.travelType;
            trip.travelType = normalizedType;
        }
        if (interests) trip.interests = Array.isArray(interests) ? interests : trip.interests;
        if (selectedPlaces) trip.selectedPlaces = formatPlaces(selectedPlaces, trip.destination);
        if (selectedHotels) trip.selectedHotels = formatHotels(selectedHotels, trip.destination);
        if (accommodationPricingMode !== undefined) {
            trip.accommodationPricingMode = accommodationPricingMode === 'manual' ? 'manual' : 'auto';
        }
        if (manualAccommodationCost !== undefined) {
            trip.manualAccommodationCost = Math.max(0, Number(manualAccommodationCost) || 0);
        }
        if (selectedRestaurants) trip.selectedRestaurants = formatRestaurants(selectedRestaurants, trip.destination);
        if (itinerary) trip.itinerary = formatItinerary(itinerary);
        if (budgetBreakdown) trip.budgetBreakdown = formatBudget(budgetBreakdown, trip.budget);
        if (status && ['draft', 'planned', 'completed'].includes(status)) trip.status = status;
        if (coverImage) trip.coverImage = coverImage;

        await trip.save();

        return res.status(200).json({
            success: true,
            message: 'Trip updated successfully.',
            trip,
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid trip ID.',
            });
        }
        next(error);
    }
}

// Get trips belonging to the logged-in user
export async function getMyTrips(req, res, next) {
    try {
        const trips = await Trip.find({
            userId: req.user.userId,
            isSaved: { $ne: false },
        }).sort({ updatedAt: -1, createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: trips.length,
            trips,
        });
    } catch (error) {
        next(error);
    }
}

// Get one saved trip belonging to the logged-in user
export async function getTripById(req, res, next) {
    try {
        const trip = await Trip.findOne({
            _id: req.params.id,
            userId: req.user.userId,
        });

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found.',
            });
        }

        return res.status(200).json({
            success: true,
            trip,
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid trip ID.',
            });
        }

        next(error);
    }
}

// Delete one saved trip belonging to the logged-in user
export async function deleteTrip(req, res, next) {
    try {
        const trip = await Trip.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId,
        });

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found.',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Trip deleted successfully.',
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid trip ID.',
            });
        }

        next(error);
    }
}

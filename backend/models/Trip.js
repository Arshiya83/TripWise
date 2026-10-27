import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        destination: {
            type: String,
            required: true,
            trim: true,
        },
        numberOfDays: {
            type: Number,
            required: true,
            min: 1,
            max: 30,
        },
        travelers: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
        },
        budget: {
            type: Number,
            required: true,
            min: 0,
        },
        travelType: {
            type: String,
            enum: ['Solo', 'Couple', 'Family', 'Friends'],
            required: true,
        },
        interests: [{ type: String, trim: true }],
        coverImage: {
            type: String,
            default: '',
        },
        selectedPlaces: [
            {
                attractionId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Attraction',
                },
                id: { type: String, default: '' },
                name: { type: String, required: true },
                destination: { type: String, trim: true },
                city: { type: String, trim: true },
                imageUrl: { type: String, default: '' },
                image: { type: String, default: '' },
                category: { type: String, default: '' },
                rating: { type: Number, default: 4.5 },
                entryFee: { type: Number, default: 0 },
            },
        ],
        selectedHotels: [
            {
                id: { type: String, default: '' },
                name: { type: String, required: true },
                city: { type: String, default: '' },
                stars: { type: Number, default: 3 },
                rating: { type: Number, default: 4 },
                pricePerNight: { type: Number, default: 0 },
                image: { type: String, default: '' },
                imageUrl: { type: String, default: '' },
                amenities: [{ type: String }],
                location: { type: String, default: '' },
                address: { type: String, default: '' },
            },
        ],
        accommodationPricingMode: {
            type: String,
            enum: ['auto', 'manual'],
            default: 'auto',
        },
        manualAccommodationCost: {
            type: Number,
            default: 0,
            min: 0,
        },
        selectedRestaurants: [
            {
                id: { type: String, default: '' },
                name: { type: String, required: true },
                city: { type: String, default: '' },
                cuisine: { type: String, default: '' },
                priceRange: { type: String, default: '' },
                rating: { type: Number, default: 4 },
                image: { type: String, default: '' },
                imageUrl: { type: String, default: '' },
                specialty: { type: String, default: '' },
                famousFor: { type: String, default: '' },
                location: { type: String, default: '' },
                address: { type: String, default: '' },
            },
        ],
        itinerary: [
            {
                day: { type: Number, required: true },
                title: { type: String, default: '' },
                theme: { type: String, default: '' },
                activities: [
                    {
                        time: { type: String, default: '' },
                        placeName: { type: String, default: '' },
                        title: { type: String, default: '' },
                        description: { type: String, default: '' },
                        estimatedCost: { type: Number, default: 0, min: 0 },
                        entryFee: { type: String, default: '' },
                        category: { type: String, default: '' },
                        duration: { type: String, default: '' },
                        icon: { type: String, default: '📍' },
                        transitAfter: { type: String, default: '' },
                    },
                ],
            },
        ],
        budgetBreakdown: {
            accommodation: { type: Number, default: 0, min: 0 },
            food: { type: Number, default: 0, min: 0 },
            transport: { type: Number, default: 0, min: 0 },
            activities: { type: Number, default: 0, min: 0 },
            shopping: { type: Number, default: 0, min: 0 },
            misc: { type: Number, default: 0, min: 0 },
            estimatedTotal: { type: Number, default: 0, min: 0 },
            estimatedSpend: { type: Number, default: 0, min: 0 },
            totalBudget: { type: Number, default: 0, min: 0 },
            remaining: { type: Number, default: 0 },
            remainingBudget: { type: Number, default: 0 },
        },
        status: {
            type: String,
            enum: ['draft', 'planned', 'completed'],
            default: 'planned',
        },
        isSaved: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

tripSchema.index({ userId: 1, createdAt: -1 });
tripSchema.index({ destination: 1, createdAt: -1 });

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;

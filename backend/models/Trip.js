
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
        selectedPlaces: [
            {
                attractionId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Attraction',
                },
                name: { type: String, required: true },
                destination: { type: String, trim: true },
                imageUrl: { type: String, default: '' },
                category: { type: String, default: '' },
            },
        ],
        itinerary: [
            {
                day: { type: Number, required: true },
                title: { type: String, default: '' },
                activities: [
                    {
                        time: { type: String, default: '' },
                        placeName: { type: String, required: true },
                        description: { type: String, default: '' },
                        estimatedCost: { type: Number, default: 0, min: 0 },
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
            estimatedTotal: { type: Number, default: 0, min: 0 },
            remaining: { type: Number, default: 0 },
        },
        status: {
            type: String,
            enum: ['draft', 'planned', 'completed'],
            default: 'draft',
        },
        isSaved: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

tripSchema.index({ destination: 1, createdAt: -1 });

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;

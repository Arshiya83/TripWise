
import mongoose from 'mongoose';

const attractionSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        destination: { type: String, required: true, trim: true, index: true },
        category: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        imageUrl: { type: String, default: '' },
        tags: [{ type: String, trim: true }],
        durationMinutes: { type: Number, default: 60, min: 0 },
        entryFee: { type: Number, default: 0, min: 0 },
        bestTime: { type: String, default: '' },
        location: {
            latitude: { type: Number },
            longitude: { type: Number },
        },
    },
    { timestamps: true }
);

attractionSchema.index({ destination: 1, name: 1 }, { unique: true });

const Attraction = mongoose.model('Attraction', attractionSchema);

export default Attraction;


import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        destination: { type: String, required: true, trim: true, index: true },
        description: { type: String, default: '' },
        imageUrl: { type: String, default: '' },
        cuisine: [{ type: String, trim: true }],
        priceRange: { type: String, default: '' },
        rating: { type: Number, min: 0, max: 5 },
        address: { type: String, default: '' },
        location: {
            latitude: { type: Number },
            longitude: { type: Number },
        },
    },
    { timestamps: true }
);

restaurantSchema.index({ destination: 1, name: 1 }, { unique: true });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

export default Restaurant;

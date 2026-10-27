
import mongoose from 'mongoose';

const hotelSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        destination: { type: String, required: true, trim: true, index: true },
        description: { type: String, default: '' },
        imageUrl: { type: String, default: '' },
        category: { type: String, default: '' },
        pricePerNight: { type: Number, required: true, min: 0 },
        rating: { type: Number, min: 0, max: 5 },
        amenities: [{ type: String, trim: true }],
        address: { type: String, default: '' },
        location: {
            latitude: { type: Number },
            longitude: { type: Number },
        },
    },
    { timestamps: true }
);

hotelSchema.index({ destination: 1, name: 1 }, { unique: true });

const Hotel = mongoose.model('Hotel', hotelSchema);

export default Hotel;

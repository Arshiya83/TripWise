
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        passwordHash: {
            type: String,
            required: true,
            select: false,
        },
        profileImage: {
            type: String,
            default: '',
        },
        savedPlaces: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Attraction',
            },
        ],
    },
    { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;

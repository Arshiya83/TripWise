import express from 'express';

import {
    saveTrip,
    updateTrip,
    getMyTrips,
    getTripById,
    deleteTrip,
} from '../controllers/tripController.js';

import {
    generateTripItinerary,
} from '../controllers/aiController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All trip routes require authentication
router.use(protect);

// Generate an AI itinerary using Gemini
router.post('/generate', generateTripItinerary);

// Save and retrieve trips
router.post('/', saveTrip);
router.get('/', getMyTrips);
router.get('/:id', getTripById);
router.put('/:id', updateTrip);
router.delete('/:id', deleteTrip);

export default router;

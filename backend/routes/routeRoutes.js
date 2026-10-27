import express from 'express';
import { calculateRoute } from '../controllers/routeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All route calculation endpoints require authentication
router.use(protect);

// Calculate distance, travel time, and waypoints for given places
router.post('/calculate', calculateRoute);

export default router;

import express from 'express';
import { getRestaurants, getRestaurantById } from '../controllers/restaurantController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Require JWT authentication for all restaurant recommendation endpoints
router.use(protect);

router.get('/', getRestaurants);
router.get('/:id', getRestaurantById);

export default router;

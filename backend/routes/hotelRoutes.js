import express from 'express';
import { getHotels, getHotelById } from '../controllers/hotelController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Require JWT authentication for all hotel recommendation endpoints
router.use(protect);

router.get('/', getHotels);
router.get('/:id', getHotelById);

export default router;

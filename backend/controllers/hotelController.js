import Hotel from '../models/Hotel.js';

/**
 * GET /api/hotels
 * Retrieve verified hotel recommendations with destination and optional budget filtering.
 * Protected by JWT authentication middleware.
 */
export async function getHotels(req, res, next) {
  try {
    const { city, budget, maxPrice, sort } = req.query;

    const filter = {};
    if (city && typeof city === 'string' && city.trim()) {
      filter.destination = new RegExp(`^${city.trim()}$`, 'i');
    }

    if (maxPrice && !isNaN(Number(maxPrice)) && Number(maxPrice) > 0) {
      filter.pricePerNight = { $lte: Number(maxPrice) };
    }

    let query = Hotel.find(filter);

    if (sort === 'price_asc') {
      query = query.sort({ pricePerNight: 1 });
    } else if (sort === 'price_desc') {
      query = query.sort({ pricePerNight: -1 });
    } else if (sort === 'rating') {
      query = query.sort({ rating: -1, pricePerNight: 1 });
    } else {
      query = query.sort({ rating: -1, pricePerNight: 1 });
    }

    const hotels = await query.exec();

    return res.status(200).json({
      success: true,
      count: hotels.length,
      city: city || 'all',
      budget: budget ? Number(budget) : undefined,
      hotels,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/hotels/:id
 * Retrieve single hotel details by ID.
 */
export async function getHotelById(req, res, next) {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found.',
      });
    }

    return res.status(200).json({
      success: true,
      hotel,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid hotel ID format.',
      });
    }
    next(error);
  }
}

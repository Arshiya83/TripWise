import Restaurant from '../models/Restaurant.js';

/**
 * GET /api/restaurants
 * Retrieve verified restaurant recommendations with destination, cuisine, and rating filters.
 * Protected by JWT authentication middleware.
 */
export async function getRestaurants(req, res, next) {
  try {
    const { city, cuisine, priceRange, sort } = req.query;

    const filter = {};
    if (city && typeof city === 'string' && city.trim()) {
      filter.destination = new RegExp(`^${city.trim()}$`, 'i');
    }

    if (cuisine && typeof cuisine === 'string' && cuisine.trim()) {
      filter.cuisine = new RegExp(cuisine.trim(), 'i');
    }

    if (priceRange && typeof priceRange === 'string' && priceRange.trim()) {
      filter.priceRange = priceRange.trim();
    }

    let query = Restaurant.find(filter);

    if (sort === 'rating') {
      query = query.sort({ rating: -1 });
    } else {
      query = query.sort({ rating: -1 });
    }

    const restaurants = await query.exec();

    return res.status(200).json({
      success: true,
      count: restaurants.length,
      city: city || 'all',
      restaurants,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/restaurants/:id
 * Retrieve single restaurant details by ID.
 */
export async function getRestaurantById(req, res, next) {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found.',
      });
    }

    return res.status(200).json({
      success: true,
      restaurant,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format.',
      });
    }
    next(error);
  }
}

import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Hotel from '../models/Hotel.js';
import Restaurant from '../models/Restaurant.js';

export const HOTELS_SEED = [
  // === HYDERABAD ===
  {
    name: 'Taj Falaknuma Palace',
    destination: 'Hyderabad',
    description: 'Iconic 19th-century royal palace hotel perched 2,000 feet above the city with Italian marble courtyards and Nizam heritage.',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    category: '5-Star Luxury Heritage',
    pricePerNight: 28000,
    rating: 4.9,
    amenities: ['Free WiFi', 'Infinity Pool', 'Jiva Spa by Clarins', 'Royal Butler Service', 'Heritage Walk'],
    location: { latitude: 17.3314, longitude: 78.4673 },
    address: 'Engine Bowli, Fatima Nagar, Falaknuma, Hyderabad 500053',
  },
  {
    name: 'ITC Kakatiya Luxury Collection',
    destination: 'Hyderabad',
    description: 'Premier 5-star hotel honoring Kakatiya dynasty architecture with signature Deccan dining and modern luxury.',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    category: '5-Star Business Luxury',
    pricePerNight: 8500,
    rating: 4.7,
    amenities: ['Free Breakfast', 'Outdoor Pool', 'Kaya Kalp Spa', 'Fitness Center', 'Deccan Dining'],
    location: { latitude: 17.4334, longitude: 78.4542 },
    address: '6-3-1187, Begumpet, Hyderabad 500016',
  },
  {
    name: 'The Park Hyderabad',
    destination: 'Hyderabad',
    description: 'Contemporary design boutique hotel overlooking Hussain Sagar Lake with striking jewel-toned facades.',
    imageUrl: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80',
    category: 'Design Boutique',
    pricePerNight: 5200,
    rating: 4.5,
    amenities: ['Lake View Rooms', 'Infinity Pool', 'Aura Spa', 'Free WiFi', 'Aish Nizami Dining', 'Aqua Lounge'],
    location: { latitude: 17.4258, longitude: 78.4619 },
    address: '22, Raj Bhavan Road, Somajiguda, Hyderabad 500082',
  },

  // === DELHI ===
  {
    name: 'The Imperial New Delhi',
    destination: 'Delhi',
    description: 'Legendary 1931 Art Deco colonial palace hotel in Connaught Place boasting museum-quality South Asian art collections.',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    category: '5-Star Heritage Palace',
    pricePerNight: 22000,
    rating: 4.9,
    amenities: ['Free WiFi', 'Swimming Pool', 'Imperial Spa', 'Heritage Dining', 'Art Galleries'],
    location: { latitude: 28.6234, longitude: 77.2185 },
  },
  {
    name: 'Taj Mahal Hotel New Delhi',
    destination: 'Delhi',
    description: 'Distinguished landmark of Lutyens Delhi near India Gate with timeless Mughal-inspired hospitality.',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    category: '5-Star Luxury',
    pricePerNight: 18500,
    rating: 4.8,
    amenities: ['Free Breakfast', 'Pool', 'Jiva Spa', 'Fitness Center', 'Varq Fine Dining'],
    location: { latitude: 28.5996, longitude: 77.2255 },
  },
  {
    name: 'The Lalit New Delhi',
    destination: 'Delhi',
    description: 'Vibrant upscale hotel in the heart of Connaught Place featuring rooftop pool, renowned nightlife, and modern art.',
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    category: '5-Star Business & Leisure',
    pricePerNight: 9500,
    rating: 4.6,
    amenities: ['Free WiFi', 'Rooftop Pool', 'Rejuve Spa', 'Multiple Restaurants', 'Concierge'],
    location: { latitude: 28.6315, longitude: 77.2278 },
  },
  {
    name: 'Bloomrooms @ New Delhi Station',
    destination: 'Delhi',
    description: 'Clean, cheerful bright-yellow designer budget stay walking distance from New Delhi Railway Station & Metro.',
    imageUrl: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80',
    category: 'Boutique Budget',
    pricePerNight: 3800,
    rating: 4.3,
    amenities: ['Free High-Speed WiFi', 'Rain Showers', '24hr Front Desk', 'Airport Shuttle'],
    location: { latitude: 28.6432, longitude: 77.2195 },
  },

  // === GOA ===
  {
    name: 'The Leela Goa',
    destination: 'Goa',
    description: '75-acre pristine beachfront paradise in South Goa nestled between Arabian Sea and the River Sal with 12-hole golf course.',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    category: '5-Star Beachfront Luxury',
    pricePerNight: 19000,
    rating: 4.9,
    amenities: ['Private Beach Access', 'Lagoon Pools', 'Golf Course', 'The Spa', 'Fine Dining Pavilions'],
    location: { latitude: 15.1594, longitude: 73.9456 },
  },
  {
    name: 'Alila Diwa Resort & Spa',
    destination: 'Goa',
    description: 'Contemporary Balinese and Goan eco-luxury resort surrounded by lush emerald paddy fields near Majorda Beach.',
    imageUrl: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80',
    category: '5-Star Eco Resort',
    pricePerNight: 11000,
    rating: 4.8,
    amenities: ['Infinity Pool Overlooking Paddy', 'Spa Alila', 'Beach Shuttle', 'Free Breakfast'],
    location: { latitude: 15.3125, longitude: 73.9185 },
  },
  {
    name: 'Siolim House Heritage Boutique',
    destination: 'Goa',
    description: 'Authentic 350-year-old Portuguese governor aristocratic mansion turned serene 7-suite boutique retreat.',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    category: 'Portuguese Heritage Boutique',
    pricePerNight: 8500,
    rating: 4.6,
    amenities: ['Courtyard Pool', 'Home Cooked Coastal Feasts', 'Antique Furnishings', 'Yoga'],
    location: { latitude: 15.6268, longitude: 73.7682 },
  },

  // === JAIPUR ===
  {
    name: 'Rambagh Palace',
    destination: 'Jaipur',
    description: 'The Jewel of Jaipur — former official royal residence of the Maharaja of Jaipur set across 47 acres of manicured gardens.',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    category: 'Palace Luxury',
    pricePerNight: 32000,
    rating: 4.9,
    amenities: ['Peacock Gardens', 'Indoor & Outdoor Pools', 'Jiva Grande Spa', 'Polo Bar', 'Vintage Car Tour'],
    location: { latitude: 26.8978, longitude: 75.8078 },
  },
  {
    name: 'Samode Haveli',
    destination: 'Jaipur',
    description: 'Romantic 175-year-old royal townhouse haveli within old walled city walls featuring frescoed archways and elephant ramps.',
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    category: 'Heritage Haveli',
    pricePerNight: 13000,
    rating: 4.7,
    amenities: ['Rooftop Pool', 'Frescoed Dining Rooms', 'Lush Courtyards', 'Ayurvedic Spa'],
    location: { latitude: 26.9324, longitude: 75.8345 },
  },
  {
    name: 'Pearl Palace Heritage',
    destination: 'Jaipur',
    description: 'Voted India best boutique heritage hotel, each artisan room meticulously hand-decorated celebrating regional Indian art.',
    imageUrl: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80',
    category: 'Heritage Boutique Budget',
    pricePerNight: 3200,
    rating: 4.5,
    amenities: ['Themed Heritage Rooms', 'Rooftop Cafe Nearby', 'Free High-Speed WiFi', 'Art Gallery'],
    location: { latitude: 26.9158, longitude: 75.7925 },
  },

  // === MUMBAI ===
  {
    name: 'The Taj Mahal Palace Mumbai',
    destination: 'Mumbai',
    description: 'Legendary 1903 flagship heritage palace facing the Gateway of India and the Arabian Sea with world-class fine dining.',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    category: '5-Star Historic Landmark',
    pricePerNight: 35000,
    rating: 4.9,
    amenities: ['Sea-Facing Heritage Suites', '10 Renowned Restaurants', 'Swimming Pool', 'Jiva Spa'],
    location: { latitude: 18.9217, longitude: 72.8332 },
  },
  {
    name: 'ITC Grand Central Mumbai',
    destination: 'Mumbai',
    description: 'Victorian-inspired luxury hotel in Central Mumbai with magnificent city panoramas and signature Kebabs & Kurries.',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    category: '5-Star Business Luxury',
    pricePerNight: 10500,
    rating: 4.7,
    amenities: ['Rooftop Swimming Pool', 'Kaya Kalp Spa', 'Prive Executive Lounge', 'Fitness Hub'],
    location: { latitude: 19.0045, longitude: 72.8423 },
  },
  {
    name: 'Hotel Sea Princess',
    destination: 'Mumbai',
    description: 'Direct beachfront property on Juhu Beach with sea-view sundowners and immediate access to Mumbai nightlife.',
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    category: 'Beachfront Hotel',
    pricePerNight: 6800,
    rating: 4.4,
    amenities: ['Direct Juhu Beach Views', 'Swimming Pool', 'Multi-cuisine Beach Cafe', 'Free WiFi'],
    location: { latitude: 19.0984, longitude: 72.8262 },
  },
];

export const RESTAURANTS_SEED = [
  // === HYDERABAD ===
  {
    name: 'Paradise Biryani Heritage',
    destination: 'Hyderabad',
    description: 'Established in 1953, the legendary multi-story culinary institution synonymous worldwide with authentic Hyderabadi Dum Biryani.',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    cuisine: ['Hyderabadi', 'Mughlai', 'Biryani'],
    priceRange: '₹₹',
    rating: 4.7,
    location: { latitude: 17.4415, longitude: 78.4872 },
  },
  {
    name: 'Bawarchi Restaurant',
    destination: 'Hyderabad',
    description: 'Beloved city powerhouse at RTC X Roads renowned for spicy tandoori chicken, aromatic mutton biryani, and quick service.',
    imageUrl: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=800&q=80',
    cuisine: ['Mughlai', 'North Indian', 'Tandoor'],
    priceRange: '₹₹',
    rating: 4.6,
    location: { latitude: 17.4042, longitude: 78.4983 },
  },
  {
    name: 'Nimrah Cafe & Bakery',
    destination: 'Hyderabad',
    description: 'Historic cafe directly facing Charminar arches since 1993, famous for piping hot Irani chai with melt-in-mouth Osmania biscuits.',
    imageUrl: 'https://images.unsplash.com/photo-1571997478779-2ad5be9643a8?auto=format&fit=crop&w=800&q=80',
    cuisine: ['Irani Cafe', 'Bakery & Chai'],
    priceRange: '₹',
    rating: 4.8,
    location: { latitude: 17.3616, longitude: 78.4747 },
  },
  {
    name: 'Jewel of Nizam - The Minar',
    destination: 'Hyderabad',
    description: 'Iconic 100-foot royal tower dining overlooking Gandipet Lake serving recipes straight from the Nizam royal kitchen.',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    cuisine: ['Nizami Royal', 'Fine Dining'],
    priceRange: '₹₹₹₹',
    rating: 4.9,
    location: { latitude: 17.3824, longitude: 78.3325 },
  },

  // === DELHI ===
  {
    name: "Karim's Historic Mughlai",
    destination: 'Delhi',
    description: 'Founded in 1913 near Jama Masjid by the royal chef of the last Mughal emperor, world-famous for slow-cooked mutton nihari & kebabs.',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    cuisine: ['Mughlai', 'Old Delhi Heritage', 'Kebabs'],
    priceRange: '₹₹',
    rating: 4.7,
    location: { latitude: 28.6508, longitude: 77.2334 },
  },
  {
    name: 'Bukhara at ITC Maurya',
    destination: 'Delhi',
    description: 'Globally celebrated culinary icon serving earthen-oven tandoori delicacies and signature 18-hour slow-cooked Dal Bukhara.',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    cuisine: ['North-West Frontier', 'Tandoor'],
    priceRange: '₹₹₹₹',
    rating: 4.9,
    location: { latitude: 28.5976, longitude: 77.1725 },
  },
  {
    name: 'Saravana Bhavan Connaught Place',
    destination: 'Delhi',
    description: 'Renowned international institution for authentic South Indian vegetarian fare, crispy ghee roast dosas, and filter coffee.',
    imageUrl: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=800&q=80',
    cuisine: ['South Indian Vegetarian', 'Filter Coffee'],
    priceRange: '₹',
    rating: 4.5,
    location: { latitude: 28.6295, longitude: 77.2198 },
  },
  {
    name: 'Indian Accent',
    destination: 'Delhi',
    description: 'Frequently crowned India best restaurant, Chef Manish Mehrotra inventive gourmet dining reinterprets nostalgic Indian flavors.',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    cuisine: ['Modern Innovative Indian', 'Gourmet'],
    priceRange: '₹₹₹₹',
    rating: 4.9,
    location: { latitude: 28.5912, longitude: 77.2384 },
  },

  // === GOA ===
  {
    name: "Fisherman's Wharf",
    destination: 'Goa',
    description: 'Breezy riverside open-air deck along the River Sal serving authentic Goan prawn balchao, butter garlic crab, and fresh catch.',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    cuisine: ['Goan Coastal', 'Seafood', 'Continental'],
    priceRange: '₹₹₹',
    rating: 4.8,
    location: { latitude: 15.1764, longitude: 73.9452 },
  },
  {
    name: 'Gunpowder Assagao',
    destination: 'Goa',
    description: 'Heritage villa garden dining in peaceful Assagao celebrating rustic homestyle South Indian regional curries and craft cocktails.',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    cuisine: ['South Indian Coastal', 'Kerala & Peninsular'],
    priceRange: '₹₹',
    rating: 4.7,
    location: { latitude: 15.5894, longitude: 73.7712 },
  },
  {
    name: 'Vinayak Family Restaurant',
    destination: 'Goa',
    description: 'Beloved local open-air tavern overlooking paddy fields famous for unbeatable Goan fish curry thalis and crispy rawa fried kingfish.',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    cuisine: ['Authentic Goan Seafood', 'Thali'],
    priceRange: '₹',
    rating: 4.6,
    location: { latitude: 15.5925, longitude: 73.7645 },
  },

  // === JAIPUR ===
  {
    name: 'Chokhi Dhani Heritage Dining',
    destination: 'Jaipur',
    description: 'Immersive cultural Rajasthani village experience with folk dancers, puppet shows, and unlimited royal multi-course thalis.',
    imageUrl: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=800&q=80',
    cuisine: ['Traditional Rajasthani Thali', 'Heritage'],
    priceRange: '₹₹₹',
    rating: 4.9,
    location: { latitude: 26.7682, longitude: 75.8345 },
  },
  {
    name: 'Laxmi Mishthan Bhandar (LMB)',
    destination: 'Jaipur',
    description: 'Historic institution in Johari Bazaar since 1727, famed across India for hot Pyaaz Kachoris, royal thali, and sweet Paneer Ghewar.',
    imageUrl: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=800&q=80',
    cuisine: ['Rajasthani Sweets', 'Pure Vegetarian Thali'],
    priceRange: '₹₹',
    rating: 4.6,
    location: { latitude: 26.9208, longitude: 75.8284 },
  },
  {
    name: 'Baradari at City Palace',
    destination: 'Jaipur',
    description: 'Fine dining in the pristine marble colonnade of the Jaipur royal palace courtyard, designed by Studio Lotus.',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    cuisine: ['Contemporary Rajasthani', 'Royal European'],
    priceRange: '₹₹₹',
    rating: 4.7,
    location: { latitude: 26.9255, longitude: 75.8236 },
  },

  // === MUMBAI ===
  {
    name: 'Britannia & Co. Restaurant',
    destination: 'Mumbai',
    description: 'Cherished 1923 Parsi institution in Ballard Estate famed for its fragrant Berry Pulao, Sali Boti, and vintage colonial charm.',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    cuisine: ['Parsi & Irani', 'Heritage'],
    priceRange: '₹₹',
    rating: 4.7,
    location: { latitude: 18.9352, longitude: 72.8398 },
  },
  {
    name: 'Trishna Seafood Restaurant',
    destination: 'Mumbai',
    description: 'World-renowned culinary destination hidden in Kala Ghoda celebrated internationally for Butter Garlic Crab and coastal seafood.',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    cuisine: ['Coastal Mangalorean', 'Fresh Seafood'],
    priceRange: '₹₹₹',
    rating: 4.8,
    location: { latitude: 18.9284, longitude: 72.8315 },
  },
  {
    name: 'Leopold Cafe & Bar',
    destination: 'Mumbai',
    description: 'Vibrant 1871 heritage cafe on Colaba Causeway featured in Shantaram, serving draft beer, continental dishes, and Indian classics.',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    cuisine: ['Multi-cuisine Cafe', 'Pub Comfort Food'],
    priceRange: '₹₹',
    rating: 4.5,
    location: { latitude: 18.9228, longitude: 72.8318 },
  },
  {
    name: 'Bademiya Street Kebabs',
    destination: 'Mumbai',
    description: 'Iconic open-air late night tandoor institution behind the Taj Palace in Colaba serving smoky seekh kebabs & baida rotis since 1946.',
    imageUrl: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=800&q=80',
    cuisine: ['Tandoor & Kebabs', 'Late Night Street Food'],
    priceRange: '₹',
    rating: 4.4,
    location: { latitude: 18.9212, longitude: 72.8322 },
  },
];

export async function seedHotelsAndRestaurants() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not configured in .env');
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB Atlas for hotel & restaurant seed');

  // Upsert Hotels
  let hotelsInserted = 0;
  for (const hotel of HOTELS_SEED) {
    await Hotel.findOneAndUpdate(
      { destination: hotel.destination, name: hotel.name },
      { $set: hotel },
      { upsert: true, new: true }
    );
    hotelsInserted++;
  }
  console.log(`Successfully seeded/updated ${hotelsInserted} hotels.`);

  // Upsert Restaurants
  let restaurantsInserted = 0;
  for (const rest of RESTAURANTS_SEED) {
    await Restaurant.findOneAndUpdate(
      { destination: rest.destination, name: rest.name },
      { $set: rest },
      { upsert: true, new: true }
    );
    restaurantsInserted++;
  }
  console.log(`Successfully seeded/updated ${restaurantsInserted} restaurants.`);

  await mongoose.disconnect();
  console.log('MongoDB connection closed.');
  return { hotels: hotelsInserted, restaurants: restaurantsInserted };
}

// Run directly if called as a script
if (process.argv[1] && process.argv[1].endsWith('seedHotelsRestaurants.js')) {
  seedHotelsAndRestaurants()
    .then((res) => {
      console.log('Seed completed successfully:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err.message);
      process.exit(1);
    });
}

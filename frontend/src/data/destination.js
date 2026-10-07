const destinations = [
  // =========================
  // HYDERABAD
  // =========================
  {
    id: "hyd-charminar",
    name: "Charminar",
    city: "Hyderabad",
    description:
      "The iconic monument and historic landmark in the heart of Hyderabad.",
    category: "History",
    address: "Charminar, Hyderabad, Telangana",
    latitude: 17.3616,
    longitude: 78.4747,
    image:
      "https://images.unsplash.com/photo-1624638760852-8ede1666a8e1",
    openingHours: "9:30 AM - 5:30 PM",
    entryFee: 25,
    recommendedDuration: 1.5,
    bestTime: "Morning or evening",
    interests: ["History", "Photography", "Culture"],
  },
  {
    id: "hyd-golconda",
    name: "Golconda Fort",
    city: "Hyderabad",
    description:
      "A historic fort known for its architecture, massive walls and panoramic city views.",
    category: "History",
    address: "Khair Complex, Ibrahim Bagh, Hyderabad",
    latitude: 17.3833,
    longitude: 78.4011,
    image:
      "https://images.unsplash.com/photo-1590050752117-23a9d9f28f6b",
    openingHours: "9:00 AM - 5:30 PM",
    entryFee: 25,
    recommendedDuration: 2.5,
    bestTime: "Morning or late afternoon",
    interests: ["History", "Photography", "Culture"],
  },
  {
    id: "hyd-hussain-sagar",
    name: "Hussain Sagar Lake",
    city: "Hyderabad",
    description:
      "A large lake featuring the famous Buddha statue and scenic views.",
    category: "Nature",
    address: "Tank Bund Road, Hyderabad",
    latitude: 17.4239,
    longitude: 78.4738,
    image:
      "https://images.unsplash.com/photo-1600100397608-f010a7f5f1f7",
    openingHours: "Open throughout the day",
    entryFee: 0,
    recommendedDuration: 1.5,
    bestTime: "Evening",
    interests: ["Nature", "Photography"],
  },
  {
    id: "hyd-rmo",
    name: "Ramoji Film City",
    city: "Hyderabad",
    description:
      "A large film studio complex offering themed attractions, tours and entertainment.",
    category: "Entertainment",
    address: "Abdullapurmet, Hyderabad",
    latitude: 17.2543,
    longitude: 78.6808,
    image:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728",
    openingHours: "9:00 AM - 5:30 PM",
    entryFee: 1000,
    recommendedDuration: 5,
    bestTime: "Morning",
    interests: ["Entertainment", "Photography", "Family"],
  },

  // =========================
  // GOA
  // =========================
  {
    id: "goa-baga",
    name: "Baga Beach",
    city: "Goa",
    description:
      "A popular beach known for its coastline, water activities and nightlife.",
    category: "Beach",
    address: "Baga, North Goa",
    latitude: 15.5557,
    longitude: 73.7517,
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2",
    openingHours: "Open throughout the day",
    entryFee: 0,
    recommendedDuration: 3,
    bestTime: "Morning or evening",
    interests: ["Beaches", "Adventure", "Nightlife", "Photography"],
  },
  {
    id: "goa-fort-aguada",
    name: "Fort Aguada",
    city: "Goa",
    description:
      "A historic Portuguese fort overlooking the Arabian Sea.",
    category: "History",
    address: "Candolim, North Goa",
    latitude: 15.492,
    longitude: 73.7739,
    image:
      "https://images.unsplash.com/photo-1590999659195-e64a9a7f7a7e",
    openingHours: "7:00 AM - 6:00 PM",
    entryFee: 0,
    recommendedDuration: 1.5,
    bestTime: "Morning or sunset",
    interests: ["History", "Photography", "Culture"],
  },
  {
    id: "goa-dudhsagar",
    name: "Dudhsagar Falls",
    city: "Goa",
    description:
      "A spectacular waterfall located in the Western Ghats.",
    category: "Nature",
    address: "Mollem National Park, Goa",
    latitude: 15.3144,
    longitude: 74.3144,
    image:
      "https://images.unsplash.com/photo-1433086966358-54859d0ed716",
    openingHours: "Daytime visit",
    entryFee: 400,
    recommendedDuration: 5,
    bestTime: "Monsoon and post-monsoon",
    interests: ["Nature", "Adventure", "Photography"],
  },
  {
    id: "goa-basilica",
    name: "Basilica of Bom Jesus",
    city: "Goa",
    description:
      "A UNESCO World Heritage historic church in Old Goa.",
    category: "Culture",
    address: "Old Goa, Goa",
    latitude: 15.5009,
    longitude: 73.9117,
    image:
      "https://images.unsplash.com/photo-1548013146-72479768bada",
    openingHours: "8:00 AM - 6:30 PM",
    entryFee: 0,
    recommendedDuration: 1,
    bestTime: "Morning",
    interests: ["Culture", "History", "Spiritual"],
  },

  // =========================
  // JAIPUR
  // =========================
  {
    id: "jai-amer",
    name: "Amber Fort",
    city: "Jaipur",
    description:
      "A magnificent hilltop fort famous for its architecture and courtyards.",
    category: "History",
    address: "Devisinghpura, Amer, Jaipur",
    latitude: 26.9855,
    longitude: 75.8513,
    image:
      "https://images.unsplash.com/photo-1477587458883-47145ed94245",
    openingHours: "8:00 AM - 6:00 PM",
    entryFee: 100,
    recommendedDuration: 3,
    bestTime: "Morning",
    interests: ["History", "Photography", "Culture"],
  },
  {
    id: "jai-hawa",
    name: "Hawa Mahal",
    city: "Jaipur",
    description:
      "The famous Palace of Winds with its distinctive honeycomb windows.",
    category: "History",
    address: "Hawa Mahal Road, Jaipur",
    latitude: 26.9239,
    longitude: 75.8267,
    image:
      "https://images.unsplash.com/photo-1599661046289-e31897846e41",
    openingHours: "9:00 AM - 5:00 PM",
    entryFee: 50,
    recommendedDuration: 1.5,
    bestTime: "Morning",
    interests: ["History", "Photography", "Culture"],
  },
  {
    id: "jai-city-palace",
    name: "City Palace",
    city: "Jaipur",
    description:
      "A royal palace complex showcasing Jaipur's history and architecture.",
    category: "Culture",
    address: "Tulsi Marg, Gangori Bazaar, Jaipur",
    latitude: 26.9258,
    longitude: 75.8237,
    image:
      "https://images.unsplash.com/photo-1599661046827-dacff0f4f0f4",
    openingHours: "9:30 AM - 5:00 PM",
    entryFee: 300,
    recommendedDuration: 2,
    bestTime: "Morning",
    interests: ["Culture", "History", "Photography"],
  },

  // =========================
  // DELHI
  // =========================
  {
    id: "del-red-fort",
    name: "Red Fort",
    city: "Delhi",
    description:
      "A historic Mughal fort and one of India's most important landmarks.",
    category: "History",
    address: "Netaji Subhash Marg, Delhi",
    latitude: 28.6562,
    longitude: 77.241,
    image:
      "https://images.unsplash.com/photo-1587474260584-136574528ed5",
    openingHours: "9:30 AM - 4:30 PM",
    entryFee: 35,
    recommendedDuration: 2,
    bestTime: "Morning",
    interests: ["History", "Culture", "Photography"],
  },
  {
    id: "del-india-gate",
    name: "India Gate",
    city: "Delhi",
    description:
      "A major war memorial surrounded by gardens and open public spaces.",
    category: "Monument",
    address: "Kartavya Path, New Delhi",
    latitude: 28.6129,
    longitude: 77.2295,
    image:
      "https://images.unsplash.com/photo-1587474260584-136574528ed5",
    openingHours: "Open throughout the day",
    entryFee: 0,
    recommendedDuration: 1,
    bestTime: "Evening",
    interests: ["History", "Photography"],
  },
  {
    id: "del-qutub",
    name: "Qutub Minar",
    city: "Delhi",
    description:
      "A UNESCO World Heritage monument known for its towering minaret.",
    category: "History",
    address: "Mehrauli, New Delhi",
    latitude: 28.5245,
    longitude: 77.1855,
    image:
      "https://images.unsplash.com/photo-1598091383021-15ddea10925d",
    openingHours: "7:00 AM - 5:00 PM",
    entryFee: 35,
    recommendedDuration: 2,
    bestTime: "Morning",
    interests: ["History", "Photography", "Culture"],
  },

  // =========================
  // MUMBAI
  // =========================
  {
    id: "mum-gateway",
    name: "Gateway of India",
    city: "Mumbai",
    description:
      "A historic waterfront monument overlooking the Arabian Sea.",
    category: "Monument",
    address: "Apollo Bandar, Colaba, Mumbai",
    latitude: 18.922,
    longitude: 72.8347,
    image:
      "https://images.unsplash.com/photo-1570168007204-dfb528c6958f",
    openingHours: "Open throughout the day",
    entryFee: 0,
    recommendedDuration: 1.5,
    bestTime: "Morning or evening",
    interests: ["History", "Photography", "Culture"],
  },
  {
    id: "mum-marine-drive",
    name: "Marine Drive",
    city: "Mumbai",
    description:
      "A famous seaside promenade offering beautiful views of Mumbai's coastline.",
    category: "Nature",
    address: "Marine Drive, Mumbai",
    latitude: 18.943,
    longitude: 72.8238,
    image:
      "https://images.unsplash.com/photo-1595658658481-d53d3f999875",
    openingHours: "Open throughout the day",
    entryFee: 0,
    recommendedDuration: 2,
    bestTime: "Evening",
    interests: ["Nature", "Photography", "Nightlife"],
  },
  {
    id: "mum-elephanta",
    name: "Elephanta Caves",
    city: "Mumbai",
    description:
      "Ancient rock-cut caves featuring historic sculptures and temples.",
    category: "History",
    address: "Elephanta Island, Mumbai",
    latitude: 18.9633,
    longitude: 72.9315,
    image:
      "https://images.unsplash.com/photo-1609920658906-8223bd289001",
    openingHours: "9:30 AM - 5:30 PM",
    entryFee: 40,
    recommendedDuration: 3,
    bestTime: "Morning",
    interests: ["History", "Culture", "Photography", "Spiritual"],
  },
];

export default destinations;
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { POPULAR_CITIES } from '../data/mockData';
import { useTrip } from '../context/TripContext';
import './Home.css';

const FEATURES = [
  {
    icon: '✨',
    title: 'Personalized Travel Plans',
    description:
      'Customize your journey around your unique interests, pace, and travel style with intelligent curation.',
  },
  {
    icon: '🤖',
    title: 'AI Itinerary Generation',
    description:
      'Our intelligent planner sequences activities morning to night so you never waste time backtracking.',
  },
  {
    icon: '🗺️',
    title: 'Smart Route Optimizer',
    description:
      'Shortest travel paths between attractions, transit estimates, and integrated map waypoints.',
  },
  {
    icon: '💰',
    title: 'Precision Budgeting',
    description:
      'Dynamic cost breakdown across stay, food, transport, and entry tickets with clear over-budget warnings.',
  },
  {
    icon: '🏨',
    title: 'Curated Stays & Dining',
    description:
      'Handpicked hotels and iconic culinary spots strategically positioned near your chosen attractions.',
  },
  {
    icon: '📋',
    title: 'Offline Export & PDF',
    description:
      'Save your complete travel blueprint, view it anytime, and export printable day-by-day itineraries.',
  },
];

const STEPS = [
  {
    number: '01',
    badge: 'Step 1',
    title: 'Set Your Preferences',
    desc: 'Choose your destination, duration, budget, and travel companions.',
  },
  {
    number: '02',
    badge: 'Step 2',
    title: 'Select Must-Visit Spots',
    desc: 'Browse curated attractions, heritage sites, and hidden gems.',
  },
  {
    number: '03',
    badge: 'Step 3',
    title: 'Get Smart Itinerary',
    desc: 'Receive a balanced, time-optimized day-by-day schedule.',
  },
  {
    number: '04',
    badge: 'Step 4',
    title: 'Track Budget & Route',
    desc: 'Inspect interactive maps and full cost breakdowns before you go.',
  },
];

const TRUST_STATS = [
  {
    icon: '🤖',
    title: 'AI-Powered Planning',
    desc: 'Tailored itineraries generated in seconds',
  },
  {
    icon: '📍',
    title: 'Smart Routes',
    desc: 'Optimized stops to minimize travel transit',
  },
  {
    icon: '💰',
    title: 'Budget Friendly',
    desc: 'Transparent real-time cost tracking',
  },
];

function Home() {
  const navigate = useNavigate();
  const { setTripPreferences } = useTrip();

  // Quick planner teaser state
  const [quickCity, setQuickCity] = useState('Hyderabad');
  const [quickDays, setQuickDays] = useState('3');
  const [quickType, setQuickType] = useState('Couple');

  const handleQuickPlan = (e) => {
    e.preventDefault();
    setTripPreferences({
      destination: quickCity,
      numberOfDays: Number(quickDays),
      travelType: quickType,
    });
    navigate('/plan-trip');
  };

  const handleExploreCity = (city) => {
    setTripPreferences({
      destination: city.name,
      numberOfDays: 3,
      travelType: 'Couple',
    });
    navigate('/plan-trip');
  };

  return (
    <div className="home">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="hero-section" aria-label="Hero">
        <div className="hero-bg-media" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1800&q=80"
            alt="Scenic coastal tropical destination"
            className="hero-bg-img"
          />
          <div className="hero-overlay" />
        </div>

        <div className="container hero-container">
          <div className="hero-content animate-fade-in-up">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              <span>AI-Powered Travel Planning Assistant</span>
            </div>

            <h1 className="hero-title">
              Plan Smarter.<br />
              <span className="hero-title-highlight">Travel Better.</span>
            </h1>

            <p className="hero-subtitle">
              TripWise helps you create personalized, budget-conscious trips with
              AI-crafted itineraries, smart route optimization, and curated destinations.
            </p>

            <div className="hero-actions">
              <Button
                variant="primary"
                size="xl"
                onClick={() => navigate('/plan-trip')}
                id="hero-plan-btn"
              >
                ✈ Plan My Trip
              </Button>
              <Button
                variant="white"
                size="xl"
                onClick={() => {
                  const destSec = document.getElementById('destinations-section');
                  destSec?.scrollIntoView({ behavior: 'smooth' });
                }}
                id="hero-explore-btn"
              >
                Explore Destinations ↓
              </Button>
            </div>

            {/* Quick Planning Visual Widget */}
            <div className="hero-planner-card card">
              <div className="hero-planner-header">
                <span className="hero-planner-tag">⚡ Quick Trip Launcher</span>
                <span className="hero-planner-caption">Pick & Start Instantly</span>
              </div>
              <form className="hero-planner-form" onSubmit={handleQuickPlan}>
                <div className="hero-input-field">
                  <label htmlFor="quick-city">Destination</label>
                  <select
                    id="quick-city"
                    value={quickCity}
                    onChange={(e) => setQuickCity(e.target.value)}
                  >
                    <option value="Hyderabad">Hyderabad (City of Pearls)</option>
                    <option value="Goa">Goa (Beaches & Heritage)</option>
                    <option value="Jaipur">Jaipur (Royal Palaces)</option>
                    <option value="Delhi">Delhi (Historic Capital)</option>
                    <option value="Mumbai">Mumbai (City of Dreams)</option>
                  </select>
                </div>

                <div className="hero-input-field">
                  <label htmlFor="quick-days">Duration</label>
                  <select
                    id="quick-days"
                    value={quickDays}
                    onChange={(e) => setQuickDays(e.target.value)}
                  >
                    <option value="2">2 Days (Weekend Trip)</option>
                    <option value="3">3 Days (Recommended)</option>
                    <option value="5">5 Days (Complete Tour)</option>
                    <option value="7">7 Days (Full Holiday)</option>
                  </select>
                </div>

                <div className="hero-input-field">
                  <label htmlFor="quick-type">Travel Type</label>
                  <select
                    id="quick-type"
                    value={quickType}
                    onChange={(e) => setQuickType(e.target.value)}
                  >
                    <option value="Solo">Solo Traveler</option>
                    <option value="Couple">Couple</option>
                    <option value="Family">Family</option>
                    <option value="Friends">Friends Group</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="hero-planner-submit"
                  id="hero-quick-submit"
                >
                  Create Plan →
                </Button>
              </form>
            </div>

            {/* Trust / Stat Cards */}
            <div className="hero-trust-grid">
              {TRUST_STATS.map(({ icon, title, desc }) => (
                <div key={title} className="hero-trust-card">
                  <div className="hero-trust-icon" aria-hidden="true">{icon}</div>
                  <div>
                    <h2 className="hero-trust-title">{title}</h2>
                    <p className="hero-trust-desc">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Popular Destinations ─────────────────────────────── */}
      <section
        id="destinations-section"
        className="destinations-section section"
        aria-labelledby="popular-heading"
      >
        <div className="container">
          <div className="section-header text-center">
            <div className="badge badge-primary">Curated Destinations</div>
            <h2 id="popular-heading" className="section-title">
              Popular Getaways Ready to Explore
            </h2>
            <p className="section-subtitle">
              Choose from India’s most celebrated destinations featuring handpicked
              heritage sights, beaches, and cultural experiences.
            </p>
          </div>

          <div className="destinations-grid">
            {POPULAR_CITIES.map((city) => (
              <div key={city.id} className="city-card card card-hover">
                <div className="city-image-wrap">
                  <img
                    src={city.image}
                    alt={city.name}
                    className="city-image"
                    loading="lazy"
                  />
                  <div className="city-badge-rating">
                    ★ {city.rating}
                  </div>
                  <div className="city-overlay-gradient" />
                  <div className="city-image-caption">
                    <span className="city-state">{city.state}</span>
                    <h3 className="city-title">{city.name}</h3>
                  </div>
                </div>

                <div className="city-body">
                  <p className="city-tagline">{city.tagline}</p>
                  <div className="city-meta">
                    <div className="city-meta-item">
                      <span className="meta-label">Places</span>
                      <span className="meta-val">📍 {city.placesCount}+</span>
                    </div>
                    <div className="city-meta-item">
                      <span className="meta-label">Best Season</span>
                      <span className="meta-val">☀️ {city.bestSeason}</span>
                    </div>
                    <div className="city-meta-item">
                      <span className="meta-label">Avg Daily</span>
                      <span className="meta-val">₹{city.avgDailyBudget}</span>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    fullWidth
                    size="sm"
                    onClick={() => handleExploreCity(city)}
                    id={`explore-city-${city.id}`}
                  >
                    Plan Trip to {city.name} →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section className="how-section section" aria-labelledby="how-heading">
        <div className="container">
          <div className="section-header text-center">
            <div className="badge badge-primary">Simple & Powerful</div>
            <h2 id="how-heading" className="section-title">
              How TripWise Works in 4 Steps
            </h2>
            <p className="section-subtitle">
              From your initial idea to a complete route-optimized blueprint in minutes.
            </p>
          </div>

          <div className="steps-container">
            <div className="steps-track" />
            <div className="steps-grid">
              {STEPS.map(({ number, badge, title, desc }) => (
                <div key={number} className="step-card card">
                  <div className="step-card-header">
                    <span className="step-badge">{badge}</span>
                    <span className="step-num">{number}</span>
                  </div>
                  <h3 className="step-card-title">{title}</h3>
                  <p className="step-card-desc">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="features-section section" aria-labelledby="features-heading">
        <div className="container">
          <div className="section-header text-center">
            <div className="badge badge-primary">Comprehensive Features</div>
            <h2 id="features-heading" className="section-title">
              Engineered for Seamless Travel Experiences
            </h2>
            <p className="section-subtitle">
              Every tool you need to balance sightseeing, transit times, and trip budget.
            </p>
          </div>

          <div className="features-grid">
            {FEATURES.map(({ icon, title, description }) => (
              <div key={title} className="feature-card card card-hover">
                <div className="feature-icon-bubble" aria-hidden="true">
                  {icon}
                </div>
                <h3 className="feature-card-title">{title}</h3>
                <p className="feature-card-desc">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────── */}
      <section className="cta-section" aria-label="Call to action">
        <div className="container">
          <div className="cta-banner">
            <div className="cta-content">
              <span className="badge badge-accent">Start Traveling Smarter</span>
              <h2 className="cta-headline">Ready to Experience TripWise?</h2>
              <p className="cta-body">
                Build your personalized travel itinerary, inspect smart route maps,
                and stay within budget effortlessly.
              </p>
              <div className="cta-buttons">
                <Button
                  variant="white"
                  size="xl"
                  onClick={() => navigate('/plan-trip')}
                  id="cta-start-btn"
                >
                  🚀 Plan Your First Trip
                </Button>
                <Button
                  variant="outline"
                  size="xl"
                  onClick={() => navigate('/destinations')}
                  style={{ color: 'white', borderColor: 'rgba(255,255,255,0.35)' }}
                >
                  Browse Destinations →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;

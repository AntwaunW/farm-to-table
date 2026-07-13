// Home page — the public-facing landing page for the marketplace
// Fetches and displays featured farms and fresh listings on load
// Also provides a search bar that redirects to the Browse page with query params

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './Home.scss';
import FarmCard from '../components/common/FarmCard';
import ListingCard from '../components/common/ListingCard';
import TestimonialCarousel from '../components/common/TestimonialCarousel';
import PageMeta from '../components/common/PageMeta';
import { getPreloadedState } from '../utils/preloadedState';

const Home = () => {
  const { user } = useAuth();
  // Consumers are here to find farms, not list one — only show that CTA
  // to logged-out visitors and farmers
  const showFarmerCta = !user || user.role === 'farmer';
  // If this page was served prerendered, its farms/listings are already embedded —
  // seed state from that instead of starting from a loading spinner and refetching
  const [preloaded] = useState(() => getPreloadedState());
  const [farms, setFarms] = useState(preloaded?.farms ?? []);
  const [listings, setListings] = useState(preloaded?.listings ?? []);
  const [loading, setLoading] = useState(!preloaded);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const navigate = useNavigate();

  // Fetch farms and listings in parallel on mount to minimize load time
  useEffect(() => {
    if (preloaded) return;

    const fetchData = async () => {
      try {
        const [farmsRes, listingsRes] = await Promise.all([
          api.get('/farms'),
          api.get('/listings'),
        ]);
        setFarms(farmsRes.data.farms);
        setListings(listingsRes.data.listings);
      } catch (err) {
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [preloaded]);

  // Pass search inputs as query params to the Browse page where filtering happens
  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/browse?search=${searchTerm}&category=${searchCategory}`);
  };

  // Show a loading message while the API calls are in flight
  if (loading) {
    return (
      <div className="home__loading">
        <p>Loading farms...</p>
      </div>
    );
  }

  return (
    <div className="home">
      <PageMeta title="Cattle & Crop | Skip the store. Know your farmer." />

      {/* Hero Section — main value proposition and search bar */}
      <section className="hero">
        <div className="hero__container">
          <span className="hero__tag">🌿 Farm-fresh, direct to you</span>
          <span className="hero__region-note">📍 Now serving Texas — more regions coming soon</span>
          <h1 className="hero__title">
            Fresh from the ranch,<br />straight to your table
          </h1>
          <p className="hero__subtitle">
            Skip the store. Know your farmer. Buy directly from local
            farms and ranchers — grass-fed beef, fresh produce,
            raw dairy, and more.
          </p>
          <div className="hero__btns">
            <Link to="/browse" className="hero__btn hero__btn--white">Browse farms</Link>
            {showFarmerCta && (
              <Link to="/register" className="hero__btn hero__btn--outline">List your farm</Link>
            )}
          </div>
          {/* Search redirects to /browse with the terms pre-filled */}
          <form className="hero__search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search farms or products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="hero__search-input"
            />
            <select
              className="hero__search-select"
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
            >
              <option value="">All categories</option>
              <option value="beef">Beef</option>
              <option value="produce">Produce</option>
              <option value="dairy">Dairy</option>
              <option value="eggs">Eggs</option>
              <option value="honey">Honey</option>
              <option value="pork">Pork</option>
              <option value="lamb">Lamb</option>
              <option value="poultry">Poultry</option>
              <option value="other">Other</option>
            </select>
            <button type="submit" className="hero__search-btn">Search</button>
          </form>
        </div>
      </section>

      {/* Stats Section — social proof numbers */}
      <section className="stats">
        <div className="stats__item">
          <span className="stats__number">240+</span>
          <span className="stats__label">Farms and ranches</span>
        </div>
        <div className="stats__item">
          <span className="stats__number">97%</span>
          <span className="stats__label">Family-owned farms</span>
        </div>
        <div className="stats__item">
          <span className="stats__number">12</span>
          <span className="stats__label">Regions served</span>
        </div>
      </section>

      {/* Featured Farms Section — shows the 3 most recently added farms */}
      <section className="home__section">
        <div className="home__section-container">
          <div className="home__section-header">
            <h2 className="home__section-title">Featured farms</h2>
            <Link to="/browse" className="home__see-all">See all →</Link>
          </div>
          {/* Error only renders inside this section if the API call failed */}
          {error && <p className="home__error">{error}</p>}
          <div className="home__farms-grid">
            {/* Limit to 3 farms on the home page — full list is on Browse */}
            {farms.slice(0, 3).map((farm) => (
              <FarmCard key={farm._id} farm={farm} />
            ))}
          </div>
        </div>
      </section>

      {/* Fresh Listings Section — shows the 4 most recently added product listings */}
      <section className="home__section home__section--gray">
        <div className="home__section-container">
          <div className="home__section-header">
            <h2 className="home__section-title">Fresh listings</h2>
            <Link to="/browse" className="home__see-all">See all →</Link>
          </div>
          <div className="home__listings-grid">
            {/* Limit to 4 listings on the home page */}
            {listings.slice(0, 4).map((listing) => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </div>
        </div>
      </section>

      {/* Farmer CTA Section — encourages farmers to sign up and list their products */}
      {/* Hidden for logged-in consumers — they're here to buy, not sell */}
      {showFarmerCta && (
        <section className="home__cta">
          <div className="home__cta-container">
            <div className="home__cta-text">
              <h2 className="home__cta-title">Are you a farmer or rancher?</h2>
              <p className="home__cta-subtitle">
                List your products and reach thousands of local buyers directly.
              </p>
            </div>
            <Link to="/register" className="home__cta-btn">List your farm →</Link>
          </div>
        </section>
      )}

      <TestimonialCarousel initialTestimonials={preloaded?.testimonials} />

    </div>
  );
};

export default Home;

import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import FarmCard from '../components/common/FarmCard';
import './Browse.scss';

const CATEGORIES = ['beef', 'produce', 'dairy', 'eggs', 'honey', 'pork', 'lamb', 'poultry', 'other'];
const RADIUS_OPTIONS = [10, 25, 50, 100];

const Browse = () => {
  const { user } = useAuth();
  // Consumers are here to find farms, not list one — only show this to
  // guests and farmers, same gating as Home.jsx's farmer CTA
  const showFarmerCta = !user || user.role === 'farmer';
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || '';
  const selectedCategories = categoryParam ? categoryParam.split(',') : [];
  const sort = searchParams.get('sort') || 'newest';

  // "Near me" is separate from the URL-driven filters above — it's a
  // point-in-time location, not something worth deep-linking to
  const [nearMeActive, setNearMeActive] = useState(false);
  const [coords, setCoords] = useState(null);
  const [nearZip, setNearZip] = useState('');
  const [radius, setRadius] = useState(50);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [showZipFallback, setShowZipFallback] = useState(false);
  const [zipInput, setZipInput] = useState('');

  useEffect(() => {
    // Guards against out-of-order responses: if the filters change again before
    // this request resolves, its response is stale and should be discarded —
    // otherwise a slower earlier request can overwrite a faster later one
    let isStale = false;

    const fetchFarms = async () => {
      try {
        setLoading(true);
        let url;

        if (nearMeActive && (coords || nearZip)) {
          url = `/farms/near?radius=${radius}&`;
          url += coords ? `lat=${coords.lat}&lng=${coords.lng}&` : `zip=${nearZip}&`;
          if (categoryParam) url += `category=${categoryParam}`;
        } else {
          url = '/farms?';
          if (categoryParam) url += `category=${categoryParam}&`;
          if (search) url += `city=${search}&`;
          if (sort) url += `sort=${sort}`;
        }

        const res = await api.get(url);
        if (isStale) return;
        setFarms(res.data.farms);
      } catch (err) {
        if (isStale) return;
        setError(err.response?.data?.message || 'Failed to load farms. Please try again.');
      } finally {
        if (!isStale) setLoading(false);
      }
    };

    fetchFarms();

    return () => {
      isStale = true;
    };
  }, [search, categoryParam, sort, nearMeActive, coords, nearZip, radius]);

  // Toggles a single category in/out of the selected set — "All" clears the set entirely
  const handleCategoryToggle = (cat) => {
    let next;
    if (cat === '') {
      next = [];
    } else if (selectedCategories.includes(cat)) {
      next = selectedCategories.filter((c) => c !== cat);
    } else {
      next = [...selectedCategories, cat];
    }
    setSearchParams({ search, category: next.join(','), sort });
  };

  const handleSearchChange = (e) => {
    setSearchParams({ search: e.target.value, category: categoryParam, sort });
  };

  const handleSortChange = (e) => {
    setSearchParams({ search, category: categoryParam, sort: e.target.value });
  };

  const handleNearMeClick = () => {
    if (!navigator.geolocation) {
      setGeoError("Your browser doesn't support location — enter your ZIP instead.");
      setShowZipFallback(true);
      return;
    }

    setGeoLoading(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setNearZip('');
        setNearMeActive(true);
        setShowZipFallback(false);
        setGeoLoading(false);
      },
      () => {
        setGeoError("Couldn't get your location — enter your ZIP instead.");
        setShowZipFallback(true);
        setGeoLoading(false);
      }
    );
  };

  const handleZipSubmit = (e) => {
    e.preventDefault();
    if (!zipInput.trim()) return;
    setCoords(null);
    setNearZip(zipInput.trim());
    setNearMeActive(true);
    setShowZipFallback(false);
  };

  const handleClearNearMe = () => {
    setNearMeActive(false);
    setCoords(null);
    setNearZip('');
    setShowZipFallback(false);
    setGeoError('');
    setZipInput('');
    setRadius(50);
  };

  return (
    <div className="browse">
      <div className="browse__header">
        <div className="browse__header-container">
          <h1 className="browse__title">Browse farms</h1>
          <p className="browse__subtitle">
            Find local farms and ranchers near you
          </p>
        </div>
      </div>

      <div className="browse__container">
        <div className="browse__filters">
          <div className="browse__filters-row">
            <input
              type="text"
              placeholder="Search by city..."
              value={search}
              onChange={handleSearchChange}
              className="browse__search"
            />

            {!nearMeActive ? (
              <button
                type="button"
                className="browse__near-btn"
                onClick={handleNearMeClick}
                disabled={geoLoading}
              >
                {geoLoading ? 'Locating...' : '📍 Near me'}
              </button>
            ) : (
              <>
                <select
                  className="browse__radius"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  aria-label="Search radius"
                >
                  {RADIUS_OPTIONS.map((mi) => (
                    <option key={mi} value={mi}>Within {mi} mi</option>
                  ))}
                </select>
                <button type="button" className="browse__near-clear" onClick={handleClearNearMe}>
                  Clear
                </button>
              </>
            )}

            {/* Results from /farms/near already come back sorted by distance */}
            {!nearMeActive && (
              <select
                className="browse__sort"
                value={sort}
                onChange={handleSortChange}
                aria-label="Sort farms by"
              >
                <option value="newest">Newest</option>
                <option value="rating">Highest rated</option>
                <option value="name">Name (A-Z)</option>
              </select>
            )}
          </div>

          {showZipFallback && (
            <form className="browse__zip-form" onSubmit={handleZipSubmit}>
              <p className="browse__zip-note">{geoError}</p>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter your ZIP code"
                value={zipInput}
                onChange={(e) => setZipInput(e.target.value)}
                className="browse__zip-input"
              />
              <button type="submit" className="browse__zip-submit">Search</button>
            </form>
          )}

          {/* Category buttons toggle independently — select as many as you like */}
          <div className="browse__categories">
            <button
              className={`browse__cat-btn ${selectedCategories.length === 0 ? 'browse__cat-btn--active' : ''}`}
              onClick={() => handleCategoryToggle('')}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`browse__cat-btn ${selectedCategories.includes(cat) ? 'browse__cat-btn--active' : ''}`}
                onClick={() => handleCategoryToggle(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="browse__loading">Loading farms...</p>}
        {error && <p className="browse__error">{error}</p>}

        {!loading && !error && farms.length === 0 && (
          <div className="browse__empty-state">
            <p className="browse__empty">
              {nearMeActive
                ? `No farms found within ${radius} mi. Try a larger radius.`
                : 'No farms found. Try a different search or category.'}
            </p>
            {showFarmerCta && (
              <div className="browse__empty-cta">
                <p className="browse__empty-cta-text">Know a farmer who should be here?</p>
                <Link to="/register" className="browse__empty-cta-btn">List your farm →</Link>
              </div>
            )}
          </div>
        )}

        <div className="browse__grid">
          {farms.map((farm) => (
            <FarmCard key={farm._id} farm={farm} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Browse;

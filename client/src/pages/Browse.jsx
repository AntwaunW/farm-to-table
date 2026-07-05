import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import FarmCard from '../components/common/FarmCard';
import './Browse.scss';

const CATEGORIES = ['beef', 'produce', 'dairy', 'eggs', 'honey', 'pork', 'lamb', 'poultry', 'other'];

const Browse = () => {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || '';
  const selectedCategories = categoryParam ? categoryParam.split(',') : [];
  const sort = searchParams.get('sort') || 'newest';

  useEffect(() => {
    // Guards against out-of-order responses: if the filters change again before
    // this request resolves, its response is stale and should be discarded —
    // otherwise a slower earlier request can overwrite a faster later one
    let isStale = false;

    const fetchFarms = async () => {
      try {
        setLoading(true);
        let url = '/farms?';
        if (categoryParam) url += `category=${categoryParam}&`;
        if (search) url += `city=${search}&`;
        if (sort) url += `sort=${sort}`;

        const res = await api.get(url);
        if (isStale) return;
        setFarms(res.data.farms);
      } catch (err) {
        if (isStale) return;
        setError('Failed to load farms. Please try again.');
      } finally {
        if (!isStale) setLoading(false);
      }
    };

    fetchFarms();

    return () => {
      isStale = true;
    };
  }, [search, categoryParam, sort]);

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

  return (
    <div className="browse">
      <div className="browse__header">
        <div className="browse__header-container">
          <h1 className="browse__title">Browse farms</h1>
          <p className="browse__subtitle">
            Find local Texas farms and ranchers near you
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
          </div>

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
          <p className="browse__empty">No farms found. Try a different search or category.</p>
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

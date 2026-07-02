import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import FarmCard from '../components/common/FarmCard';
import './Browse.scss';

const Browse = () => {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        setLoading(true);
        let url = '/farms?';
        if (category) url += `category=${category}&`;
        if (search) url += `city=${search}`;

        const res = await api.get(url);
        setFarms(res.data.farms);
      } catch (err) {
        setError('Failed to load farms. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFarms();
  }, [search, category]);

  const handleCategoryChange = (newCategory) => {
    setSearchParams({ search, category: newCategory });
  };

  const handleSearchChange = (e) => {
    setSearchParams({ search: e.target.value, category });
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
          <input
            type="text"
            placeholder="Search by city..."
            value={search}
            onChange={handleSearchChange}
            className="browse__search"
          />
          <div className="browse__categories">
            {['', 'beef', 'produce', 'dairy', 'eggs', 'honey', 'pork', 'lamb', 'poultry', 'other'].map((cat) => (
              <button
                key={cat}
                className={`browse__cat-btn ${category === cat ? 'browse__cat-btn--active' : ''}`}
                onClick={() => handleCategoryChange(cat)}
              >
                {cat === '' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
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
// React core imports
import { useState, useEffect } from 'react';

// React Router hooks for URL params and navigation
import { useParams, Link } from 'react-router-dom';

// Our axios instance for API calls
import api from '../../utils/api';

// Reusable listing card component
import ListingCard from '../../components/common/ListingCard';

// Page styles
import './FarmProfile.scss';

const FarmProfile = () => {
  // Get the farm ID from the URL (e.g. /farms/6a1479b2...)
  const { id } = useParams();

  // State for the farm data
  const [farm, setFarm] = useState(null);

  // State for the farm's listings
  const [listings, setListings] = useState([]);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch farm and listings when the component mounts
  // or when the ID in the URL changes
  useEffect(() => {
    const fetchFarmData = async () => {
      try {
        // Fetch both farm details and listings at the same time
        const [farmRes, listingsRes] = await Promise.all([
          api.get(`/farms/${id}`),
          api.get(`/listings/farm/${id}`),
        ]);

        setFarm(farmRes.data.farm);
        setListings(listingsRes.data.listings);
      } catch (err) {
        setError('Failed to load farm. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFarmData();
  }, [id]);

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <div className="farm-profile__loading">
        <p>Loading farm...</p>
      </div>
    );
  }

  // Show error state if something went wrong
  if (error) {
    return (
      <div className="farm-profile__error">
        <p>{error}</p>
        <Link to="/browse">Back to browse</Link>
      </div>
    );
  }

  // Show 404 state if farm doesn't exist
  if (!farm) {
    return (
      <div className="farm-profile__error">
        <p>Farm not found.</p>
        <Link to="/browse">Back to browse</Link>
      </div>
    );
  }

  return (
    <div className="farm-profile">

      {/* Farm Header */}
      <div className="farm-profile__header">
        <div className="farm-profile__header-container">

          {/* Farm photo or placeholder */}
          <div className="farm-profile__image">
            {farm.photos.length > 0 ? (
              <img src={farm.photos[0]} alt={farm.farmName} />
            ) : (
              <div className="farm-profile__placeholder">🌾</div>
            )}
          </div>

          {/* Farm info */}
          <div className="farm-profile__info">
            <h1 className="farm-profile__name">{farm.farmName}</h1>
            <p className="farm-profile__location">
              📍 {farm.location.city}, {farm.location.state} {farm.location.zip}
            </p>

            {/* Category tags */}
            <div className="farm-profile__tags">
              {farm.category.map((cat) => (
                <span key={cat} className="farm-profile__tag">
                  {cat}
                </span>
              ))}
            </div>

            {/* Rating if available */}
            {farm.rating && (
              <p className="farm-profile__rating">★ {farm.rating}</p>
            )}

            {/* Farm description */}
            <p className="farm-profile__description">{farm.description}</p>
          </div>

        </div>
      </div>

      {/* Listings Section */}
      <div className="farm-profile__listings">
        <div className="farm-profile__listings-container">
          <h2 className="farm-profile__listings-title">
            Available products
          </h2>

          {/* Show message if no listings */}
          {listings.length === 0 ? (
            <p className="farm-profile__empty">
              This farm has no active listings right now.
            </p>
          ) : (
            <div className="farm-profile__listings-grid">
              {listings.map((listing) => (
                <ListingCard key={listing._id} listing={listing} farm={farm} />
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default FarmProfile;
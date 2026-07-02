// React core imports
import { useState, useEffect, useCallback } from 'react';

// React Router hooks for URL params and navigation
import { useParams, Link } from 'react-router-dom';

// Our axios instance for API calls
import api from '../../utils/api';

// Reusable components
import ListingCard from '../../components/common/ListingCard';
import ReviewCard from '../../components/common/ReviewCard';

// Page styles
import './FarmProfile.scss';

const FarmProfile = () => {
  // Get the farm ID from the URL (e.g. /farms/6a1479b2...)
  const { id } = useParams();

  // State for the farm data
  const [farm, setFarm] = useState(null);

  // State for the farm's listings
  const [listings, setListings] = useState([]);

  // State for the farm's reviews
  const [reviews, setReviews] = useState([]);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Lightbox state — null means the lightbox is closed
  // When open, this holds the index of the photo currently displayed
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Open the lightbox at a specific photo index
  const openLightbox = (index) => setLightboxIndex(index);

  // Close the lightbox
  const closeLightbox = () => setLightboxIndex(null);

  // Navigate to the previous photo, wrapping from first → last
  const prevPhoto = useCallback(() => {
    if (!farm) return;
    setLightboxIndex((i) => (i - 1 + farm.photos.length) % farm.photos.length);
  }, [farm]);

  // Navigate to the next photo, wrapping from last → first
  const nextPhoto = useCallback(() => {
    if (!farm) return;
    setLightboxIndex((i) => (i + 1) % farm.photos.length);
  }, [farm]);

  // Keyboard controls for the lightbox (Escape closes, arrows navigate)
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKey = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'ArrowRight') nextPhoto();
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, prevPhoto, nextPhoto]);

  // Fetch farm, listings and reviews when component mounts
  useEffect(() => {
    const fetchFarmData = async () => {
      try {
        // Fetch farm details, listings and reviews all at the same time
        const [farmRes, listingsRes, reviewsRes] = await Promise.all([
          api.get(`/farms/${id}`),
          api.get(`/listings/farm/${id}`),
          api.get(`/reviews/farm/${id}`),
        ]);

        setFarm(farmRes.data.farm);
        setListings(listingsRes.data.listings);
        setReviews(reviewsRes.data.reviews);
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

      {/* Photo Gallery Section — only rendered when the farm has uploaded photos */}
      {farm.photos.length > 0 && (
        <div className="farm-profile__gallery">
          <div className="farm-profile__gallery-container">
            <h2 className="farm-profile__gallery-title">Photo gallery</h2>

            {/* Square-thumbnail grid — clicking any photo opens the lightbox */}
            <div className="farm-profile__gallery-grid">
              {farm.photos.map((url, index) => (
                <button
                  key={url}
                  className="farm-profile__gallery-cell"
                  onClick={() => openLightbox(index)}
                  type="button"
                  aria-label={`View photo ${index + 1} of ${farm.photos.length}`}
                >
                  <img
                    src={url}
                    alt={`${farm.farmName} — photo ${index + 1}`}
                    className="farm-profile__gallery-img"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/*
        Lightbox overlay — shown when the farmer has clicked a photo.
        Clicking the dark backdrop closes it; arrow buttons step through photos.
      */}
      {lightboxIndex !== null && farm.photos.length > 0 && (
        <div
          className="farm-profile__lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          onClick={closeLightbox}  // clicking the backdrop closes the lightbox
        >
          {/* Stop click propagation on the inner box so only the backdrop closes */}
          <div
            className="farm-profile__lightbox-inner"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              className="farm-profile__lightbox-close"
              onClick={closeLightbox}
              type="button"
              aria-label="Close photo viewer"
            >
              ✕
            </button>

            {/* Previous photo button — only shown when there is more than one photo */}
            {farm.photos.length > 1 && (
              <button
                className="farm-profile__lightbox-nav farm-profile__lightbox-nav--prev"
                onClick={prevPhoto}
                type="button"
                aria-label="Previous photo"
              >
                ‹
              </button>
            )}

            {/* The full-size photo */}
            <img
              src={farm.photos[lightboxIndex]}
              alt={`${farm.farmName} — photo ${lightboxIndex + 1}`}
              className="farm-profile__lightbox-img"
            />

            {/* Next photo button */}
            {farm.photos.length > 1 && (
              <button
                className="farm-profile__lightbox-nav farm-profile__lightbox-nav--next"
                onClick={nextPhoto}
                type="button"
                aria-label="Next photo"
              >
                ›
              </button>
            )}

            {/* Counter — e.g. "3 / 8" */}
            <p className="farm-profile__lightbox-counter">
              {lightboxIndex + 1} / {farm.photos.length}
            </p>
          </div>
        </div>
      )}

      {/* Listings Section */}
      <div className="farm-profile__listings">
        <div className="farm-profile__listings-container">
          <h2 className="farm-profile__listings-title">
            Available products
          </h2>

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

      {/* Reviews Section */}
      <div className="farm-profile__reviews">
        <div className="farm-profile__listings-container">
          <h2 className="farm-profile__listings-title">
            Customer reviews
            {farm.rating && (
              <span className="farm-profile__rating-badge">
                ★ {farm.rating}
              </span>
            )}
          </h2>

          {reviews.length === 0 ? (
            <p className="farm-profile__empty">
              No reviews yet — be the first to review this farm!
            </p>
          ) : (
            <div className="farm-profile__reviews-grid">
              {reviews.map((review) => (
                <ReviewCard key={review._id} review={review} />
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default FarmProfile;
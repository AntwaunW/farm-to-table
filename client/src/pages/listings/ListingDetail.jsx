// ListingDetail — full page view for a single product listing
// Fetched by ID from the URL; shows all listing info plus the farm it belongs to
// Consumers can add to cart directly from this page

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import ConfirmAddToCartModal from '../../components/common/ConfirmAddToCartModal';
import './ListingDetail.scss';

// Maps a category string to an emoji icon — same map used in ListingCard
const getCategoryIcon = (category) => {
  const icons = {
    beef: '🥩',
    eggs: '🥚',
    honey: '🍯',
    dairy: '🥛',
    produce: '🥬',
    pork: '🥓',
    lamb: '🍖',
    poultry: '🍗',
    other: '🌾',
  };
  return icons[category] || '🌾';
};

const ListingDetail = () => {
  // Pull the listing ID out of the URL (e.g. /listings/6a14...)
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, cartFarmId } = useCart();

  // State for the listing and the farm it belongs to
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // How many units the consumer wants to add at once
  const [quantity, setQuantity] = useState(1);

  // Controls the confirm-quantity modal shown before anything is actually added
  const [showConfirm, setShowConfirm] = useState(false);

  // Fetch the listing when the component mounts or the ID changes
  useEffect(() => {
    const fetchListing = async () => {
      try {
        // GET /api/listings/:id — populates farm name, location, and photos
        const res = await api.get(`/listings/${id}`);
        setListing(res.data.listing);
      } catch (err) {
        setError('Failed to load listing. It may have been removed.');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  // Clicking "Add to cart" opens a confirm-quantity modal rather than adding right away,
  // so a mis-typed quantity can be caught before it's actually in the cart
  const handleAddToCart = () => {
    if (cartFarmId && cartFarmId !== listing.farm?._id) {
      alert('You can only order from one farm at a time. Please checkout or clear your cart first.');
      return;
    }
    setShowConfirm(true);
  };

  // Called from the modal's "Add to cart" button — this is what actually mutates the cart
  const handleConfirmAdd = () => {
    addToCart(listing, listing.farm, quantity);
    setShowConfirm(false);
    // Navigate to cart after adding so the user can see it was added
    navigate('/cart');
  };

  if (loading) {
    return <div className="listing-detail__loading">Loading listing...</div>;
  }

  if (error || !listing) {
    return (
      <div className="listing-detail__error">
        <p>{error || 'Listing not found.'}</p>
        <Link to="/browse">Back to browse</Link>
      </div>
    );
  }

  const farm = listing.farm;

  return (
    <div className="listing-detail">

      {/* Breadcrumb — helps the user know where they are and how to go back */}
      <div className="listing-detail__breadcrumb">
        <div className="listing-detail__breadcrumb-inner">
          <Link to="/browse">Browse</Link>
          {farm && (
            <>
              <span className="listing-detail__breadcrumb-sep">›</span>
              <Link to={`/farms/${farm._id}`}>{farm.farmName}</Link>
            </>
          )}
          <span className="listing-detail__breadcrumb-sep">›</span>
          <span>{listing.title}</span>
        </div>
      </div>

      <div className="listing-detail__container">

        {/* Left column — icon / category visual */}
        <div className="listing-detail__visual">
          <div className="listing-detail__icon">
            {getCategoryIcon(listing.category)}
          </div>
          <span className="listing-detail__category">
            {listing.category.charAt(0).toUpperCase() + listing.category.slice(1)}
          </span>
        </div>

        {/* Right column — all listing details */}
        <div className="listing-detail__info">
          <h1 className="listing-detail__title">
            {listing.title}
            {farm?.isSeed && <span className="listing-detail__demo-badge">Demo</span>}
          </h1>

          {/* Farm name links back to the farm profile page */}
          {farm && (
            <Link to={`/farms/${farm._id}`} className="listing-detail__farm-link">
              🌿 {farm.farmName}
              {farm.location && (
                <span className="listing-detail__farm-location">
                  {' '}· {farm.location.city}, {farm.location.state}
                </span>
              )}
            </Link>
          )}

          {/* Price and unit */}
          <div className="listing-detail__price-row">
            <span className="listing-detail__price">
              ${listing.pricePerUnit}
            </span>
            <span className="listing-detail__unit">
              per {listing.unit}
            </span>
          </div>

          {/* Stock count */}
          <p className="listing-detail__qty">
            <strong>{listing.quantityAvailable}</strong> {listing.unit}(s) available
          </p>

          {/* Harvest date — only shown when the farmer provided one */}
          {listing.harvestDate && (
            <p className="listing-detail__harvest">
              🗓 Harvested:{' '}
              {new Date(listing.harvestDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}

          {/* Full description */}
          {listing.description && (
            <p className="listing-detail__description">{listing.description}</p>
          )}

          {/* Demo listings are for illustration only — never allow a real purchase */}
          {farm?.isSeed ? (
            <p className="listing-detail__demo-notice">
              This is a demo listing for illustration purposes and isn't available for purchase.
            </p>
          ) : (
            <>
              {/* Add to cart — only shown to logged-in consumers, and only when in stock */}
              {user && user.role === 'consumer' && listing.isAvailable && listing.quantityAvailable > 0 && (
                <div className="listing-detail__add-row">
                  <label className="listing-detail__qty-label">
                    Qty
                    <input
                      type="number"
                      className="listing-detail__qty-input"
                      min={1}
                      max={listing.quantityAvailable}
                      value={quantity}
                      onChange={(e) => {
                        // Clamp between 1 and however many units the farmer has in stock
                        const value = Math.max(1, Math.min(listing.quantityAvailable, Number(e.target.value) || 1));
                        setQuantity(value);
                      }}
                    />
                  </label>
                  <button
                    className="listing-detail__add-btn"
                    onClick={handleAddToCart}
                  >
                    + Add to cart
                  </button>
                </div>
              )}

              {/* Prompt non-logged-in visitors to register */}
              {!user && (
                <p className="listing-detail__login-prompt">
                  <Link to="/register">Create an account</Link> or{' '}
                  <Link to="/login">log in</Link> to order from this farm.
                </p>
              )}

              {/* Unavailable notice — either the farmer disabled it or stock has run out */}
              {(!listing.isAvailable || listing.quantityAvailable === 0) && (
                <p className="listing-detail__unavailable">
                  This listing is currently unavailable.
                </p>
              )}
            </>
          )}
        </div>

      </div>

      {showConfirm && (
        <ConfirmAddToCartModal
          title={listing.title}
          quantity={quantity}
          unit={listing.unit}
          onBack={() => setShowConfirm(false)}
          onConfirm={handleConfirmAdd}
        />
      )}
    </div>
  );
};

export default ListingDetail;

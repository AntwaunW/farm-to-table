// ListingCard — displays a summary of a single product listing
// Shows a category icon, product name, farm name, and price
// Used on the Home page (fresh listings) and the Browse page

import { useState } from 'react';
import { Link } from 'react-router-dom';
import './ListingCard.scss';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import ConfirmAddToCartModal from './ConfirmAddToCartModal';

const ListingCard = ({ listing, farm }) => {
  const { user } = useAuth();
  const { addToCart, cartFarmId } = useCart();

  // Falls back to the farm populated on the listing itself (e.g. Home page's
  // "Fresh listings" grid, which doesn't pass a separate farm prop)
  const effectiveFarm = farm || listing.farm;

  // How many units the consumer wants to add at once
  const [quantity, setQuantity] = useState(1);

  // Controls the confirm-quantity modal shown before anything is actually added
  const [showConfirm, setShowConfirm] = useState(false);

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
  // -------------------------------------------------------------------
  // 🎓 WHY DO WE CHECK cartFarmId?
  // Orders can only be from ONE farm at a time.
  // If a consumer already has items from Lone Star Ranch in their cart
  // they can't add items from Blue Bonnet Dairy until they checkout.
  // This prevents mixed-farm orders which our backend doesn't support.
  // -------------------------------------------------------------------
  // Clicking "Add to cart" opens a confirm-quantity modal rather than adding right away,
  // so a mis-typed quantity can be caught before it's actually in the cart
  const handleAddToCart = () => {
    if (cartFarmId && cartFarmId !== effectiveFarm?._id) {
      alert('You can only order from one farm at a time. Please checkout or clear your cart first.');
      return;
    }
    setShowConfirm(true);
  };

  // Called from the modal's "Add to cart" button — this is what actually mutates the cart
  const handleConfirmAdd = () => {
    addToCart(listing, effectiveFarm, quantity);
    setShowConfirm(false);
  };

  return (
    <div className="listing-card">
      {/*
        The inner link wraps the visual content so clicking the card navigates
        to the listing detail page. The Add to cart button lives outside this
        link so it doesn't count as a nested interactive element.
      */}
      <Link to={`/listings/${listing._id}`} className="listing-card__link">
        <div className="listing-card__icon">
          {getCategoryIcon(listing.category)}
        </div>
        <div className="listing-card__info">
          <h4 className="listing-card__title">
            {listing.title}
            {effectiveFarm?.isSeed && <span className="listing-card__sample-badge">Sample listing</span>}
          </h4>
          <p className="listing-card__farm">{listing.farm?.farmName}</p>
          <p className="listing-card__price">
            {`$${listing.pricePerUnit}`}
            <span className="listing-card__unit"> / {listing.unit}</span>
          </p>
          {/* Lets shoppers see how many units the farmer has left before choosing a quantity */}
          <p className="listing-card__stock">
            {listing.quantityAvailable > 0
              ? `${listing.quantityAvailable} ${listing.unit}(s) available`
              : 'Sold out'}
          </p>
        </div>
      </Link>

      {/* Sample listings are for illustration only — never allow a real purchase */}
      {effectiveFarm?.isSeed ? (
        <p className="listing-card__sample-notice">Sample listing — not available for purchase</p>
      ) : (
        /* Only show the quantity selector + Add to cart for logged-in consumers, and only when in stock */
        user && user.role === 'consumer' && effectiveFarm && listing.isAvailable && listing.quantityAvailable > 0 && (
          <div className="listing-card__add-row">
            <input
              type="number"
              className="listing-card__qty-input"
              min={1}
              max={listing.quantityAvailable}
              value={quantity}
              onChange={(e) => {
                // Clamp between 1 and however many units the farmer has in stock
                const value = Math.max(1, Math.min(listing.quantityAvailable, Number(e.target.value) || 1));
                setQuantity(value);
              }}
              aria-label={`Quantity of ${listing.title}`}
            />
            <button
              className="listing-card__add-btn"
              onClick={handleAddToCart}
            >
              + Add to cart
            </button>
          </div>
        )
      )}

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

export default ListingCard;

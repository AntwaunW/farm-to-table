// ListingCard — displays a summary of a single product listing
// Shows a category icon, product name, farm name, and price
// Used on the Home page (fresh listings) and the Browse page

import './ListingCard.scss';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const ListingCard = ({ listing, farm }) => {
  const { user } = useAuth();
  const { addToCart, cartFarmId } = useCart();

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
  const handleAddToCart = () => {
    if (cartFarmId && cartFarmId !== farm?._id) {
      alert('You can only order from one farm at a time. Please checkout or clear your cart first.');
      return;
    }
    addToCart(listing, farm);
  };

  return (
    <div className="listing-card">
      <div className="listing-card__icon">
        {getCategoryIcon(listing.category)}
      </div>
      <div className="listing-card__info">
        <h4 className="listing-card__title">{listing.title}</h4>
        <p className="listing-card__farm">{listing.farm?.farmName}</p>
        <p className="listing-card__price">
          ${listing.pricePerUnit}
          <span className="listing-card__unit"> / {listing.unit}</span>
        </p>
        {/* Only show Add to cart for logged in consumers */}
        {user && user.role === 'consumer' && farm && (
          <button
            className="listing-card__add-btn"
            onClick={handleAddToCart}
          >
            + Add to cart
          </button>
        )}
      </div>
    </div>
  );
};

export default ListingCard;

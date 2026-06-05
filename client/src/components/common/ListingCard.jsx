// ListingCard — displays a summary of a single product listing
// Shows a category icon, product name, farm name, and price
// Used on the Home page (fresh listings) and the Browse page

import './ListingCard.scss';

const ListingCard = ({ listing }) => {

  // Maps a listing category to a matching emoji icon for quick visual identification
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
    // Fall back to the grain emoji if the category doesn't match any known key
    return icons[category] || '🌾';
  };

  return (
    <div className="listing-card">

      {/* Category icon — provides a quick visual cue for the product type */}
      <div className="listing-card__icon">
        {getCategoryIcon(listing.category)}
      </div>

      <div className="listing-card__info">
        <h4 className="listing-card__title">{listing.title}</h4>

        {/* Optional chaining handles listings where farm data wasn't populated */}
        <p className="listing-card__farm">{listing.farm?.farmName}</p>

        <p className="listing-card__price">
          ${listing.pricePerUnit}
          <span className="listing-card__unit"> / {listing.unit}</span>
        </p>
      </div>

    </div>
  );
};

export default ListingCard;

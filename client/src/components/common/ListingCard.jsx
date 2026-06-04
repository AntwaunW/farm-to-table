import './ListingCard.scss';

const ListingCard = ({ listing }) => {
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
      </div>
    </div>
  );
};

export default ListingCard;

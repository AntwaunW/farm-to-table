// FarmCard — displays a summary of a single farm in a grid or list
// Clicking the card navigates to the full farm profile page
// Used on the Home page (featured farms) and the Browse page

import { Link } from 'react-router-dom';
import './FarmCard.scss';

const FarmCard = ({ farm }) => {
  return (
    // The entire card is a link to the farm's detail page
    <Link to={`/farms/${farm._id}`} className="farm-card">

      {/* Farm photo or a placeholder if no photos have been uploaded yet */}
      <div className="farm-card__image">
        {farm.photos.length > 0 ? (
          <img src={farm.photos[0]} alt={farm.farmName} />
        ) : (
          <div className="farm-card__placeholder">🌾</div>
        )}
      </div>

      <div className="farm-card__info">
        <h3 className="farm-card__name">
          {farm.farmName}
          {farm.isSeed && <span className="farm-card__sample-badge">Sample</span>}
        </h3>

        <p className="farm-card__location">
          📍 {farm.location.city}, {farm.location.state}
          {farm.distance !== undefined && (
            <span className="farm-card__distance"> · {farm.distance} mi away</span>
          )}
        </p>

        {/* Category tags — each farm can belong to multiple categories */}
        <div className="farm-card__tags">
          {farm.category.map((cat) => (
            <span key={cat} className="farm-card__tag">{cat}</span>
          ))}
        </div>

        {/* Rating is null until the farm has received at least one review */}
        {farm.rating && (
          <p className="farm-card__rating">★ {farm.rating}</p>
        )}
      </div>

    </Link>
  );
};

export default FarmCard;

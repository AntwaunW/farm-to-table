import { Link } from 'react-router-dom';
import './FarmCard.scss';

const FarmCard = ({ farm }) => {
  return (
    <Link to={`/farms/${farm._id}`} className="farm-card">
      <div className="farm-card__image">
        {farm.photos.length > 0 ? (
          <img src={farm.photos[0]} alt={farm.farmName} />
        ) : (
          <div className="farm-card__placeholder">🌾</div>
        )}
      </div>
      <div className="farm-card__info">
        <h3 className="farm-card__name">{farm.farmName}</h3>
        <p className="farm-card__location">
          📍 {farm.location.city}, {farm.location.state}
        </p>
        <div className="farm-card__tags">
          {farm.category.map((cat) => (
            <span key={cat} className="farm-card__tag">{cat}</span>
          ))}
        </div>
        {farm.rating && (
          <p className="farm-card__rating">★ {farm.rating}</p>
        )}
      </div>
    </Link>
  );
};

export default FarmCard;
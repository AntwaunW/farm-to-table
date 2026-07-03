// ReviewCard — displays a single review
// Shows the star rating, comment, reviewer name, and date

import './ReviewCard.scss';

const ReviewCard = ({ review, showFarmName = false }) => {
  // -------------------------------------------------------------------
  // 🎓 RENDERING STARS
  // We convert the numeric rating into visual stars.
  // Array.from({ length: 5 }) creates an array of 5 items.
  // We map over it and render a filled or empty star for each position.
  // -------------------------------------------------------------------
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`review-card__star ${i < rating ? 'review-card__star--filled' : ''}`}
      >
        ★
      </span>
    ));
  };

  return (
    <div className="review-card">
      <div className="review-card__header">
        <div className="review-card__stars">
          {renderStars(review.rating)}
        </div>
        <span className="review-card__date">
          {new Date(review.createdAt).toLocaleDateString()}
        </span>
      </div>
      <p className="review-card__comment">{review.comment}</p>
      {showFarmName ? (
        <p className="review-card__author">For: {review.farm?.farmName}</p>
      ) : (
        <p className="review-card__author">— {review.consumer?.name}</p>
      )}
    </div>
  );
};

export default ReviewCard;
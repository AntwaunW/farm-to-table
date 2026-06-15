// ReviewForm — allows consumers to leave a review for a completed order
// Only renders if the consumer is eligible to review (order is completed
// and they haven't already left a review)

import { useState } from 'react';
import api from '../../utils/api';
import './ReviewForm.scss';

const ReviewForm = ({ orderId, farmId, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/reviews', { orderId, rating, comment });
      // Tell the parent component a review was submitted
      // so it can refresh the reviews list
      onReviewSubmitted();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-form">
      <h3 className="review-form__title">Leave a review</h3>

      {error && <p className="review-form__error">{error}</p>}

      <form onSubmit={handleSubmit}>
        {/* -------------------------------------------------------------------
        🎓 INTERACTIVE STAR RATING
        We use onMouseEnter and onMouseLeave to create a hover effect.
        When you hover over a star all stars up to that point light up.
        When you click a star it sets the actual rating.
        hoveredRating controls the visual preview while hovering.
        rating controls the actual selected value.
        ------------------------------------------------------------------- */}
        <div className="review-form__stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`review-form__star ${
                star <= (hoveredRating || rating)
                  ? 'review-form__star--active'
                  : ''
              }`}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
            >
              ★
            </span>
          ))}
        </div>

        <textarea
          className="review-form__textarea"
          placeholder="Share your experience with this farm..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
          rows={3}
        />

        <button
          className="review-form__submit"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit review'}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
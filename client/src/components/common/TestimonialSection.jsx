// TestimonialSection — lets a farmer leave (or edit) their testimonial for
// the home page carousel, from their own dashboard. POST /testimonials is
// an upsert on the server, so this same form handles both the first
// submission and later edits.

import { useState, useEffect } from 'react';
import api from '../../utils/api';
import './TestimonialSection.scss';

const MAX_LENGTH = 400;

const TestimonialSection = () => {
  const [quote, setQuote] = useState('');
  const [hasExisting, setHasExisting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchOwn = async () => {
      try {
        const res = await api.get('/testimonials/me');
        if (res.data.testimonial) {
          setQuote(res.data.testimonial.quote);
          setHasExisting(true);
        }
      } catch {
        // Non-fatal — just start from an empty form
      } finally {
        setLoading(false);
      }
    };
    fetchOwn();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);

    if (!quote.trim()) {
      setError('Please add a quote.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/testimonials', { quote });
      setHasExisting(true);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save testimonial.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="testimonial-section">
      <h2 className="testimonial-section__title">
        {hasExisting ? 'Edit your testimonial' : 'Leave a testimonial'}
      </h2>
      <p className="testimonial-section__subtitle">
        Share your experience with Cattle &amp; Crop — it may be featured on the home page.
      </p>

      <form className="testimonial-section__form" onSubmit={handleSubmit}>
        <textarea
          className="testimonial-section__textarea"
          placeholder="What's it been like selling on Cattle & Crop?"
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          maxLength={MAX_LENGTH}
          rows={3}
        />
        <p className="testimonial-section__count">{quote.length}/{MAX_LENGTH}</p>

        {error && <p className="testimonial-section__error">{error}</p>}
        {saved && <p className="testimonial-section__success">Saved — thank you!</p>}

        <button
          className="testimonial-section__submit"
          type="submit"
          disabled={saving}
        >
          {saving ? 'Saving...' : hasExisting ? 'Update testimonial' : 'Submit testimonial'}
        </button>
      </form>
    </div>
  );
};

export default TestimonialSection;

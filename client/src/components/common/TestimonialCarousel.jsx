// TestimonialCarousel — rotating "what farmers are saying" section at the
// bottom of the home page. Shows 3 at a time; if there are more than 3, a
// modulo-indexed window slowly advances through the full list so it wraps
// cleanly past the end. Renders nothing if there are no testimonials yet.

import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import './TestimonialCarousel.scss';

const ROTATE_INTERVAL_MS = 5000;

const TestimonialCarousel = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [startIndex, setStartIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await api.get('/testimonials');
        setTestimonials(res.data.testimonials);
      } catch {
        // Non-fatal — the section just won't render if this fails
      }
    };
    fetchTestimonials();
  }, []);

  const total = testimonials.length;
  const shouldRotate = total > 3;

  useEffect(() => {
    if (!shouldRotate || paused) return undefined;

    intervalRef.current = setInterval(() => {
      setStartIndex((i) => (i + 1) % total);
    }, ROTATE_INTERVAL_MS);

    return () => clearInterval(intervalRef.current);
  }, [shouldRotate, paused, total]);

  if (total === 0) return null;

  // Modulo indexing so the visible window wraps past the end of the array
  // instead of just slicing (which would run short near the end of the list)
  const visible = shouldRotate
    ? [0, 1, 2].map((offset) => testimonials[(startIndex + offset) % total])
    : testimonials;

  return (
    <section className="testimonials">
      <div className="testimonials__container">
        <h2 className="testimonials__title">What farmers are saying</h2>

        <div
          className="testimonials__grid"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {visible.map((t) => (
            <div key={t._id} className="testimonials__card">
              <blockquote className="testimonials__quote">“{t.quote}”</blockquote>
              <p className="testimonials__attribution">
                — {t.farmerName}, {t.farmName}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialCarousel;

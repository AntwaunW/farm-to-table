import { useState } from 'react';
import api from '../utils/api';
import './Contact.scss';
import PageMeta from '../components/common/PageMeta';

const SUBJECTS = [
  'General inquiry',
  'Farmer / seller question',
  'Order issue',
  'Partnership opportunity',
  'Media & press',
  'Other',
];

const initialForm = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

const Contact = () => {
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/contact', formData);
      setSuccess(true);
      setFormData(initialForm);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact">
      <PageMeta title="Contact Us | Cattle & Crop" />

      {/* Header */}
      <section className="contact__header">
        <div className="contact__header-container">
          <h1 className="contact__header-title">Get in Touch</h1>
          <p className="contact__header-subtitle">
            We'd love to hear from you. Send us a message and we'll get back within 24 hours.
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="contact__body">
        <div className="contact__container">

          {/* Info column */}
          <div className="contact__info">
            <div className="contact__info-item">
              <span className="contact__info-icon">📍</span>
              <div>
                <p className="contact__info-label">Based in</p>
                <p className="contact__info-value">Texas, USA</p>
              </div>
            </div>
            <div className="contact__info-item">
              <span className="contact__info-icon">✉️</span>
              <div>
                <p className="contact__info-label">Email</p>
                <p className="contact__info-value">hello@cattleandcrop.com</p>
              </div>
            </div>
            <div className="contact__info-item">
              <span className="contact__info-icon">⏱</span>
              <div>
                <p className="contact__info-label">Response time</p>
                <p className="contact__info-value">Within 24 hours</p>
              </div>
            </div>
            <div className="contact__info-note">
              <p>
                For urgent order issues, please include your order number
                in your message and select "Order issue" as the subject.
              </p>
            </div>
          </div>

          {/* Form card */}
          <div className="contact__form-card">
            {success ? (
              <div className="contact__success">
                <span className="contact__success-icon">✓</span>
                <h2 className="contact__success-title">Message sent!</h2>
                <p className="contact__success-body">
                  Thanks for reaching out. We'll get back to you within 24 hours.
                </p>
                <button
                  className="contact__success-reset"
                  onClick={() => setSuccess(false)}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form className="contact__form" onSubmit={handleSubmit}>
                <h2 className="contact__form-title">Send a Message</h2>

                {error && <div className="contact__error">{error}</div>}

                <div className="contact__row">
                  <div className="contact__field">
                    <label className="contact__label">Full name <span>*</span></label>
                    <input
                      className="contact__input"
                      type="text"
                      name="name"
                      placeholder="John Smith"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="contact__field">
                    <label className="contact__label">Email address <span>*</span></label>
                    <input
                      className="contact__input"
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="contact__row">
                  <div className="contact__field">
                    <label className="contact__label">Phone <span className="contact__optional">(optional)</span></label>
                    <input
                      className="contact__input"
                      type="tel"
                      name="phone"
                      placeholder="(555) 000-0000"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="contact__field">
                    <label className="contact__label">Subject <span>*</span></label>
                    <select
                      className="contact__input"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select a subject</option>
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="contact__field">
                  <label className="contact__label">Message <span>*</span></label>
                  <textarea
                    className="contact__input contact__textarea"
                    name="message"
                    placeholder="Tell us how we can help..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                  />
                </div>

                <button
                  className="contact__submit"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send message'}
                </button>
              </form>
            )}
          </div>

        </div>
      </section>

    </div>
  );
};

export default Contact;

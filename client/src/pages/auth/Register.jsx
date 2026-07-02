// Register page — creates a new user account (farmer or consumer)
// On success, calls AuthContext's login() to log them in immediately and redirects home

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import PasswordInput from '../../components/common/PasswordInput';
import './Register.scss';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'consumer', // Default role — user can switch to 'farmer' via the dropdown
    location: {
      city: '',
      state: '',
      zip: '',
    },
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Handles both top-level fields and nested location fields
  // City, state, and zip are nested under formData.location
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (['city', 'state', 'zip'].includes(name)) {
      setFormData({
        ...formData,
        location: { ...formData.location, [name]: value }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent browser page reload on form submit
    setError('');

    // Client-side password match check before making the API call
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Strip confirmPassword before sending — the backend doesn't expect it
      const { confirmPassword, ...submitData } = formData;
      const res = await api.post('/auth/register', submitData);

      // Log the user in immediately after successful registration
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      // Display the server's error message or a generic fallback
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__card">
        <div className="auth__header">
          <h1 className="auth__title">Create an account</h1>
          <p className="auth__subtitle">Join Cattle &amp; Crop today</p>
        </div>

        {/* Show server-side or validation errors above the form */}
        {error && <div className="auth__error">{error}</div>}

        <form className="auth__form" onSubmit={handleSubmit}>
          <div className="auth__field">
            <label className="auth__label">Full name</label>
            <input
              className="auth__input"
              type="text"
              name="name"
              placeholder="John Smith"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth__field">
            <label className="auth__label">Email address</label>
            <input
              className="auth__input"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Role selection — determines what the user can do in the app */}
          <div className="auth__field">
            <label className="auth__label">I am a</label>
            <select
              className="auth__input"
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="consumer">Consumer — I want to buy</option>
              <option value="farmer">Farmer — I want to sell</option>
            </select>
          </div>

          <div className="auth__field">
            <label className="auth__label">City</label>
            <input
              className="auth__input"
              type="text"
              name="city"
              placeholder="Austin"
              value={formData.location.city}
              onChange={handleChange}
              required
            />
          </div>

          {/* State and zip are side by side using the auth__row layout */}
          <div className="auth__row">
            <div className="auth__field">
              <label className="auth__label">State</label>
              <input
                className="auth__input"
                type="text"
                name="state"
                placeholder="TX"
                value={formData.location.state}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth__field">
              <label className="auth__label">Zip code</label>
              <input
                className="auth__input"
                type="text"
                name="zip"
                placeholder="78701"
                value={formData.location.zip}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="auth__field">
            <label className="auth__label">Password</label>
            <PasswordInput
              className="auth__input"
              name="password"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth__field">
            <label className="auth__label">Confirm password</label>
            <PasswordInput
              className="auth__input"
              name="confirmPassword"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          {/* Disable the button while the request is in flight to prevent duplicate submissions */}
          <button
            className="auth__btn"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="auth__switch">
          Already have an account?{' '}
          <Link to="/login" className="auth__switch-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

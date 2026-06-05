// Login page — authenticates an existing user and stores their session
// On success, calls AuthContext's login() to persist the token and redirects home

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './Login.scss';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Generic change handler — updates whichever field the user is typing in
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent the browser from reloading the page
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', formData);
      // Save the user and token to context + localStorage for persistent sessions
      login(res.data.user, res.data.token);
      navigate('/'); // Redirect to home after successful login
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
          <h1 className="auth__title">Welcome back</h1>
          <p className="auth__subtitle">Sign in to your FarmToTable account</p>
        </div>

        {/* Show server-side or validation errors above the form */}
        {error && <div className="auth__error">{error}</div>}

        <form className="auth__form" onSubmit={handleSubmit}>
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

          <div className="auth__field">
            <label className="auth__label">Password</label>
            <input
              className="auth__input"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
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
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="auth__switch">
          Don't have an account?{' '}
          <Link to="/register" className="auth__switch-link">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

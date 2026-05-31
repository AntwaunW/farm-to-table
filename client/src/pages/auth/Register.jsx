import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './Register.scss';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'consumer',
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
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...submitData } = formData;
      const res = await api.post('/auth/register', submitData);
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
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
          <p className="auth__subtitle">Join FarmTable today</p>
        </div>

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
            <input
              className="auth__input"
              type="password"
              name="password"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth__field">
            <label className="auth__label">Confirm password</label>
            <input
              className="auth__input"
              type="password"
              name="confirmPassword"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

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
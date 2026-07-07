// Register page — two-step signup: pick a role (buyer/farmer), then fill in
// account details. On success, calls AuthContext's login() to log them in
// immediately and redirects home (or into farm setup for farmers).

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import PasswordInput from '../../components/common/PasswordInput';
import './Register.scss';

const Register = () => {
  // 1 = choosing a role, 2 = filling in account details
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '', // Empty until a role card is clicked on step 1
    farmName: '', // Only used when role is 'farmer' — carried into the farm setup step
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Picking a role on step 1 sets it and immediately advances to step 2
  const selectRole = (role) => {
    setFormData({ ...formData, role });
    setStep(2);
  };

  // Returning to step 1 keeps everything already typed — only the visible step changes
  const goBack = () => setStep(1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
      // Strip confirmPassword and farmName before sending — the account itself
      // doesn't have a farmName field, it's only collected here to carry into
      // the farm setup step below
      const { confirmPassword, farmName, ...submitData } = formData;
      const res = await api.post('/auth/register', submitData);

      // Log the user in immediately after successful registration
      login(res.data.user, res.data.token);

      // Farmers go straight into finishing their farm profile, with the name
      // they already gave us pre-filled — everyone else just lands on home
      if (formData.role === 'farmer') {
        navigate('/farms/create', { state: { farmName } });
      } else {
        navigate('/');
      }
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

        {/* ===== STEP 1: ROLE ===== */}
        {step === 1 && (
          <div className="auth__roles">
            <button
              type="button"
              className="auth__role-card"
              onClick={() => selectRole('consumer')}
            >
              <span className="auth__role-icon" aria-hidden="true">🛒</span>
              <span className="auth__role-title">I want to buy</span>
              <span className="auth__role-subtitle">from local farms</span>
            </button>

            <button
              type="button"
              className="auth__role-card"
              onClick={() => selectRole('farmer')}
            >
              <span className="auth__role-icon" aria-hidden="true">🌾</span>
              <span className="auth__role-title">I want to sell</span>
              <span className="auth__role-subtitle">I'm a farmer</span>
            </button>
          </div>
        )}

        {/* ===== STEP 2: DETAILS ===== */}
        {step === 2 && (
          <form className="auth__form" onSubmit={handleSubmit}>
            {/* Lets the user change their mind about role without retyping anything */}
            <button type="button" className="auth__back" onClick={goBack}>
              ← Back
            </button>

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

            {/* Only farmers need this — carried into the farm setup step after signup */}
            {formData.role === 'farmer' && (
              <div className="auth__field">
                <label className="auth__label">Farm name</label>
                <input
                  className="auth__input"
                  type="text"
                  name="farmName"
                  placeholder="e.g. Lone Star Ranch"
                  value={formData.farmName}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

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
        )}

        <p className="auth__switch">
          Already have an account?{' '}
          <Link to="/login" className="auth__switch-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

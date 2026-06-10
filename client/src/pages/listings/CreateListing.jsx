// CreateListing page — allows farmers to add a product listing to their farm
// The backend automatically links the listing to the farmer's farm
// using their JWT token — the farmer doesn't need to provide their farm ID

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import ImageUpload from '../../components/common/ImageUpload';
import './CreateListing.scss';

const CreateListing = () => {
  // -------------------------------------------------------------------
  // 🎓 WHY DO WE CHECK THE ROLE HERE AGAIN?
  // Even though ProtectedRoute checks if someone is logged in,
  // it doesn't check their role. A consumer could manually type
  // /listings/create in the URL bar. This check stops them.
  // Think of it like a bouncer at a VIP door — ProtectedRoute
  // checks if you have a ticket, this check verifies you have
  // the RIGHT ticket.
  // -------------------------------------------------------------------
  const { user } = useAuth();
  const navigate = useNavigate();

  // -------------------------------------------------------------------
  // 🎓 THE FORM DATA
  // Each field matches exactly what our backend Listing model expects.
  // We start everything empty or with a sensible default.
  // 'category' starts empty — farmer must pick one.
  // 'unit' starts as 'lb' — the most common unit.
  // 'quantityAvailable' starts as 1 — minimum possible.
  // -------------------------------------------------------------------
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    pricePerUnit: '',
    unit: 'lb',
    quantityAvailable: 1,
    harvestDate: '',
    photos: [], // Start with an empty array for photo URLs
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Role check — only farmers can create listings
  if (user?.role !== 'farmer') {
    return (
      <div className="create-listing__error-page">
        <h2>Access Denied</h2>
        <p>Only farmers can create listings.</p>
      </div>
    );
  }

  // -------------------------------------------------------------------
  // 🎓 HANDLE CHANGE
  // Same pattern as CreateFarm — every keystroke updates formData.
  // Notice we don't need the nested location check here because
  // all our fields are flat (not nested inside another object).
  // -------------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = (url) => {
    setFormData({ ...formData, photos: [...formData.photos, url] });
  };

  // -------------------------------------------------------------------
  // 🎓 HANDLE SUBMIT
  // Before sending to the backend we do two checks:
  // 1. Price must be a positive number — no free or negative prices
  // 2. Quantity must be at least 1 — can't sell something you don't have
  //
  // Number() converts a string to a number.
  // "850" as a string becomes 850 as a number.
  // We need this because input fields always return strings.
  // -------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate price
    if (Number(formData.pricePerUnit) <= 0) {
      setError('Price must be greater than zero.');
      return;
    }

    // Validate quantity
    if (Number(formData.quantityAvailable) < 1) {
      setError('Quantity must be at least 1.');
      return;
    }

    setLoading(true);

    try {
      // Send listing data to backend
      // Backend automatically finds the farm using req.user.id
      await api.post('/listings', {
        ...formData,
        // Convert string values to numbers before sending
        pricePerUnit: Number(formData.pricePerUnit),
        quantityAvailable: Number(formData.quantityAvailable),
      });

      // Success — go back to dashboard to see the new listing
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-listing">
      <div className="create-listing__container">

        {/* Page header */}
        <div className="create-listing__header">
          <h1 className="create-listing__title">Add a new listing</h1>
          <p className="create-listing__subtitle">
            Tell buyers what you have available
          </p>
        </div>

        {/* Error message */}
        {error && <div className="create-listing__error">{error}</div>}

        <form className="create-listing__form" onSubmit={handleSubmit}>

          {/* Product title */}
          <div className="create-listing__field">
            <label className="create-listing__label">Product name</label>
            <input
              className="create-listing__input"
              type="text"
              name="title"
              placeholder="e.g. Grass Fed Quarter Cow"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          {/* Description */}
          <div className="create-listing__field">
            <label className="create-listing__label">Description</label>
            <textarea
              className="create-listing__input create-listing__textarea"
              name="description"
              placeholder="Describe your product — quality, how it's raised, what's included..."
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
            />
          </div>

          {/* Category */}
          <div className="create-listing__field">
            <label className="create-listing__label">Category</label>
            {/* -------------------------------------------------------------------
            🎓 WHY A DROPDOWN HERE INSTEAD OF TOGGLE BUTTONS?
            For CreateFarm we used toggle buttons because a farm can have
            MULTIPLE categories. But a listing only has ONE category —
            a product is either beef OR eggs, not both.
            A dropdown (select) is perfect for picking exactly one option.
            ------------------------------------------------------------------- */}
            <select
              className="create-listing__input"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select a category</option>
              <option value="beef">Beef</option>
              <option value="produce">Produce</option>
              <option value="dairy">Dairy</option>
              <option value="eggs">Eggs</option>
              <option value="honey">Honey</option>
              <option value="pork">Pork</option>
              <option value="lamb">Lamb</option>
              <option value="poultry">Poultry</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Price and Unit side by side */}
          <div className="create-listing__row">
            <div className="create-listing__field">
              <label className="create-listing__label">Price per unit ($)</label>
              {/* -------------------------------------------------------------------
              🎓 type="number" vs type="text"
              Using type="number" tells the browser this field only accepts
              numbers. It also gives mobile users a number keyboard.
              min="0" prevents negative numbers right in the browser
              before it even reaches our validation check.
              ------------------------------------------------------------------- */}
              <input
                className="create-listing__input"
                type="number"
                name="pricePerUnit"
                placeholder="850"
                value={formData.pricePerUnit}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="create-listing__field">
              <label className="create-listing__label">Unit</label>
              <select
                className="create-listing__input"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                required
              >
                <option value="lb">Per pound (lb)</option>
                <option value="dozen">Per dozen</option>
                <option value="bundle">Per bundle</option>
                <option value="whole">Whole</option>
                <option value="quarter">Quarter</option>
                <option value="half">Half</option>
                <option value="each">Each</option>
                <option value="gallon">Per gallon</option>
              </select>
            </div>
          </div>

          {/* Quantity and Harvest date side by side */}
          <div className="create-listing__row">
            <div className="create-listing__field">
              <label className="create-listing__label">Quantity available</label>
              <input
                className="create-listing__input"
                type="number"
                name="quantityAvailable"
                placeholder="5"
                value={formData.quantityAvailable}
                onChange={handleChange}
                min="1"
                required
              />
            </div>

            <div className="create-listing__field">
              <label className="create-listing__label">
                Harvest date
                <span className="create-listing__optional"> (optional)</span>
              </label>
              {/* -------------------------------------------------------------------
              🎓 type="date"
              This gives users a date picker in the browser automatically.
              No need to build our own calendar — the browser handles it.
              The value is stored as a string like "2026-06-15".
              ------------------------------------------------------------------- */}
              <input
                className="create-listing__input"
                type="date"
                name="harvestDate"
                value={formData.harvestDate}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Photo upload */}
          <div className="create-listing__field">
            <ImageUpload
              onUpload={handleImageUpload}
              label="Product photo (optional)"
            />
          </div>

          {/* Submit button */}
          <button
            className="create-listing__submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Adding listing...' : 'Add listing'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default CreateListing;
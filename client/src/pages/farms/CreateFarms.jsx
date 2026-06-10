// CreateFarm page — allows farmers to create their farm profile
// Only accessible to users with the 'farmer' role
// Sends farm data to POST /api/farms on the backend

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import ImageUpload from '../../components/common/ImageUpload';
import './CreateFarms.scss';

const CreateFarm = () => {
  // -------------------------------------------------------------------
  // 🎓 WHAT IS useAuth() DOING HERE?
  // Think of useAuth() like checking your school ID card.
  // It gives us the current user's information — including their role.
  // We use it to check if this person is actually a farmer before
  // letting them do anything on this page.
  // -------------------------------------------------------------------
  const { user } = useAuth();
  const navigate = useNavigate();

  // -------------------------------------------------------------------
  // 🎓 WHAT IS formData?
  // Think of formData like a blank paper form sitting on a desk.
  // Each field starts empty. As the farmer types in each box
  // the form fills in. When they hit submit we send the whole
  // filled-out form to the backend.
  // -------------------------------------------------------------------
  const [formData, setFormData] = useState({
    farmName: '',
    description: '',
    location: {
      city: '',
      state: '',
      zip: '',
    },
    category: [],
    photos: [],
  });

  // Stores any error message to show the user
  const [error, setError] = useState('');

  // Controls the loading state while the API call is happening
  const [loading, setLoading] = useState(false);

  // -------------------------------------------------------------------
  // 🎓 ROLE CHECK
  // This is the "farmers market booth" check we talked about.
  // If the user is not a farmer we immediately show an error message
  // and stop rendering the form entirely.
  // The word 'return' here means "stop right here, don't go further."
  // -------------------------------------------------------------------
  if (user?.role !== 'farmer') {
    return (
      <div className="create-farm__error-page">
        <h2>Access Denied</h2>
        <p>Only farmers can create a farm profile.</p>
      </div>
    );
  }

  // -------------------------------------------------------------------
  // 🎓 WHAT IS handleChange?
  // Imagine you're filling out a paper form and every time you write
  // a letter in a box, someone updates a copy of the form on a
  // computer. That's what handleChange does — every keystroke updates
  // our formData state to match what's in the input boxes.
  //
  // The special check for city/state/zip is because those fields live
  // inside a nested 'location' object. It's like a form within a form.
  // We have to be careful to only update the location part without
  // wiping out city when we update state, for example.
  // -------------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (['city', 'state', 'zip'].includes(name)) {
      // Update nested location object
      setFormData({
        ...formData,
        location: { ...formData.location, [name]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // -------------------------------------------------------------------
  // 🎓 WHAT IS handleCategoryToggle?
  // Think of categories like checkboxes on a form.
  // A farmer might sell both beef AND eggs.
  // So category is an ARRAY — it can hold multiple values.
  //
  // When a farmer clicks a category button:
  // - If it's already selected → remove it from the array
  // - If it's not selected → add it to the array
  //
  // includes() checks if something is already in the array
  // filter() removes an item from the array
  // [...formData.category, cat] adds a new item to the array
  // -------------------------------------------------------------------
  const handleCategoryToggle = (cat) => {
    const current = formData.category;

    if (current.includes(cat)) {
      // Already selected — remove it
      setFormData({
        ...formData,
        category: current.filter((c) => c !== cat),
      });
    } else {
      // Not selected — add it
      setFormData({
        ...formData,
        category: [...current, cat],
      });
    }
  };

     // Called when ImageUpload component finishes uploading
    // Adds the new Cloudinary URL to our photos array
    const handleImageUpload = (url) => {
        setFormData({ ...formData, photos: [...formData.photos, url] });
        };

  // -------------------------------------------------------------------
  // 🎓 WHAT IS handleSubmit?
  // This is the "send the form to the post office" function.
  // When the farmer clicks Submit:
  // 1. We stop the page from refreshing (e.preventDefault)
  // 2. We check they selected at least one category
  // 3. We send the form data to our backend API
  // 4. If it works we redirect them to the dashboard
  // 5. If something goes wrong we show an error message
  // -------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Make sure at least one category is selected
    if (formData.category.length === 0) {
      setError('Please select at least one product category.');
      return;
    }

    setLoading(true);

    try {
      // Send the farm data to the backend
      await api.post('/farms', formData);

      // Success — redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      // Show the error message from the backend if available
      setError(err.response?.data?.message || 'Failed to create farm. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // List of available categories — same as our backend enum
  const categories = [
    'beef', 'produce', 'dairy', 'eggs',
    'honey', 'pork', 'lamb', 'poultry', 'other'
  ];

  return (
    <div className="create-farm">
      <div className="create-farm__container">

        {/* Page header */}
        <div className="create-farm__header">
          <h1 className="create-farm__title">Create your farm profile</h1>
          <p className="create-farm__subtitle">
            Tell buyers about your farm and what you sell
          </p>
        </div>

        {/* Error message */}
        {error && <div className="create-farm__error">{error}</div>}

        <form className="create-farm__form" onSubmit={handleSubmit}>

          {/* Farm name */}
          <div className="create-farm__field">
            <label className="create-farm__label">Farm name</label>
            <input
              className="create-farm__input"
              type="text"
              name="farmName"
              placeholder="e.g. Lone Star Ranch"
              value={formData.farmName}
              onChange={handleChange}
              required
            />
          </div>

          {/* Description */}
          <div className="create-farm__field">
            <label className="create-farm__label">Description</label>
            {/* -------------------------------------------------------------------
            🎓 textarea vs input
            A regular input is one line — good for short things like a name.
            A textarea is multiple lines — good for longer descriptions.
            Both work the same way with onChange and value.
            ------------------------------------------------------------------- */}
            <textarea
              className="create-farm__input create-farm__textarea"
              name="description"
              placeholder="Tell buyers about your farm, your practices, and what makes you special..."
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
            />
          </div>

          {/* Location */}
          <div className="create-farm__field">
            <label className="create-farm__label">City</label>
            <input
              className="create-farm__input"
              type="text"
              name="city"
              placeholder="Austin"
              value={formData.location.city}
              onChange={handleChange}
              required
            />
          </div>

          <div className="create-farm__row">
            <div className="create-farm__field">
              <label className="create-farm__label">State</label>
              <input
                className="create-farm__input"
                type="text"
                name="state"
                placeholder="TX"
                value={formData.location.state}
                onChange={handleChange}
                required
              />
            </div>
            <div className="create-farm__field">
              <label className="create-farm__label">Zip code</label>
              <input
                className="create-farm__input"
                type="text"
                name="zip"
                placeholder="78701"
                value={formData.location.zip}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Categories */}
          <div className="create-farm__field">
            <label className="create-farm__label">
              What do you sell? (select all that apply)
            </label>
            {/* -------------------------------------------------------------------
            🎓 WHY ARE CATEGORIES BUTTONS AND NOT CHECKBOXES?
            We could use HTML checkboxes but buttons look much nicer and
            we can style them however we want. We manually track which ones
            are selected using our category array in formData.
            The 'active' class makes the selected ones look highlighted.
            ------------------------------------------------------------------- */}
            <div className="create-farm__categories">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`create-farm__cat-btn ${
                    formData.category.includes(cat)
                      ? 'create-farm__cat-btn--active'
                      : ''
                  }`}
                  onClick={() => handleCategoryToggle(cat)}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

            {/* Photo upload */}
            <div className="create-farm__field">
                <ImageUpload
                    onUpload={handleImageUpload}
                    label="Farm photo (optional)"
                />
            </div>

          {/* Submit button */}
          <button
            className="create-farm__submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Creating farm...' : 'Create farm profile'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default CreateFarm;
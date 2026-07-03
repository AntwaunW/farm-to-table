// MyListings — farmer's listing management page
// Shows all of the farmer's listings (available + unavailable)
// Farmers can edit any listing inline, toggle availability, or delete it

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './MyListings.scss';

// Category and unit options kept in one place so dropdowns stay consistent
const CATEGORIES = ['beef', 'produce', 'dairy', 'eggs', 'honey', 'pork', 'lamb', 'poultry', 'other'];
const UNITS = ['lb', 'dozen', 'bundle', 'whole', 'quarter', 'half', 'each', 'gallon'];

// Maps category to an emoji — same as ListingCard
const getCategoryIcon = (category) => {
  const icons = {
    beef: '🥩', eggs: '🥚', honey: '🍯', dairy: '🥛',
    produce: '🥬', pork: '🥓', lamb: '🍖', poultry: '🍗', other: '🌾',
  };
  return icons[category] || '🌾';
};

// Empty form shape used when opening the edit form for a listing
const emptyEdit = {
  title: '', description: '', category: '',
  pricePerUnit: '', unit: '', quantityAvailable: '', harvestDate: '',
};

const MyListings = () => {
  const { user } = useAuth();

  // All of the farmer's listings — fetched fresh on mount
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ID of the listing currently open for editing (null = none)
  const [editingId, setEditingId] = useState(null);

  // Form data for the listing being edited
  const [editForm, setEditForm] = useState(emptyEdit);

  // Per-listing save and delete error messages keyed by listing._id
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch the farmer's own listings on mount
  useEffect(() => {
    const fetchMyListings = async () => {
      try {
        // /api/listings/my returns ALL listings regardless of isAvailable
        const res = await api.get('/listings/my');
        setListings(res.data.listings);
      } catch (err) {
        setError('Failed to load your listings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyListings();
  }, []);

  // Open the edit form for a specific listing, pre-filling it with current values
  const startEdit = (listing) => {
    setEditingId(listing._id);
    setSaveError('');
    setEditForm({
      title: listing.title,
      description: listing.description,
      category: listing.category,
      pricePerUnit: listing.pricePerUnit,
      unit: listing.unit,
      quantityAvailable: listing.quantityAvailable,
      // Format ISO date to YYYY-MM-DD so the date input pre-fills correctly
      harvestDate: listing.harvestDate
        ? new Date(listing.harvestDate).toISOString().split('T')[0]
        : '',
    });
  };

  // Cancel editing without saving — close the form
  const cancelEdit = () => {
    setEditingId(null);
    setSaveError('');
  };

  // Update editForm state as the farmer types in any edit field
  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  // Save the edited listing — calls PUT /api/listings/:id
  const handleSave = async (listingId) => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await api.put(`/listings/${listingId}`, editForm);
      // Replace the old listing in local state with the updated one
      setListings(listings.map((l) =>
        l._id === listingId ? res.data.listing : l
      ));
      setEditingId(null);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle isAvailable between true and false — calls PUT /api/listings/:id
  const handleToggle = async (listing) => {
    try {
      const res = await api.put(`/listings/${listing._id}`, {
        isAvailable: !listing.isAvailable,
      });
      setListings(listings.map((l) =>
        l._id === listing._id ? res.data.listing : l
      ));
    } catch (err) {
      alert('Failed to update availability.');
    }
  };

  // Permanently delete a listing after confirmation
  const handleDelete = async (listingId) => {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    try {
      await api.delete(`/listings/${listingId}`);
      // Remove it from local state so the UI updates immediately
      setListings(listings.filter((l) => l._id !== listingId));
    } catch (err) {
      alert('Failed to delete listing.');
    }
  };

  // Role check — only farmers manage listings. ProtectedRoute only checks that
  // someone is logged in, not their role, so a consumer could otherwise reach
  // this page directly by URL and see farmer-only management UI.
  if (user?.role !== 'farmer') {
    return (
      <div className="my-listings__error">
        <h2>Access Denied</h2>
        <p>Only farmers can manage listings.</p>
      </div>
    );
  }

  if (loading) return <div className="my-listings__loading">Loading your listings...</div>;
  if (error) return <div className="my-listings__error">{error}</div>;

  return (
    <div className="my-listings">

      {/* Page header */}
      <div className="my-listings__header">
        <div className="my-listings__header-container">
          <div>
            <h1 className="my-listings__title">My listings</h1>
            <p className="my-listings__subtitle">
              Manage your products — edit details, toggle availability, or remove a listing.
            </p>
          </div>
          {/* Quick link back to dashboard where new listings are created */}
          <Link to="/dashboard" className="my-listings__dashboard-link">
            ← Back to dashboard
          </Link>
        </div>
      </div>

      <div className="my-listings__container">

        {/* Empty state — shown when the farmer has not created any listings yet */}
        {listings.length === 0 && (
          <div className="my-listings__empty">
            <p>You haven't created any listings yet.</p>
            <Link to="/dashboard" className="my-listings__btn">
              Go to dashboard to add a listing
            </Link>
          </div>
        )}

        {/* Listing count summary */}
        {listings.length > 0 && (
          <p className="my-listings__count">
            {listings.length} listing{listings.length !== 1 ? 's' : ''} ·{' '}
            {listings.filter((l) => l.isAvailable).length} active
          </p>
        )}

        {/* List of listings */}
        <div className="my-listings__list">
          {listings.map((listing) => (
            <div key={listing._id} className="my-listings__item">

              {/* ── Display mode — shown when this listing is NOT being edited ── */}
              {editingId !== listing._id ? (
                <div className="my-listings__display">

                  {/* Left: icon + core info */}
                  <div className="my-listings__info">
                    <span className="my-listings__icon">
                      {getCategoryIcon(listing.category)}
                    </span>
                    <div>
                      <h3 className="my-listings__item-title">{listing.title}</h3>
                      <p className="my-listings__item-meta">
                        ${listing.pricePerUnit} / {listing.unit}
                        <span className="my-listings__item-sep">·</span>
                        {listing.quantityAvailable} {listing.unit}(s) left
                        <span className="my-listings__item-sep">·</span>
                        {listing.category}
                      </p>
                      {listing.description && (
                        <p className="my-listings__item-desc">{listing.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Right: status badge + action buttons */}
                  <div className="my-listings__actions">
                    {/* Availability toggle — clicking flips isAvailable */}
                    <button
                      className={`my-listings__status ${listing.isAvailable ? 'my-listings__status--active' : 'my-listings__status--inactive'}`}
                      onClick={() => handleToggle(listing)}
                      type="button"
                      title="Click to toggle availability"
                    >
                      {listing.isAvailable ? 'Active' : 'Inactive'}
                    </button>

                    <button
                      className="my-listings__edit-btn"
                      onClick={() => startEdit(listing)}
                      type="button"
                    >
                      Edit
                    </button>

                    <button
                      className="my-listings__delete-btn"
                      onClick={() => handleDelete(listing._id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Edit mode — shown when this listing IS being edited ── */
                <form
                  className="my-listings__edit-form"
                  onSubmit={(e) => { e.preventDefault(); handleSave(listing._id); }}
                >
                  <h3 className="my-listings__edit-title">Editing: {listing.title}</h3>

                  {/* Save error */}
                  {saveError && <p className="my-listings__save-error">{saveError}</p>}

                  <div className="my-listings__form-grid">

                    {/* Title */}
                    <div className="my-listings__form-group my-listings__form-group--full">
                      <label className="my-listings__label">Title</label>
                      <input
                        className="my-listings__input"
                        name="title"
                        value={editForm.title}
                        onChange={handleEditChange}
                        required
                      />
                    </div>

                    {/* Description */}
                    <div className="my-listings__form-group my-listings__form-group--full">
                      <label className="my-listings__label">Description</label>
                      <textarea
                        className="my-listings__input my-listings__textarea"
                        name="description"
                        value={editForm.description}
                        onChange={handleEditChange}
                        rows={3}
                        required
                      />
                    </div>

                    {/* Category */}
                    <div className="my-listings__form-group">
                      <label className="my-listings__label">Category</label>
                      <select
                        className="my-listings__input"
                        name="category"
                        value={editForm.category}
                        onChange={handleEditChange}
                        required
                      >
                        <option value="">Select category</option>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c.charAt(0).toUpperCase() + c.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Unit */}
                    <div className="my-listings__form-group">
                      <label className="my-listings__label">Unit</label>
                      <select
                        className="my-listings__input"
                        name="unit"
                        value={editForm.unit}
                        onChange={handleEditChange}
                        required
                      >
                        <option value="">Select unit</option>
                        {UNITS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>

                    {/* Price */}
                    <div className="my-listings__form-group">
                      <label className="my-listings__label">Price per unit ($)</label>
                      <input
                        className="my-listings__input"
                        type="number"
                        name="pricePerUnit"
                        value={editForm.pricePerUnit}
                        onChange={handleEditChange}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    {/* Quantity */}
                    <div className="my-listings__form-group">
                      <label className="my-listings__label">Quantity available</label>
                      <input
                        className="my-listings__input"
                        type="number"
                        name="quantityAvailable"
                        value={editForm.quantityAvailable}
                        onChange={handleEditChange}
                        min="0"
                        required
                      />
                    </div>

                    {/* Harvest date (optional) */}
                    <div className="my-listings__form-group">
                      <label className="my-listings__label">Harvest date (optional)</label>
                      <input
                        className="my-listings__input"
                        type="date"
                        name="harvestDate"
                        value={editForm.harvestDate}
                        onChange={handleEditChange}
                      />
                    </div>

                  </div>

                  {/* Form actions */}
                  <div className="my-listings__form-actions">
                    <button
                      type="submit"
                      className="my-listings__save-btn"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save changes'}
                    </button>
                    <button
                      type="button"
                      className="my-listings__cancel-btn"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default MyListings;

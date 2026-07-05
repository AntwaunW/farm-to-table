// Farmer Dashboard — main control center for farmers
// Shows farm profile status, listings management, and incoming orders

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import AvatarUpload from '../../components/common/AvatarUpload';
import FarmGallery from '../../components/common/FarmGallery';
import ReviewCard from '../../components/common/ReviewCard';
import './FarmerDashboard.scss';

const FarmerDashboard = () => {
  // Get logged in farmer from auth context
  const { user } = useAuth();

  // State for the farmer's farm profile
  const [farm, setFarm] = useState(null);

  // State for the farmer's listings
  const [listings, setListings] = useState([]);

  // State for incoming orders
  const [orders, setOrders] = useState([]);

  // State for comments/reviews left by consumers about this farm
  const [reviews, setReviews] = useState([]);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Bio (farm description + street address) inline edit state
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [streetDraft, setStreetDraft] = useState('');
  const [bioSaving, setBioSaving] = useState(false);
  const [bioError, setBioError] = useState('');

  // Fetch all farmer data when component mounts
  useEffect(() => {
  const fetchFarmerData = async () => {
    try {
      // Fetch all farms and find this farmer's farm
      const farmsRes = await api.get('/farms');
      const myFarm = farmsRes.data.farms.find(
        (f) => f.owner._id === user.id
      );

      if (myFarm) {
        setFarm(myFarm);

        // Only fetch listings, orders, and reviews if farm exists
        const [listingsRes, ordersRes, reviewsRes] = await Promise.all([
          api.get(`/listings/farm/${myFarm._id}`),
          api.get('/orders/farm/me'),
          api.get(`/reviews/farm/${myFarm._id}`),
        ]);

        setListings(listingsRes.data.listings);
        setOrders(ordersRes.data.orders);
        setReviews(reviewsRes.data.reviews);
      }
      // If no farm exists we just leave farm as null
      // The dashboard will show the "Create farm profile" prompt

    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  fetchFarmerData();
}, [user.id]);

  // Update order status handler
  const handleStatusUpdate = async (orderId, status) => {
    try {
      const res = await api.put(`/orders/${orderId}/status`, { status });
      // Update order in local state without refetching — pulls the whole order back
      // so paymentStatus reflects an automatic refund if one was issued
      setOrders(orders.map((order) =>
        order._id === orderId ? res.data.order : order
      ));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status.');
    }
  };

  // Cancelling refunds the consumer automatically if the order was already paid,
  // so confirm first since this can't be undone
  const handleCancelOrder = (orderId) => {
    if (!window.confirm('Cancel this order? If the consumer already paid, they will be refunded automatically.')) {
      return;
    }
    handleStatusUpdate(orderId, 'cancelled');
  };

  // Opens the bio editor, pre-filled with the farm's current description + street address
  const startEditingBio = () => {
    setBioError('');
    setBioDraft(farm.description || '');
    setStreetDraft(farm.location.street || '');
    setEditingBio(true);
  };

  const cancelEditingBio = () => {
    setEditingBio(false);
    setBioError('');
  };

  // Saves the edited bio and street address — location must be sent as a whole
  // object since the server replaces it wholesale, so city/state/zip are preserved
  const handleSaveBio = async () => {
    if (!bioDraft.trim()) {
      setBioError('Bio cannot be empty.');
      return;
    }

    setBioSaving(true);
    setBioError('');

    try {
      const res = await api.put(`/farms/${farm._id}`, {
        description: bioDraft.trim(),
        location: { ...farm.location, street: streetDraft.trim() },
      });
      setFarm(res.data.farm);
      setEditingBio(false);
    } catch (err) {
      setBioError(err.response?.data?.message || 'Failed to save bio. Please try again.');
    } finally {
      setBioSaving(false);
    }
  };

  if (loading) return <div className="farmer-dashboard__loading">Loading dashboard...</div>;
  if (error) return <div className="farmer-dashboard__error">{error}</div>;

  return (
    <div className="farmer-dashboard">

      {/* Dashboard Header */}
      <div className="farmer-dashboard__header">
        <div className="farmer-dashboard__header-container">
          <AvatarUpload />
          <div>
            <h1 className="farmer-dashboard__title">
              Welcome back, {user.name}
            </h1>
            <p className="farmer-dashboard__subtitle">
              Manage your farm, listings, and orders
            </p>
          </div>
        </div>
      </div>

      <div className="farmer-dashboard__container">

        {/* Stats Row */}
        <div className="farmer-dashboard__stats">
          <div className="farmer-dashboard__stat">
            <span className="farmer-dashboard__stat-number">
              {listings.length}
            </span>
            <span className="farmer-dashboard__stat-label">Active listings</span>
          </div>
          <div className="farmer-dashboard__stat">
            <span className="farmer-dashboard__stat-number">
              {orders.filter((o) => o.status === 'pending').length}
            </span>
            <span className="farmer-dashboard__stat-label">Pending orders</span>
          </div>
          <div className="farmer-dashboard__stat">
            <span className="farmer-dashboard__stat-number">
              $
              {orders
                .filter((o) => o.paymentStatus === 'paid' && o.status !== 'cancelled')
                .reduce((sum, o) => sum + o.farmerPayout, 0)
                .toFixed(2)}
            </span>
            <span className="farmer-dashboard__stat-label">Total earnings</span>
          </div>
        </div>

        {/* Farm Profile Section */}
        <div className="farmer-dashboard__section">
          <div className="farmer-dashboard__section-header">
            <h2 className="farmer-dashboard__section-title">Farm profile</h2>
          </div>

          {/* Show create farm prompt if no farm exists */}
          {!farm ? (
            <div className="farmer-dashboard__empty">
              <p>You haven't created a farm profile yet.</p>
              <Link to="/farms/create" className="farmer-dashboard__btn">
                Create farm profile
              </Link>
            </div>
          ) : (
            <div className="farmer-dashboard__farm-card">
              <h3>{farm.farmName}</h3>
              <p>
                📍 {farm.location.street ? `${farm.location.street}, ` : ''}
                {farm.location.city}, {farm.location.state}
              </p>
              <div className="farmer-dashboard__farm-tags">
                {farm.category.map((cat) => (
                  <span key={cat} className="farmer-dashboard__tag">{cat}</span>
                ))}
              </div>
              <p className="farmer-dashboard__subscription">
                Plan: <strong>{farm.subscriptionTier}</strong>
              </p>

              {/* Bio (farm description) — shown on the public farm profile */}
              <div className="farmer-dashboard__bio">
                <div className="farmer-dashboard__bio-header">
                  <h4>Bio</h4>
                  {!editingBio && (
                    <button
                      className="farmer-dashboard__bio-edit-btn"
                      onClick={startEditingBio}
                      type="button"
                    >
                      Edit bio
                    </button>
                  )}
                </div>

                {editingBio ? (
                  <div className="farmer-dashboard__bio-form">
                    <label className="farmer-dashboard__bio-field-label">
                      Street address
                      <span className="farmer-dashboard__bio-field-hint">
                        {' '}— used for "Get directions" on pickup orders
                      </span>
                    </label>
                    <input
                      className="farmer-dashboard__bio-street-input"
                      type="text"
                      value={streetDraft}
                      onChange={(e) => setStreetDraft(e.target.value)}
                      placeholder="123 Ranch Road"
                      disabled={bioSaving}
                    />
                    <label className="farmer-dashboard__bio-field-label">Bio</label>
                    <textarea
                      className="farmer-dashboard__bio-textarea"
                      value={bioDraft}
                      onChange={(e) => setBioDraft(e.target.value)}
                      rows={4}
                      disabled={bioSaving}
                    />
                    {bioError && <p className="farmer-dashboard__bio-error">{bioError}</p>}
                    <div className="farmer-dashboard__bio-actions">
                      <button
                        className="farmer-dashboard__btn"
                        onClick={handleSaveBio}
                        disabled={bioSaving}
                        type="button"
                      >
                        {bioSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        className="farmer-dashboard__bio-cancel-btn"
                        onClick={cancelEditingBio}
                        disabled={bioSaving}
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="farmer-dashboard__bio-text">{farm.description}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Farm Gallery Section — only shown once the farmer has a farm profile */}
        {farm && (
          <div className="farmer-dashboard__section">
            <div className="farmer-dashboard__section-header">
              <div>
                <h2 className="farmer-dashboard__section-title">Farm gallery</h2>
                {/* Remind the farmer where these photos appear publicly */}
                <p className="farmer-dashboard__section-hint">
                  Photos appear on your public farm profile. Up to 12 photos.
                </p>
              </div>
            </div>

            {/*
              FarmGallery handles upload + remove interactions.
              onUpdate keeps the local farm state in sync so the photo
              count in the section header stays accurate without a page reload.
            */}
            <FarmGallery
              farmId={farm._id}
              photos={farm.photos}
              onUpdate={(updatedPhotos) => setFarm({ ...farm, photos: updatedPhotos })}
            />
          </div>
        )}

        {/* Listings Section */}
        <div className="farmer-dashboard__section">
          <div className="farmer-dashboard__section-header">
            <h2 className="farmer-dashboard__section-title">Your listings</h2>
            <Link to="/listings/create" className="farmer-dashboard__btn">
              + Add listing
            </Link>
          </div>

          {listings.length === 0 ? (
            <p className="farmer-dashboard__empty-text">
              No listings yet. Add your first product!
            </p>
          ) : (
            <div className="farmer-dashboard__listings">
              {listings.map((listing) => (
                <div key={listing._id} className="farmer-dashboard__listing-item">
                  <div className="farmer-dashboard__listing-info">
                    <h4>{listing.title}</h4>
                    <p>${listing.pricePerUnit} / {listing.unit}</p>
                    <p>Qty: {listing.quantityAvailable}</p>
                  </div>
                  <span className={`farmer-dashboard__listing-status ${listing.isAvailable ? 'available' : 'unavailable'}`}>
                    {listing.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orders Section */}
        <div className="farmer-dashboard__section">
          <div className="farmer-dashboard__section-header">
            <h2 className="farmer-dashboard__section-title">Incoming orders</h2>
          </div>

          {orders.length === 0 ? (
            <p className="farmer-dashboard__empty-text">No orders yet.</p>
          ) : (
            <div className="farmer-dashboard__orders">
              {orders.map((order) => (
                <div key={order._id} className="farmer-dashboard__order-item">
                  <div className="farmer-dashboard__order-info">
                    <h4>{order.consumer?.name}</h4>
                    <p>{order.consumer?.email}</p>
                    <p className="farmer-dashboard__order-id">Order #{order._id}</p>
                    <p>Total: ${order.totalAmount}</p>
                    <p>Payout: ${order.farmerPayout}</p>
                    <p>
                      {order.pickupOrDelivery === 'delivery' ? '🚚 Delivery' : '📍 Pickup'}:{' '}
                      {order.pickupDate ? new Date(order.pickupDate).toLocaleDateString() : 'TBD'}
                    </p>
                    {order.pickupOrDelivery === 'delivery' && order.deliveryAddress && (
                      <p>Deliver to: {order.deliveryAddress}</p>
                    )}
                  </div>
                  <div className="farmer-dashboard__order-actions">
                    {/* Show status badge */}
                    <span className={`farmer-dashboard__status farmer-dashboard__status--${order.status}`}>
                      {order.status}
                    </span>
                    {/* Show action buttons based on current status */}
                    {order.status === 'pending' && (
                      <button
                        className="farmer-dashboard__action-btn"
                        onClick={() => handleStatusUpdate(order._id, 'confirmed')}
                      >
                        Confirm order
                      </button>
                    )}
                    {order.status === 'confirmed' && (
                      <button
                        className="farmer-dashboard__action-btn"
                        onClick={() => handleStatusUpdate(order._id, 'ready')}
                      >
                        Mark ready
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button
                        className="farmer-dashboard__action-btn"
                        onClick={() => handleStatusUpdate(order._id, 'completed')}
                      >
                        Complete order
                      </button>
                    )}
                    {/* Cancellation is available up until the order is completed */}
                    {order.status !== 'completed' && order.status !== 'cancelled' && (
                      <button
                        className="farmer-dashboard__cancel-btn"
                        onClick={() => handleCancelOrder(order._id)}
                      >
                        Cancel order
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reviews Section — comments consumers have left about this farm */}
        {farm && (
          <div className="farmer-dashboard__section">
            <div className="farmer-dashboard__section-header">
              <h2 className="farmer-dashboard__section-title">Customer reviews</h2>
            </div>

            {reviews.length === 0 ? (
              <p className="farmer-dashboard__empty-text">
                No reviews yet.
              </p>
            ) : (
              <div className="farmer-dashboard__reviews">
                {reviews.map((review) => (
                  <ReviewCard key={review._id} review={review} />
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default FarmerDashboard;
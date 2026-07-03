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
      await api.put(`/orders/${orderId}/status`, { status });
      // Update order in local state without refetching
      setOrders(orders.map((order) =>
        order._id === orderId ? { ...order, status } : order
      ));
    } catch (err) {
      alert('Failed to update order status.');
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
              ${orders.reduce((sum, o) => sum + o.farmerPayout, 0).toFixed(2)}
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
              <p>📍 {farm.location.city}, {farm.location.state}</p>
              <div className="farmer-dashboard__farm-tags">
                {farm.category.map((cat) => (
                  <span key={cat} className="farmer-dashboard__tag">{cat}</span>
                ))}
              </div>
              <p className="farmer-dashboard__subscription">
                Plan: <strong>{farm.subscriptionTier}</strong>
              </p>
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
// Consumer Dashboard — shows order history for logged in consumers

import { useState, useEffect } from 'react';
import ReviewForm from '../../components/common/ReviewForm';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import './ConsumerDashboard.scss';

const ConsumerDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewableOrders, setReviewableOrders] = useState({});
  const [openReviewForms, setOpenReviewForms] = useState({});

  // Fetch orders when component mounts
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/consumer/me');
        setOrders(res.data.orders);
      } catch (err) {
        setError('Failed to load orders.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Check which completed orders can be reviewed
  useEffect(() => {
    const checkReviewable = async () => {
      const reviewable = {};
      for (const order of orders) {
        if (order.status === 'completed') {
          try {
            const res = await api.get(`/reviews/can-review/${order._id}`);
            reviewable[order._id] = res.data.canReview;
          } catch {
            reviewable[order._id] = false;
          }
        }
      }
      setReviewableOrders(reviewable);
    };
    if (orders.length > 0) checkReviewable();
  }, [orders]);

  // Called when a review is successfully submitted
  const handleReviewSubmitted = (orderId) => {
    setOpenReviewForms({ ...openReviewForms, [orderId]: false });
    setReviewableOrders({ ...reviewableOrders, [orderId]: false });
  };

  if (loading) return <div className="consumer-dashboard__loading">Loading orders...</div>;
  if (error) return <div className="consumer-dashboard__error">{error}</div>;

  return (
    <div className="consumer-dashboard">

      {/* Header */}
      <div className="consumer-dashboard__header">
        <div className="consumer-dashboard__header-container">
          <h1 className="consumer-dashboard__title">
            Welcome, {user.name}
          </h1>
          <p className="consumer-dashboard__subtitle">
            Track your orders and purchases
          </p>
        </div>
      </div>

      <div className="consumer-dashboard__container">

        {/* Stats */}
        <div className="consumer-dashboard__stats">
          <div className="consumer-dashboard__stat">
            <span className="consumer-dashboard__stat-number">
              {orders.length}
            </span>
            <span className="consumer-dashboard__stat-label">Total orders</span>
          </div>
          <div className="consumer-dashboard__stat">
            <span className="consumer-dashboard__stat-number">
              {orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length}
            </span>
            <span className="consumer-dashboard__stat-label">Active orders</span>
          </div>
          <div className="consumer-dashboard__stat">
            <span className="consumer-dashboard__stat-number">
              ${orders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)}
            </span>
            <span className="consumer-dashboard__stat-label">Total spent</span>
          </div>
        </div>

        {/* Orders Section */}
        <div className="consumer-dashboard__section">
          <h2 className="consumer-dashboard__section-title">Your orders</h2>

          {orders.length === 0 ? (
            <p className="consumer-dashboard__empty">
              You haven't placed any orders yet.
            </p>
          ) : (
            <div className="consumer-dashboard__orders">
              {orders.map((order) => (
                <div key={order._id} className="consumer-dashboard__order-item">

                  {/* Order header */}
                  <div className="consumer-dashboard__order-header">
                    <div>
                      <h4 className="consumer-dashboard__farm-name">
                        {order.farm?.farmName}
                      </h4>
                      <p className="consumer-dashboard__order-date">
                        Ordered: {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="consumer-dashboard__order-actions">
                      <span className={`consumer-dashboard__status consumer-dashboard__status--${order.status}`}>
                        {order.status}
                      </span>
                      {order.paymentStatus === 'unpaid' && (
                        <Link
                          to={`/checkout/${order._id}`}
                          className="consumer-dashboard__pay-btn"
                        >
                          Pay now
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Order items */}
                  <div className="consumer-dashboard__items">
                    {order.items.map((item) => (
                      <div key={item._id} className="consumer-dashboard__item">
                        <span>{item.title}</span>
                        <span>{item.quantity} x ${item.pricePerUnit} / {item.unit}</span>
                        <span>${item.subtotal}</span>
                      </div>
                    ))}
                  </div>

                  {/* Order footer */}
                  <div className="consumer-dashboard__order-footer">
                    <p>Pickup: {order.pickupDate ? new Date(order.pickupDate).toLocaleDateString() : 'TBD'}</p>
                    <p className="consumer-dashboard__total">
                      Total: ${order.totalAmount}
                    </p>
                  </div>

                  {/* Review button for completed orders */}
                  {reviewableOrders[order._id] && (
                    <button
                      className="consumer-dashboard__review-btn"
                      onClick={() => setOpenReviewForms({
                        ...openReviewForms,
                        [order._id]: !openReviewForms[order._id]
                      })}
                    >
                      {openReviewForms[order._id] ? 'Cancel' : 'Leave a review'}
                    </button>
                  )}

                  {/* Review form */}
                  {openReviewForms[order._id] && (
                    <ReviewForm
                      orderId={order._id}
                      farmId={order.farm?._id}
                      onReviewSubmitted={() => handleReviewSubmitted(order._id)}
                    />
                  )}

                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ConsumerDashboard;
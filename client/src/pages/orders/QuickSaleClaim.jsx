// QuickSaleClaim — public page opened by scanning a farmer's Quick Sale QR code
// or link. Shows a preview of the in-person order and lets the logged-in
// consumer claim + pay for it right there, in front of the farmer.
//
// Deliberately NOT wrapped in ProtectedRoute — that would bounce a logged-out
// scanner through /login with no way back to this exact order, since
// Login.jsx always navigates to '/' after signing in. Instead this page checks
// auth state itself and shows a tailored message when logged out.

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './QuickSaleClaim.scss';

const QuickSaleClaim = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    // Only a logged-in consumer can preview/claim — skip the fetch for
    // logged-out visitors or farmers, the API would just reject it anyway
    if (!user || user.role !== 'consumer') {
      setLoading(false);
      return;
    }

    const fetchPreview = async () => {
      try {
        const res = await api.get(`/orders/quick-sale/${id}`);
        setOrder(res.data.order);
      } catch (err) {
        setError(err.response?.data?.message || 'This quick sale is no longer available.');
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [id, user]);

  const handleConfirm = async () => {
    setClaiming(true);
    setError('');

    try {
      const res = await api.post(`/orders/quick-sale/${id}/claim`);
      navigate(`/checkout/${res.data.order._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to claim this order.');
      setClaiming(false);
    }
  };

  // Not logged in — the customer can just reopen the same QR/link after logging in
  if (!user) {
    return (
      <div className="quick-sale-claim">
        <div className="quick-sale-claim__card">
          <h1 className="quick-sale-claim__title">Log in to complete this purchase</h1>
          <p className="quick-sale-claim__text">
            Ask the farmer to show you this code again after you log in, or
            just scan it a second time.
          </p>
          <div className="quick-sale-claim__actions">
            <Link to="/login" className="quick-sale-claim__btn">Log in</Link>
            <Link to="/register" className="quick-sale-claim__btn quick-sale-claim__btn--outline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (user.role !== 'consumer') {
    return (
      <div className="quick-sale-claim">
        <div className="quick-sale-claim__card">
          <h1 className="quick-sale-claim__title">Consumer accounts only</h1>
          <p className="quick-sale-claim__text">
            Only a consumer account can complete an in-person purchase.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="quick-sale-claim__loading">Loading...</div>;
  }

  if (!order) {
    return (
      <div className="quick-sale-claim">
        <div className="quick-sale-claim__card">
          <h1 className="quick-sale-claim__title">Not available</h1>
          <p className="quick-sale-claim__text">
            {error || 'This quick sale could not be found.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="quick-sale-claim">
      <div className="quick-sale-claim__card">
        <h1 className="quick-sale-claim__title">Confirm your purchase</h1>
        <p className="quick-sale-claim__farm">{order.farm?.farmName}</p>

        <div className="quick-sale-claim__items">
          {order.items.map((item) => (
            <div key={item._id} className="quick-sale-claim__item">
              <span>{item.title}</span>
              <span>{item.quantity} x ${item.pricePerUnit} / {item.unit}</span>
              <span>${item.subtotal}</span>
            </div>
          ))}
        </div>

        <div className="quick-sale-claim__total">
          <span>Total</span>
          <span>${order.totalAmount}</span>
        </div>

        {error && <p className="quick-sale-claim__error">{error}</p>}

        <button
          className="quick-sale-claim__confirm-btn"
          onClick={handleConfirm}
          disabled={claiming}
          type="button"
        >
          {claiming ? 'Confirming...' : 'Confirm & Pay'}
        </button>
      </div>
    </div>
  );
};

export default QuickSaleClaim;

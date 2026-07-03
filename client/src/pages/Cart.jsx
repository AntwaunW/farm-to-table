// Cart page — shows all items in the cart and allows checkout
// Consumers can update quantities, remove items, and place their order

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './Cart.scss';

// Flat delivery fee — must match DELIVERY_FEE in server/routes/orders.js
const DELIVERY_FEE = 5.99;

const Cart = () => {
  const { cartItems, cartTotal, cartFarmId, cartFarmName,
          updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fulfillment choice — defaults to pickup, address only required for delivery
  const [pickupOrDelivery, setPickupOrDelivery] = useState('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Redirect to login if the user is not authenticated — the order API requires a logged-in consumer
  if (!user) {
    navigate('/login');
    return null;
  }

  // -------------------------------------------------------------------
  // 🎓 PLACING THE ORDER
  // When the consumer clicks "Place order":
  // 1. We format the cart items into what the backend expects
  // 2. Send to POST /api/orders
  // 3. Backend creates the order and returns an orderId
  // 4. We clear the cart
  // 5. Redirect to checkout to complete payment
  // -------------------------------------------------------------------
  const handlePlaceOrder = async () => {
    setError('');

    if (pickupOrDelivery === 'delivery' && !deliveryAddress.trim()) {
      setError('Please enter a delivery address.');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        farmId: cartFarmId,
        items: cartItems.map((item) => ({
          listingId: item.listingId,
          quantity: item.quantity,
        })),
        pickupOrDelivery,
        deliveryAddress: pickupOrDelivery === 'delivery' ? deliveryAddress.trim() : undefined,
      };

      const res = await api.post('/orders', orderData);
      const orderId = res.data.order._id;

      // Clear the cart after successful order
      clearCart();

      // Redirect to checkout for payment
      navigate(`/checkout/${orderId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className="cart__empty">
        <div className="cart__empty-content">
          <span className="cart__empty-icon">🛒</span>
          <h2>Your cart is empty</h2>
          <p>Browse local farms and add some products!</p>
          <Link to="/browse" className="cart__browse-btn">
            Browse farms
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart">
      <div className="cart__container">
        <h1 className="cart__title">Your cart</h1>
        <p className="cart__farm">Ordering from: <strong>{cartFarmName}</strong></p>

        {error && <p className="cart__error">{error}</p>}

        {/* Cart items */}
        <div className="cart__items">
          {cartItems.map((item) => (
            <div key={item.listingId} className="cart__item">
              <div className="cart__item-info">
                <h4 className="cart__item-title">{item.title}</h4>
                <p className="cart__item-price">
                  ${item.pricePerUnit} / {item.unit}
                </p>
              </div>

              {/* Quantity controls */}
              <div className="cart__item-controls">
                <button
                  className="cart__qty-btn"
                  onClick={() => updateQuantity(item.listingId, item.quantity - 1)}
                >
                −
                </button>
                <span className="cart__qty">{item.quantity}</span>
                <button
                  className="cart__qty-btn"
                  onClick={() => updateQuantity(item.listingId, item.quantity + 1)}
                >
                  +
                </button>
              </div>

              <div className="cart__item-subtotal">
                ${(item.pricePerUnit * item.quantity).toFixed(2)}
              </div>

              <button
                className="cart__remove-btn"
                onClick={() => removeFromCart(item.listingId)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Cart summary */}
        <div className="cart__summary">
          <div className="cart__total">
            <span>Total</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <p className="cart__fee-note">
            A 4% platform fee will be added at checkout
          </p>

          {/* Pickup or delivery choice */}
          <div className="cart__fulfillment">
            <p className="cart__fulfillment-label">How would you like to get your order?</p>
            <div className="cart__fulfillment-options">
              <label className="cart__fulfillment-option">
                <input
                  type="radio"
                  name="pickupOrDelivery"
                  value="pickup"
                  checked={pickupOrDelivery === 'pickup'}
                  onChange={() => setPickupOrDelivery('pickup')}
                />
                📍 Pickup
              </label>
              <label className="cart__fulfillment-option">
                <input
                  type="radio"
                  name="pickupOrDelivery"
                  value="delivery"
                  checked={pickupOrDelivery === 'delivery'}
                  onChange={() => setPickupOrDelivery('delivery')}
                />
                🚚 Delivery (+${DELIVERY_FEE.toFixed(2)})
              </label>
            </div>

            {pickupOrDelivery === 'delivery' && (
              <textarea
                className="cart__delivery-address"
                placeholder="Enter your delivery address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
              />
            )}
          </div>

          {pickupOrDelivery === 'delivery' && (
            <div className="cart__total cart__total--grand">
              <span>Total with delivery</span>
              <span>${(cartTotal + DELIVERY_FEE).toFixed(2)}</span>
            </div>
          )}

          <button
            className="cart__checkout-btn"
            onClick={handlePlaceOrder}
            disabled={loading}
          >
            {loading ? 'Placing order...' : 'Place order & checkout'}
          </button>

          <button
            className="cart__clear-btn"
            onClick={clearCart}
          >
            Clear cart
          </button>
        </div>

      </div>
    </div>
  );
};

export default Cart;
// Checkout page — handles Stripe payment for a placed order
// Flow: reads orderId from URL → fetches order details → creates Stripe
// payment intent → renders Stripe payment form → on success redirects
// to order confirmation

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../utils/api';
import { getDirectionsUrl } from '../utils/directions';
import './Checkout.scss';

// Initialize Stripe outside the component so it only loads once
// This is Stripe's recommended pattern
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

// ─── Inner payment form component ────────────────────────────────────────────
// Stripe requires the payment form to live inside the <Elements> provider
// So we separate it into its own component

const PaymentForm = ({ order, onSuccess, orderId }) => {
  // useStripe and useElements are Stripe hooks that give us access
  // to the Stripe instance and the payment form elements
  const stripe = useStripe();
  const elements = useElements();

  // Local state for this form
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Stripe.js hasn't loaded yet — don't allow submission
    if (!stripe || !elements) return;

    setProcessing(true);
    setPaymentError('');

    try {
      // confirmPayment sends the card details to Stripe securely
      // We never see the card number — Stripe handles it entirely
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/orders/${orderId}/confirmation`,
        },
        redirect: 'if_required',
    });

      if (error) {
        // Stripe returns user-friendly error messages
        setPaymentError(error.message);
      } else {
        // Payment succeeded — call the success handler
        onSuccess();
      }
    } catch (err) {
      setPaymentError('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form className="checkout__form" onSubmit={handleSubmit}>
      {/* PaymentElement renders the full Stripe payment UI */}
      {/* Card number, expiry, CVC — all handled securely by Stripe */}
      <div className="checkout__stripe-element">
        <PaymentElement />
      </div>

      {paymentError && (
        <p className="checkout__error">{paymentError}</p>
      )}

      <button
        className="checkout__pay-btn"
        type="submit"
        disabled={!stripe || processing}
      >
        {processing ? 'Processing...' : `Pay $${order?.totalAmount}`}
      </button>
    </form>
  );
};

// ─── Main Checkout page component ────────────────────────────────────────────

const Checkout = () => {
  // Read the order ID from the URL — e.g. /checkout/6a14815f...
  const { orderId } = useParams();
  const navigate = useNavigate();

  // clientSecret is required by Stripe to initialize the payment form
  const [clientSecret, setClientSecret] = useState('');

  // Store order details so we can show the consumer what they're paying for
  const [order, setOrder] = useState(null);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // On mount — fetch the order and create a Stripe payment intent
  useEffect(() => {
    const initializeCheckout = async () => {
      try {
        // Fetch the order details so we can display them
        const orderRes = await api.get(`/orders/${orderId}`);
        setOrder(orderRes.data.order);

        // Create a Stripe payment intent for this order
        // Backend returns a clientSecret that Stripe uses to
        // securely process the payment
        const paymentRes = await api.post('/payments/create-intent', {
          orderId,
        });
        setClientSecret(paymentRes.data.clientSecret);
      } catch (err) {
        setError('Failed to initialize checkout. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initializeCheckout();
  }, [orderId]);

  // Called when payment succeeds — syncs the order's paid status with Stripe
  // immediately rather than waiting on the webhook, so "Pay now" doesn't linger
  const handlePaymentSuccess = async () => {
    try {
      await api.post('/payments/confirm', { orderId });
    } catch (err) {
      // Non-fatal — the webhook will still sync the order if this fails
    }
    navigate(`/orders/${orderId}/confirmation`);
  };

  // Stripe Elements appearance config — matches our green color scheme
  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#2d6a4f',
      colorBackground: '#ffffff',
      colorText: '#1b1b1b',
      borderRadius: '8px',
    },
  };

  if (loading) {
    return (
      <div className="checkout__loading">
        <p>Preparing your checkout...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="checkout__error-page">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="checkout">
      <div className="checkout__container">

        {/* Left side — order summary */}
        <div className="checkout__summary">
          <h2 className="checkout__summary-title">Order summary</h2>

          {/* Farm name */}
          <p className="checkout__farm-name">
            {order?.farm?.farmName}
          </p>

          {/* Line items */}
          <div className="checkout__items">
            {order?.items.map((item) => (
              <div key={item._id} className="checkout__item">
                <div className="checkout__item-info">
                  <span className="checkout__item-title">{item.title}</span>
                  <span className="checkout__item-qty">
                    {item.quantity} x ${item.pricePerUnit} / {item.unit}
                  </span>
                </div>
                <span className="checkout__item-subtotal">
                  ${item.subtotal}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="checkout__totals">
            <div className="checkout__total-row">
              <span>Subtotal</span>
              <span>${order?.items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)}</span>
            </div>
            {order?.pickupOrDelivery === 'delivery' && order?.deliveryFee > 0 && (
              <div className="checkout__total-row">
                <span>Delivery fee</span>
                <span>${order.deliveryFee}</span>
              </div>
            )}
            <div className="checkout__total-row">
              <span>Platform fee (4%)</span>
              <span>${order?.platformFee}</span>
            </div>
            <div className="checkout__total-row checkout__total-row--total">
              <span>Total</span>
              <span>${order?.totalAmount}</span>
            </div>
          </div>

          {/* Pickup details */}
          <div className="checkout__pickup">
            <h3 className="checkout__pickup-title">Pickup details</h3>
            <p>
              {order?.pickupOrDelivery === 'in-person'
                ? '🤝 In-person purchase'
                : order?.pickupOrDelivery === 'pickup'
                ? '📍 Pickup'
                : '🚚 Delivery'}
            </p>
            {order?.pickupDate && (
              <p>{new Date(order.pickupDate).toLocaleDateString()}</p>
            )}
            {order?.pickupOrDelivery === 'delivery' && order?.deliveryAddress && (
              <p>{order.deliveryAddress}</p>
            )}
            {order?.pickupOrDelivery === 'pickup' && getDirectionsUrl(order?.farm?.location) && (
              <a
                href={getDirectionsUrl(order.farm.location)}
                target="_blank"
                rel="noopener noreferrer"
                className="checkout__directions-link"
              >
                Get directions →
              </a>
            )}
            {order?.notes && <p>Note: {order.notes}</p>}
          </div>
        </div>

        {/* Right side — payment form */}
        <div className="checkout__payment">
          <h2 className="checkout__payment-title">Payment details</h2>
          <p className="checkout__secure-note">
            🔒 Payments are processed securely by Stripe
          </p>

          {/* Elements is Stripe's context provider */}
          {/* clientSecret tells Stripe which payment intent to complete */}
          {clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance }}
            >
              <PaymentForm
                order={order}
                onSuccess={handlePaymentSuccess}
                orderId={orderId}
              />
            </Elements>
          )}
        </div>

      </div>
    </div>
  );
};

export default Checkout;
// Order Confirmation page — shown after successful payment
// Reads the orderId from the URL and displays a success message

import { useParams, Link } from 'react-router-dom';
import './OrderConfirmation.scss';

const OrderConfirmation = () => {
  const { orderId } = useParams();

  return (
    <div className="confirmation">
      <div className="confirmation__card">

        {/* Success icon */}
        <div className="confirmation__icon">✅</div>

        <h1 className="confirmation__title">Payment successful!</h1>
        <p className="confirmation__subtitle">
          Your order has been placed and the farmer has been notified.
        </p>

        {/* Order ID for reference */}
        <div className="confirmation__order-id">
          <span>Order ID:</span>
          <code>{orderId}</code>
        </div>

        <p className="confirmation__note">
          The farmer will confirm your order shortly. You'll be able to
          track your order status from your dashboard.
        </p>

        {/* Actions */}
        <div className="confirmation__actions">
          <Link to="/dashboard" className="confirmation__btn">
            View my orders
          </Link>
          <Link to="/browse" className="confirmation__btn confirmation__btn--outline">
            Browse more farms
          </Link>
        </div>

      </div>
    </div>
  );
};

export default OrderConfirmation;
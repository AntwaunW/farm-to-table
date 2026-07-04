// ConfirmAddToCartModal — shows the chosen quantity before it's actually added to the cart
// Lets the consumer go Back and adjust the amount if they picked the wrong one,
// instead of only finding out after it's already in the cart

import './ConfirmAddToCartModal.scss';

const ConfirmAddToCartModal = ({ title, quantity, unit, onBack, onConfirm }) => {
  return (
    <div className="confirm-add-modal" role="dialog" aria-modal="true" aria-label="Confirm quantity">
      {/* Clicking the backdrop acts like Back — nothing is added until the consumer confirms */}
      <div className="confirm-add-modal__backdrop" onClick={onBack} />

      <div className="confirm-add-modal__box">
        <p className="confirm-add-modal__message">
          Add <strong>{quantity} {unit}(s)</strong> of <strong>{title}</strong> to your cart?
        </p>

        <div className="confirm-add-modal__actions">
          <button
            className="confirm-add-modal__back-btn"
            onClick={onBack}
            type="button"
          >
            ← Back
          </button>
          <button
            className="confirm-add-modal__confirm-btn"
            onClick={onConfirm}
            type="button"
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmAddToCartModal;

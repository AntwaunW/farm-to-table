// OrderProgress — shows the consumer where their order is in the farmer's fulfillment
// pipeline (confirmed → preparing → completed) instead of just a plain status word,
// so "pending" doesn't feel like the order is stuck once payment has gone through

import './OrderProgress.scss';

const STEPS = [
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'ready', label: 'Preparing' },
  { key: 'completed', label: 'Completed' },
];

const OrderProgress = ({ status }) => {
  if (status === 'cancelled') {
    return <p className="order-progress order-progress--cancelled">This order was cancelled.</p>;
  }

  // 'pending' (awaiting payment) matches no step, so everything shows as not-yet-reached
  const currentIndex = STEPS.findIndex((step) => step.key === status);

  return (
    <div className="order-progress">
      {STEPS.map((step, index) => (
        <div
          key={step.key}
          className={`order-progress__step ${index <= currentIndex ? 'order-progress__step--done' : ''}`}
        >
          <span className="order-progress__dot" />
          <span className="order-progress__label">{step.label}</span>
        </div>
      ))}
    </div>
  );
};

export default OrderProgress;

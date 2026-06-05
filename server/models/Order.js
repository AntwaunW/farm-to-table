// Order model — represents a consumer's purchase from a single farm
//
// Fee structure: platform takes 4% of totalAmount, farmer receives the remaining 96%
// Payment flow: order is created (unpaid) → Stripe payment intent created →
//               Stripe webhook fires on success → paymentStatus set to 'paid', status to 'confirmed'
//
// Item data (title, price, unit) is snapshotted at order time so the order
// remains accurate even if the farmer later edits or deletes the listing

const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  // The consumer who placed the order
  consumer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // The farm this order was placed with
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: true,
  },
  // Line items — each item is a snapshot of the listing at the time of purchase
  items: [
    {
      listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true,
      },
      title: { type: String, required: true },
      pricePerUnit: { type: Number, required: true },
      unit: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1 },
      subtotal: { type: Number, required: true }, // pricePerUnit * quantity
    },
  ],
  // Sum of all item subtotals
  totalAmount: {
    type: Number,
    required: true,
  },
  // 4% of totalAmount — kept in the DB for accounting purposes
  platformFee: {
    type: Number,
    required: true,
  },
  // totalAmount - platformFee — what the farmer receives
  farmerPayout: {
    type: Number,
    required: true,
  },
  // Tracks where the order is in the fulfillment lifecycle
  // pending → confirmed (payment success) → ready (farmer packaged it) → completed / cancelled
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'ready', 'completed', 'cancelled'],
    default: 'pending',
  },
  // Tracks payment state — updated via Stripe webhook, not directly by the client
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid',
  },
  // Stripe payment intent ID — used to look up or refund the payment if needed
  stripePaymentIntentId: {
    type: String,
  },
  pickupOrDelivery: {
    type: String,
    enum: ['pickup', 'delivery'],
    default: 'pickup',
  },
  // When the consumer wants to pick up or expects delivery
  pickupDate: {
    type: Date,
  },
  // Optional message from the consumer to the farmer (special requests, etc.)
  notes: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Order', OrderSchema);

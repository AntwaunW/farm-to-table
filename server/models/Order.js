const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  consumer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: true,
  },
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
      subtotal: { type: Number, required: true },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  platformFee: {
    type: Number,
    required: true,
  },
  farmerPayout: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'ready', 'completed', 'cancelled'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid',
  },
  stripePaymentIntentId: {
    type: String,
  },
  pickupOrDelivery: {
    type: String,
    enum: ['pickup', 'delivery'],
    default: 'pickup',
  },
  pickupDate: {
    type: Date,
  },
  notes: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Order', OrderSchema);
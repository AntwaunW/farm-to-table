// Review model — stores consumer reviews for farms
// A review can only be left once per completed order
// This prevents the same consumer from reviewing the same farm twice

const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  // Which farm is being reviewed
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: true,
  },
  // Who left the review
  consumer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // The order that proves this consumer actually bought from this farm
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  // Star rating 1-5
  rating: {
    type: Number,
    required: [true, 'Please add a rating'],
    min: 1,
    max: 5,
  },
  // Written review
  comment: {
    type: String,
    required: [true, 'Please add a comment'],
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// -------------------------------------------------------------------
// 🎓 WHAT IS A COMPOUND INDEX?
// This ensures a consumer can only leave ONE review per order.
// Think of it like a unique constraint — if you try to insert
// a second review with the same consumer AND order combination
// MongoDB will reject it automatically.
//
// Without this a consumer could spam reviews for the same farm.
// -------------------------------------------------------------------
ReviewSchema.index({ consumer: 1, order: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
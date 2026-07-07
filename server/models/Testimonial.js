// Testimonial model — a farmer's quote about their experience on the
// platform, shown in the rotating carousel on the home page.
//
// This is distinct from Review: a Review is a consumer rating a specific
// farm after an order; a Testimonial is a farmer endorsing the platform
// itself. One per farmer (submitting again edits the existing one).
//
// farmerName/farmName are snapshotted at submit time — same reasoning as
// Order.items snapshotting listing title/price — so the public carousel
// needs no populate and stays correct even if the farmer later renames
// their farm.

const mongoose = require('mongoose');

const TestimonialSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  farmerName: {
    type: String,
    required: true,
  },
  farmName: {
    type: String,
    required: true,
  },
  quote: {
    type: String,
    required: [true, 'Please add a quote'],
    trim: true,
    maxlength: [400, 'Quote cannot exceed 400 characters'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Testimonial', TestimonialSchema);

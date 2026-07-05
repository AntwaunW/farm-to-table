// Farm model — represents a farmer's public farm profile
// Each farmer can only have one farm (enforced in the farms route)
// Farms are soft-deleted by setting isActive to false instead of removing the document

const mongoose = require('mongoose');

const FarmSchema = new mongoose.Schema({
  // The farmer (User) who owns and manages this farm
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  farmName: {
    type: String,
    required: [true, 'Please add a farm name'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  location: {
    // Optional so existing farms created before this field existed don't fail
    // validation — used to build a "Get directions" link for pickup orders
    street: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
  },
  // Array of image URLs (e.g. uploaded to cloud storage)
  photos: [{ type: String }],
  // What types of products this farm sells — used for browse/filter
  category: [{
    type: String,
    enum: ['beef', 'produce', 'dairy', 'eggs', 'honey', 'pork', 'lamb', 'poultry', 'other'],
  }],
  // Subscription tier controls feature access (e.g. featured placement, analytics)
  subscriptionTier: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free',
  },
  // Average rating from consumer reviews — null until at least one review exists
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  // When false, the farm is hidden from public listings (soft delete)
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Farm', FarmSchema);

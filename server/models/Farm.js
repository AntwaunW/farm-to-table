const mongoose = require('mongoose');

const FarmSchema = new mongoose.Schema({
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
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
  },
  photos: [{ type: String }],
  category: [{
    type: String,
    enum: ['beef', 'produce', 'dairy', 'eggs', 'honey', 'pork', 'lamb', 'poultry', 'other'],
  }],
  subscriptionTier: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free',
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
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
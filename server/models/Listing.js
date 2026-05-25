const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema({
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  category: {
    type: String,
    enum: ['beef', 'produce', 'dairy', 'eggs', 'honey', 'pork', 'lamb', 'poultry', 'other'],
    required: [true, 'Please select a category'],
  },
  pricePerUnit: {
    type: Number,
    required: [true, 'Please add a price'],
    min: 0,
  },
  unit: {
    type: String,
    enum: ['lb', 'dozen', 'bundle', 'whole', 'quarter', 'half', 'each', 'gallon'],
    required: [true, 'Please select a unit'],
  },
  quantityAvailable: {
    type: Number,
    required: [true, 'Please add available quantity'],
    min: 0,
  },
  photos: [{ type: String }],
  harvestDate: {
    type: Date,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Listing', ListingSchema);
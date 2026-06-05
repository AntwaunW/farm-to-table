// Listing model — represents a product a farmer is selling
// Belongs to a Farm and tracks available inventory
// quantityAvailable is decremented when an order is placed

const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema({
  // The farm this product is being sold from
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: true,
  },
  // The farmer user who created this listing
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
  // The unit of measure for one pricePerUnit (e.g. $12/lb, $5/dozen)
  unit: {
    type: String,
    enum: ['lb', 'dozen', 'bundle', 'whole', 'quarter', 'half', 'each', 'gallon'],
    required: [true, 'Please select a unit'],
  },
  // How many units are currently in stock — decremented on order, never goes below 0
  quantityAvailable: {
    type: Number,
    required: [true, 'Please add available quantity'],
    min: 0,
  },
  // Array of image URLs
  photos: [{ type: String }],
  // Optional field — lets buyers know how fresh the product is
  harvestDate: {
    type: Date,
  },
  // When false, the listing is hidden from browse but not deleted (soft delete)
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

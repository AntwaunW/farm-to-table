const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const Farm = require('../models/Farm');
const { protect, authorizeRoles } = require('../middleware/auth');

// @route   GET /api/listings
// @desc    Get all listings
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, unit } = req.query;
    let query = { isAvailable: true };

    if (category) query.category = category;
    if (unit) query.unit = unit;
    if (minPrice || maxPrice) {
      query.pricePerUnit = {};
      if (minPrice) query.pricePerUnit.$gte = Number(minPrice);
      if (maxPrice) query.pricePerUnit.$lte = Number(maxPrice);
    }

    const listings = await Listing.find(query)
      .populate('farm', 'farmName location rating')
      .populate('owner', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: listings.length, listings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/listings/:id
// @desc    Get single listing
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('farm', 'farmName location rating photos description')
      .populate('owner', 'name email');

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.status(200).json({ success: true, listing });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/listings/farm/:farmId
// @desc    Get all listings for a specific farm
// @access  Public
router.get('/farm/:farmId', async (req, res) => {
  try {
    const listings = await Listing.find({
      farm: req.params.farmId,
      isAvailable: true,
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: listings.length, listings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/listings
// @desc    Create a listing
// @access  Private (farmers only)
router.post('/', protect, authorizeRoles('farmer'), async (req, res) => {
  try {
    const { title, description, category, pricePerUnit, unit, quantityAvailable, harvestDate } = req.body;

    // Find the farmer's farm
    const farm = await Farm.findOne({ owner: req.user.id });
    if (!farm) {
      return res.status(404).json({ message: 'You must create a farm profile before adding listings' });
    }

    const listing = await Listing.create({
      farm: farm._id,
      owner: req.user.id,
      title,
      description,
      category,
      pricePerUnit,
      unit,
      quantityAvailable,
      harvestDate,
    });

    res.status(201).json({ success: true, listing });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/listings/:id
// @desc    Update a listing
// @access  Private (listing owner only)
router.put('/:id', protect, authorizeRoles('farmer'), async (req, res) => {
  try {
    let listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (listing.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this listing' });
    }

    listing = await Listing.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, listing });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/listings/:id
// @desc    Delete a listing
// @access  Private (listing owner only)
router.delete('/:id', protect, authorizeRoles('farmer'), async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (listing.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this listing' });
    }

    await Listing.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Listing deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
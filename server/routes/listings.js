// Listing routes — CRUD for farm product listings
// Public: GET all listings, GET single listing, GET listings by farm
// Private (farmer only): POST create, PUT update, DELETE remove

const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const Farm = require('../models/Farm');
const { protect, authorizeRoles } = require('../middleware/auth');

// @route   GET /api/listings
// @desc    Get all available listings — supports filtering by category, price range, and unit
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, unit } = req.query;

    // Only return listings that are currently available
    let query = { isAvailable: true };

    // Apply optional query filters
    if (category) query.category = category;
    if (unit) query.unit = unit;
    if (minPrice || maxPrice) {
      query.pricePerUnit = {};
      if (minPrice) query.pricePerUnit.$gte = Number(minPrice);
      if (maxPrice) query.pricePerUnit.$lte = Number(maxPrice);
    }

    const listings = await Listing.find(query)
      .populate('farm', 'farmName location rating') // Attach farm details consumers care about
      .populate('owner', 'name')
      .sort({ createdAt: -1 }); // Newest listings first

    res.status(200).json({ success: true, count: listings.length, listings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/listings/my
// @desc    Get ALL listings owned by the logged-in farmer — including unavailable ones
//          Used on the farmer's "My Listings" management page so they can see and edit everything
// @access  Private (farmers only)
// NOTE: Must be defined before /:id so "my" is not treated as a MongoDB ObjectId
router.get('/my', protect, authorizeRoles('farmer'), async (req, res) => {
  try {
    const listings = await Listing.find({ owner: req.user.id })
      .sort({ createdAt: -1 }); // newest first

    res.json({ success: true, count: listings.length, listings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/listings/farm/:farmId
// @desc    Get all available listings for a specific farm (used on the farm profile page)
// @access  Public
// NOTE: This route MUST be defined before /:id — Express matches routes top-to-bottom,
// so if /:id comes first, "farm" gets treated as an ID and causes a CastError.
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

// @route   GET /api/listings/:id
// @desc    Get a single listing by ID
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

// @route   POST /api/listings
// @desc    Create a new product listing under the farmer's farm
// @access  Private (farmers only)
router.post('/', protect, authorizeRoles('farmer'), async (req, res) => {
  try {
    const { title, description, category, pricePerUnit, unit, quantityAvailable, harvestDate, photos } = req.body;

    // A farmer must have a farm profile before they can create listings
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
      photos,
    });

    res.status(201).json({ success: true, listing });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/listings/:id
// @desc    Update a listing's details
// @access  Private (listing owner only)
router.put('/:id', protect, authorizeRoles('farmer'), async (req, res) => {
  try {
    let listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Only the farmer who created the listing can edit it
    if (listing.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this listing' });
    }

    listing = await Listing.findByIdAndUpdate(req.params.id, req.body, {
      new: true,           // Return the updated document
      runValidators: true, // Run schema validators on the updated fields
    });

    res.status(200).json({ success: true, listing });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/listings/:id
// @desc    Permanently delete a listing
// @access  Private (listing owner only)
router.delete('/:id', protect, authorizeRoles('farmer'), async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Only the farmer who created the listing can delete it
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

// Farm routes — CRUD for farm profiles
// Public: GET all farms, GET single farm
// Private (farmer only): POST create, PUT update, DELETE deactivate

const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');
const { protect, authorizeRoles } = require('../middleware/auth');

// @route   GET /api/farms
// @desc    Get all active farms — supports filtering by category, city, and state
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, city, state } = req.query;

    // Only return active farms (isActive: true excludes soft-deleted farms)
    let query = { isActive: true };

    // Apply optional query filters
    if (category) query.category = category;
    if (city) query['location.city'] = new RegExp(city, 'i');   // case-insensitive
    if (state) query['location.state'] = new RegExp(state, 'i');

    const farms = await Farm.find(query)
      .populate('owner', 'name email') // Attach owner name and email to each farm
      .sort({ createdAt: -1 });        // Newest farms first

    res.status(200).json({ success: true, count: farms.length, farms });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/farms/:id
// @desc    Get a single farm by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id)
      .populate('owner', 'name email');

    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    res.status(200).json({ success: true, farm });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/farms
// @desc    Create a new farm profile for the logged-in farmer
// @access  Private (farmers only)
router.post('/', protect, authorizeRoles('farmer'), async (req, res) => {
  try {
    const { farmName, description, location, category } = req.body;

    // Enforce the one-farm-per-farmer rule
    const existingFarm = await Farm.findOne({ owner: req.user.id });
    if (existingFarm) {
      return res.status(400).json({ message: 'You already have a farm profile' });
    }

    const farm = await Farm.create({
      owner: req.user.id,
      farmName,
      description,
      location,
      category,
    });

    res.status(201).json({ success: true, farm });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/farms/:id
// @desc    Update a farm's details
// @access  Private (farm owner only)
router.put('/:id', protect, authorizeRoles('farmer'), async (req, res) => {
  try {
    let farm = await Farm.findById(req.params.id);

    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    // Make sure only the farm's owner can edit it
    if (farm.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this farm' });
    }

    farm = await Farm.findByIdAndUpdate(req.params.id, req.body, {
      new: true,           // Return the updated document
      runValidators: true, // Run schema validators on the updated fields
    });

    res.status(200).json({ success: true, farm });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/farms/:id
// @desc    Deactivate a farm (soft delete — sets isActive to false)
// @access  Private (farm owner only)
router.delete('/:id', protect, authorizeRoles('farmer'), async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id);

    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    // Make sure only the farm's owner can deactivate it
    if (farm.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this farm' });
    }

    // Soft delete — the farm document stays in the DB but won't appear in public listings
    await Farm.findByIdAndUpdate(req.params.id, { isActive: false });

    res.status(200).json({ success: true, message: 'Farm deactivated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/farms/:id/photos
// @desc    Add one photo URL to this farm's gallery (photos array)
//          The URL comes from Cloudinary after the frontend uploads it
//          via the /api/upload route — we just store the resulting URL here
// @access  Private (farm owner only)
router.post('/:id/photos', protect, authorizeRoles('farmer'), async (req, res) => {
  try {
    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({ message: 'Photo URL is required' });
    }

    const farm = await Farm.findById(req.params.id);

    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    // Only the farm's owner can add photos
    if (farm.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Cap the gallery at 12 photos so Cloudinary storage stays reasonable
    if (farm.photos.length >= 12) {
      return res.status(400).json({ message: 'Gallery limit of 12 photos reached' });
    }

    farm.photos.push(photoUrl);
    await farm.save();

    res.json({ success: true, photos: farm.photos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/farms/:id/photos
// @desc    Remove a specific photo URL from this farm's gallery
//          The client sends the URL to remove in the request body
// @access  Private (farm owner only)
router.delete('/:id/photos', protect, authorizeRoles('farmer'), async (req, res) => {
  try {
    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({ message: 'Photo URL is required' });
    }

    const farm = await Farm.findById(req.params.id);

    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    // Only the farm's owner can remove photos
    if (farm.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Filter out the URL to remove — this handles duplicates too
    farm.photos = farm.photos.filter((p) => p !== photoUrl);
    await farm.save();

    res.json({ success: true, photos: farm.photos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

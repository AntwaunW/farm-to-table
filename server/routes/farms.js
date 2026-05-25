const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');
const { protect, authorizeRoles } = require('../middleware/auth');

// @route   GET /api/farms
// @desc    Get all farms
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, city, state } = req.query;
    let query = { isActive: true };

    if (category) query.category = category;
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (state) query['location.state'] = new RegExp(state, 'i');

    const farms = await Farm.find(query)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: farms.length, farms });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/farms/:id
// @desc    Get single farm
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
// @desc    Create a farm
// @access  Private (farmers only)
router.post('/', protect, authorizeRoles('farmer'), async (req, res) => {
  try {
    const { farmName, description, location, category } = req.body;

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
// @desc    Update a farm
// @access  Private (farm owner only)
router.put('/:id', protect, authorizeRoles('farmer'), async (req, res) => {
  try {
    let farm = await Farm.findById(req.params.id);

    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    if (farm.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this farm' });
    }

    farm = await Farm.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, farm });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/farms/:id
// @desc    Deactivate a farm
// @access  Private (farm owner only)
router.delete('/:id', protect, authorizeRoles('farmer'), async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id);

    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    if (farm.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this farm' });
    }

    await Farm.findByIdAndUpdate(req.params.id, { isActive: false });

    res.status(200).json({ success: true, message: 'Farm deactivated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
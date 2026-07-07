// Testimonial routes — farmers leaving a quote about their experience on
// the platform, shown in the home page carousel
//
// One testimonial per farmer: POST is an upsert, so submitting again edits
// the existing one instead of creating a second

const express = require('express');
const router = express.Router();
const Testimonial = require('../models/Testimonial');
const Farm = require('../models/Farm');
const { protect, authorizeRoles } = require('../middleware/auth');

// @route   GET /api/testimonials
// @desc    Get all testimonials, newest first — public carousel feed
// @access  Public
router.get('/', async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: testimonials.length, testimonials });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/testimonials/me
// @desc    Get the logged-in farmer's own testimonial, if they have one
// @access  Private (farmers only)
router.get('/me', protect, authorizeRoles('farmer'), async (req, res) => {
  try {
    const testimonial = await Testimonial.findOne({ farmer: req.user.id });
    res.status(200).json({ success: true, testimonial });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/testimonials
// @desc    Create or update the logged-in farmer's testimonial
// @access  Private (farmers only)
router.post('/', protect, authorizeRoles('farmer'), async (req, res) => {
  try {
    const { quote } = req.body;

    if (!quote?.trim()) {
      return res.status(400).json({ message: 'Please add a quote' });
    }

    const farm = await Farm.findOne({ owner: req.user.id });
    if (!farm) {
      return res.status(404).json({ message: 'Create your farm profile before leaving a testimonial' });
    }

    const testimonial = await Testimonial.findOneAndUpdate(
      { farmer: req.user.id },
      { farmer: req.user.id, farmerName: req.user.name, farmName: farm.farmName, quote },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({ success: true, testimonial });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

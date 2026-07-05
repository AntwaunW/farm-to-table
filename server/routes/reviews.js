// Reviews routes — create and read farm reviews
// Only consumers with completed orders can leave reviews

const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const Farm = require('../models/Farm');
const { protect, authorizeRoles } = require('../middleware/auth');

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private (consumers only)
router.post('/', protect, authorizeRoles('consumer'), async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;

    // -------------------------------------------------------------------
    // 🎓 WHY DO WE FETCH THE ORDER FIRST?
    // We need to verify three things before allowing a review:
    // 1. The order exists
    // 2. The order belongs to this consumer
    // 3. The order status is 'completed'
    //
    // This is called SERVER SIDE VALIDATION — even if someone
    // bypasses our frontend checks we verify on the backend too.
    // Never trust the frontend alone for important business rules.
    // -------------------------------------------------------------------
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Make sure this order belongs to the logged in consumer
    if (!order.consumer || order.consumer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to review this order' });
    }

    // Make sure the order is completed
    if (order.status !== 'completed') {
      return res.status(400).json({
        message: 'You can only review completed orders'
      });
    }

    // Create the review
    const review = await Review.create({
      farm: order.farm,
      consumer: req.user.id,
      order: orderId,
      rating,
      comment,
    });

    // -------------------------------------------------------------------
    // 🎓 UPDATING THE FARM RATING
    // After a new review is created we recalculate the farm's
    // average rating by looking at ALL reviews for that farm.
    //
    // aggregate() is a powerful MongoDB tool that can perform
    // calculations across multiple documents.
    // $avg calculates the average of all rating values.
    // Math.round rounds to 1 decimal place.
    // -------------------------------------------------------------------
    const stats = await Review.aggregate([
      { $match: { farm: order.farm } },
      { $group: { _id: '$farm', avgRating: { $avg: '$rating' } } },
    ]);

    if (stats.length > 0) {
      await Farm.findByIdAndUpdate(order.farm, {
        rating: Math.round(stats[0].avgRating * 10) / 10,
      });
    }

    res.status(201).json({ success: true, review });
  } catch (error) {
    // Handle duplicate review error
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'You have already reviewed this order'
      });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reviews/farm/:farmId
// @desc    Get all reviews for a specific farm
// @access  Public
router.get('/farm/:farmId', async (req, res) => {
  try {
    const reviews = await Review.find({ farm: req.params.farmId })
      .populate('consumer', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reviews/consumer/me
// @desc    Get all reviews the logged-in consumer has left
// @access  Private (consumers only)
router.get('/consumer/me', protect, authorizeRoles('consumer'), async (req, res) => {
  try {
    const reviews = await Review.find({ consumer: req.user.id })
      .populate('farm', 'farmName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reviews/can-review/:orderId
// @desc    Check if a consumer can review a specific order
// @access  Private (consumers only)
router.get('/can-review/:orderId', protect, authorizeRoles('consumer'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ canReview: false });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({
      consumer: req.user.id,
      order: req.params.orderId,
    });

    const canReview =
      order.status === 'completed' &&
      !!order.consumer &&
      order.consumer.toString() === req.user.id &&
      !existingReview;

    res.status(200).json({ canReview });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
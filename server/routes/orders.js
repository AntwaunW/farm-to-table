const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Listing = require('../models/Listing');
const { protect, authorizeRoles } = require('../middleware/auth');

// @route   POST /api/orders
// @desc    Place an order
// @access  Private (consumers only)
router.post('/', protect, authorizeRoles('consumer'), async (req, res) => {
  try {
    const { farmId, items, pickupOrDelivery, pickupDate, notes } = req.body;

    // Build order items and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const listing = await Listing.findById(item.listingId);

      if (!listing) {
        return res.status(404).json({ message: `Listing ${item.listingId} not found` });
      }

      if (!listing.isAvailable) {
        return res.status(400).json({ message: `${listing.title} is no longer available` });
      }

      if (listing.quantityAvailable < item.quantity) {
        return res.status(400).json({ message: `Not enough quantity available for ${listing.title}` });
      }

      const subtotal = listing.pricePerUnit * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        listing: listing._id,
        title: listing.title,
        pricePerUnit: listing.pricePerUnit,
        unit: listing.unit,
        quantity: item.quantity,
        subtotal,
      });
    }

    // Calculate platform fee and farmer payout
    const platformFee = parseFloat((totalAmount * 0.04).toFixed(2));
    const farmerPayout = parseFloat((totalAmount - platformFee).toFixed(2));

    // Create the order
    const order = await Order.create({
      consumer: req.user.id,
      farm: farmId,
      items: orderItems,
      totalAmount,
      platformFee,
      farmerPayout,
      pickupOrDelivery: pickupOrDelivery || 'pickup',
      pickupDate,
      notes,
    });

    // Update listing quantity
    for (const item of items) {
      await Listing.findByIdAndUpdate(item.listingId, {
        $inc: { quantityAvailable: -item.quantity },
      });
    }

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/consumer/me
// @desc    Get all orders for logged in consumer
// @access  Private (consumers only)
router.get('/consumer/me', protect, authorizeRoles('consumer'), async (req, res) => {
  try {
    const orders = await Order.find({ consumer: req.user.id })
      .populate('farm', 'farmName location')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/farm/me
// @desc    Get all orders for logged in farmer
// @access  Private (farmers only)
router.get('/farm/me', protect, authorizeRoles('farmer'), async (req, res) => {
  try {
    const Farm = require('../models/Farm');
    const farm = await Farm.findOne({ owner: req.user.id });

    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    const orders = await Order.find({ farm: farm._id })
      .populate('consumer', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private (order owner or farmer)
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('farm', 'farmName location')
      .populate('consumer', 'name email')
      .populate('items.listing', 'title photos');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Make sure only the consumer or farmer can see the order
    const Farm = require('../models/Farm');
    const farm = await Farm.findById(order.farm);

    if (
      order.consumer._id.toString() !== req.user.id &&
      farm.owner.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private (farmers only)
router.put('/:id/status', protect, authorizeRoles('farmer'), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['confirmed', 'ready', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify the farmer owns the farm this order belongs to
    const Farm = require('../models/Farm');
    const farm = await Farm.findById(order.farm);

    if (farm.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    order.status = status;
    await order.save();

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
// Order routes — placement and management of consumer orders
//
// Flow: consumer places order → order created with status 'pending' and paymentStatus 'unpaid'
//       → consumer pays via Stripe → webhook updates to 'confirmed' / 'paid'
//       → farmer updates status through 'ready' → 'completed'
//
// Platform fee: 4% of totalAmount is calculated here and stored on the order

const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Listing = require('../models/Listing');
const { protect, authorizeRoles } = require('../middleware/auth');
const { sendOrderConfirmation, sendNewOrderAlert } = require('../utils/email');
const User = require('../models/User');
const Farm = require('../models/Farm');

// @route   POST /api/orders
// @desc    Place a new order — validates inventory, calculates totals, and creates the order
// @access  Private (consumers only)
router.post('/', protect, authorizeRoles('consumer'), async (req, res) => {
  try {
    const { farmId, items, pickupOrDelivery, pickupDate, notes } = req.body;

    let totalAmount = 0;
    const orderItems = [];

    // Validate each item in the cart and build the order items array
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

      // Snapshot listing data into the order so it's preserved even if the listing changes later
      orderItems.push({
        listing: listing._id,
        title: listing.title,
        pricePerUnit: listing.pricePerUnit,
        unit: listing.unit,
        quantity: item.quantity,
        subtotal,
      });
    }

    // Send emails to consumer and farmer
try {
  const farmer = await User.findById(farm.owner);
  sendOrderConfirmation(order, req.user);
  sendNewOrderAlert(order, farmer, farm);
} catch (emailErr) {
  console.error('Email notification failed:', emailErr);
}

    // Calculate the 4% platform fee and what the farmer receives after the fee
    const platformFee = parseFloat((totalAmount * 0.04).toFixed(2));
    const farmerPayout = parseFloat((totalAmount - platformFee).toFixed(2));

    // Get the farm for email notifications
    const Farm = require('../models/Farm');
    const farm = await Farm.findById(farmId);

    // Create the order document — paymentStatus starts as 'unpaid' until Stripe webhook fires
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

    // Decrement inventory for each item so it's not double-sold
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
// @desc    Get all orders placed by the logged-in consumer
// @access  Private (consumers only)
router.get('/consumer/me', protect, authorizeRoles('consumer'), async (req, res) => {
  try {
    const orders = await Order.find({ consumer: req.user.id })
      .populate('farm', 'farmName location')
      .sort({ createdAt: -1 }); // Most recent orders first

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/farm/me
// @desc    Get all orders received by the logged-in farmer's farm
// @access  Private (farmers only)
router.get('/farm/me', protect, authorizeRoles('farmer'), async (req, res) => {
  try {
    // Look up the farmer's farm first so we can query orders by farm ID
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
// @desc    Get a single order — only accessible by the consumer who placed it or the farmer who received it
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('farm', 'farmName location')
      .populate('consumer', 'name email')
      .populate('items.listing', 'title photos');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Fetch the farm to check if the logged-in user is its owner
    const Farm = require('../models/Farm');
    const farm = await Farm.findById(order.farm);

    // Only the consumer who placed the order or the farmer who owns the farm can view it
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
// @desc    Update the fulfillment status of an order (farmer moves it through the pipeline)
// @access  Private (farmers only)
router.put('/:id/status', protect, authorizeRoles('farmer'), async (req, res) => {
  try {
    const { status } = req.body;

    // Farmers can only move orders to these statuses — 'pending' is set at creation, 'paid' via webhook
    const validStatuses = ['confirmed', 'ready', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Make sure only the farmer who owns the farm can update this order's status
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

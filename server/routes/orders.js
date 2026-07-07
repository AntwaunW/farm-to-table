// Order routes — placement and management of consumer orders
//
// Flow: consumer places order → order created with status 'pending' and paymentStatus 'unpaid'
//       → consumer pays via Stripe → webhook updates to 'confirmed' / 'paid'
//       → farmer updates status through 'ready' → 'completed'
//
// Platform fee: 4% of the item subtotal is calculated here and stored on the order
// Delivery fee: a flat fee added on top for delivery orders — the farmer keeps it in full
// since it covers their driving time, while pickup orders have no such fee

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const Listing = require('../models/Listing');
const { protect, authorizeRoles } = require('../middleware/auth');
const { sendOrderConfirmation, sendNewOrderAlert } = require('../utils/email');
const User = require('../models/User');
const Farm = require('../models/Farm');

const DELIVERY_FEE = 5.99;

// Quick-sale order IDs are shared as a public link/QR code, and Mongo ObjectIds
// aren't a strong secret (embedded timestamp, sequential counter) — this app has
// no rate limiting anywhere else, so without this the "physical presence is the
// authorization" trust model for in-person sales could be undermined by someone
// scraping/guessing recently-created order IDs
const quickSaleLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

// Gives back inventory that was already claimed when a later step in order
// placement fails, so a rejected order never leaves stock short
const rollbackDecrements = async (decremented) => {
  for (const { listingId, quantity } of decremented) {
    await Listing.findByIdAndUpdate(listingId, { $inc: { quantityAvailable: quantity } });
  }
};

// Cancels an order: restores the inventory it had claimed, auto-refunds via Stripe
// if it was already paid, and saves it as cancelled. Shared between the farmer's
// manual cancel action and the scheduled sweep that expires abandoned quick sales.
const cancelOrder = async (order) => {
  for (const item of order.items) {
    await Listing.findByIdAndUpdate(item.listing, {
      $inc: { quantityAvailable: item.quantity },
    });
  }

  if (order.paymentStatus === 'paid' && order.stripePaymentIntentId) {
    try {
      await stripe.refunds.create({ payment_intent: order.stripePaymentIntentId });
      order.paymentStatus = 'refunded';
    } catch (refundErr) {
      // Don't block the cancellation on a refund failure — log it so it can be
      // handled manually, since the order still needs to be cancelled either way
      console.error('Refund failed for order', order._id.toString(), refundErr);
    }
  }

  order.status = 'cancelled';
  await order.save();
};

// If a farmer starts a quick sale and the customer never scans/pays (walks away,
// changes their mind, phone dies), the reserved inventory would otherwise be
// stuck forever unless the farmer remembers to cancel it manually. There's no
// cron/TTL infrastructure anywhere in this app, so a simple interval is enough
// at this scale — sweep away anything that's been sitting unclaimed too long.
const QUICK_SALE_EXPIRY_MS = 45 * 60 * 1000; // 45 minutes

const expireStaleQuickSales = async () => {
  try {
    const staleOrders = await Order.find({
      pickupOrDelivery: 'in-person',
      status: 'pending',
      consumer: { $exists: false },
      createdAt: { $lt: new Date(Date.now() - QUICK_SALE_EXPIRY_MS) },
    });

    for (const order of staleOrders) {
      await cancelOrder(order);
      console.log(`Expired abandoned quick sale ${order._id.toString()}`);
    }
  } catch (error) {
    console.error('Quick sale expiry sweep failed:', error);
  }
};

// Called once from server.js after the app starts listening
const startQuickSaleExpirySweep = () => {
  setInterval(expireStaleQuickSales, 5 * 60 * 1000); // check every 5 minutes
};

// @route   POST /api/orders
// @desc    Place a new order — validates inventory, calculates totals, and creates the order
// @access  Private (consumers only)
router.post('/', protect, authorizeRoles('consumer'), async (req, res) => {
  try {
    const { farmId, items, pickupOrDelivery, pickupDate, deliveryAddress, notes } = req.body;

    // Delivery orders need somewhere to deliver to
    if (pickupOrDelivery === 'delivery' && !deliveryAddress?.trim()) {
      return res.status(400).json({ message: 'Delivery address is required for delivery orders' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must include at least one item' });
    }

    // Reject bad quantities up front, before anything touches inventory
    for (const item of items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return res.status(400).json({ message: 'Item quantity must be a positive whole number' });
      }
    }

    const farm = await Farm.findById(farmId);
    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    // Seed/demo farms are shown to illustrate the app to farmers — never
    // allow a real order (and therefore a real Stripe charge) against one
    if (farm.isSeed) {
      return res.status(403).json({ message: 'This is demo data for illustration purposes and cannot be purchased.' });
    }

    let itemsTotal = 0;
    const orderItems = [];
    const decremented = [];

    for (const item of items) {
      const listing = await Listing.findById(item.listingId);

      if (!listing) {
        await rollbackDecrements(decremented);
        return res.status(404).json({ message: `Listing ${item.listingId} not found` });
      }

      if (!listing.isAvailable) {
        await rollbackDecrements(decremented);
        return res.status(400).json({ message: `${listing.title} is no longer available` });
      }

      if (listing.farm.toString() !== farmId) {
        await rollbackDecrements(decremented);
        return res.status(400).json({ message: `${listing.title} does not belong to this farm` });
      }

      // Atomically claim inventory — the $gte guard means this fails instead of going
      // negative if another order already took the last units out from under us
      const updatedListing = await Listing.findOneAndUpdate(
        { _id: item.listingId, quantityAvailable: { $gte: item.quantity } },
        { $inc: { quantityAvailable: -item.quantity } },
        { new: true }
      );

      if (!updatedListing) {
        await rollbackDecrements(decremented);
        return res.status(400).json({ message: `Not enough quantity available for ${listing.title}` });
      }

      decremented.push({ listingId: item.listingId, quantity: item.quantity });

      const subtotal = listing.pricePerUnit * item.quantity;
      itemsTotal += subtotal;

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

    // Delivery orders carry a flat delivery fee on top of the items — pickup orders don't
    const deliveryFee = pickupOrDelivery === 'delivery' ? DELIVERY_FEE : 0;
    const totalAmount = parseFloat((itemsTotal + deliveryFee).toFixed(2));

    // Platform fee applies only to the item subtotal — the farmer keeps the full delivery fee
    const platformFee = parseFloat((itemsTotal * 0.04).toFixed(2));
    const farmerPayout = parseFloat((totalAmount - platformFee).toFixed(2));

    // Create the order document — paymentStatus starts as 'unpaid' until Stripe webhook fires
    let order;
    try {
      order = await Order.create({
        consumer: req.user.id,
        farm: farmId,
        items: orderItems,
        totalAmount,
        platformFee,
        deliveryFee,
        farmerPayout,
        pickupOrDelivery: pickupOrDelivery || 'pickup',
        pickupDate,
        deliveryAddress: pickupOrDelivery === 'delivery' ? deliveryAddress : undefined,
        notes,
      });
    } catch (createErr) {
      // Inventory was already claimed above — give it back since no order was actually placed
      await rollbackDecrements(decremented);
      throw createErr;
    }

    // Send emails to consumer and farmer
    try {
      const farmer = await User.findById(farm.owner);
      sendOrderConfirmation(order, req.user);
      sendNewOrderAlert(order, farmer, farm);
    } catch (emailErr) {
      console.error('Email notification failed:', emailErr);
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

    // Only the consumer who placed the order or the farmer who owns the farm can view it.
    // order.consumer can be null for an unclaimed quick-sale order.
    if (
      (!order.consumer || order.consumer._id.toString() !== req.user.id) &&
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
// @desc    Update the fulfillment status of an order. Farmers move it through the
//          pipeline (or cancel it at any point before completion). Consumers can only
//          cancel their own order, and only while it's still pending (unpaid/unconfirmed) —
//          once a farmer has started on it, the consumer has to go through the farmer.
// @access  Private (farmers and consumers)
router.put('/:id/status', protect, authorizeRoles('farmer', 'consumer'), async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.user.role === 'farmer') {
      // Make sure only the farmer who owns the farm can update this order's status
      const farm = await Farm.findById(order.farm);

      if (farm.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to update this order' });
      }

      const validStatuses = ['confirmed', 'ready', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      if (order.status === 'completed' || order.status === 'cancelled') {
        return res.status(400).json({ message: 'This order is already finalized' });
      }
    } else {
      // Consumers may only cancel their own order, and only while still pending.
      // order.consumer can be null for an unclaimed quick-sale order — that's
      // never "this consumer's own order," so it falls through to a clean 403.
      if (!order.consumer || order.consumer.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to update this order' });
      }

      if (status !== 'cancelled') {
        return res.status(400).json({ message: 'Consumers can only cancel an order' });
      }

      if (order.status !== 'pending') {
        return res.status(400).json({
          message: 'This order can no longer be cancelled — please contact the farmer',
        });
      }
    }

    if (status === 'cancelled' && order.status !== 'cancelled') {
      await cancelOrder(order);
    } else {
      order.status = status;
      await order.save();
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Quick Sale (in-person / farmers-market purchase) ──────────────────────────
// Flow: farmer builds a mini-order on their own device (no consumer attached yet)
// → shares a QR code / link built from the order's own ID → consumer opens it on
// their own phone, previews it, and claims it → consumer pays through the normal
// Checkout flow → payment success completes the order immediately (see payments.js)

// @route   POST /api/orders/quick-sale
// @desc    Farmer creates an in-person order for a walk-up customer — no consumer
//          is attached until the customer scans the resulting link and claims it
// @access  Private (farmers only)
router.post('/quick-sale', protect, authorizeRoles('farmer'), async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must include at least one item' });
    }

    for (const item of items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return res.status(400).json({ message: 'Item quantity must be a positive whole number' });
      }
    }

    // Always the farmer's own farm — never trust a client-supplied farmId here
    const farm = await Farm.findOne({ owner: req.user.id });
    if (!farm) {
      return res.status(404).json({ message: 'You must create a farm profile before making a sale' });
    }

    // Same demo-data guard as the normal order route — the seed farmer account
    // should never be able to run a real in-person sale against a walk-up customer
    if (farm.isSeed) {
      return res.status(403).json({ message: 'This is demo data for illustration purposes and cannot be purchased.' });
    }

    let itemsTotal = 0;
    const orderItems = [];
    const decremented = [];

    for (const item of items) {
      const listing = await Listing.findById(item.listingId);

      if (!listing) {
        await rollbackDecrements(decremented);
        return res.status(404).json({ message: `Listing ${item.listingId} not found` });
      }

      if (!listing.isAvailable) {
        await rollbackDecrements(decremented);
        return res.status(400).json({ message: `${listing.title} is no longer available` });
      }

      if (listing.farm.toString() !== farm._id.toString()) {
        await rollbackDecrements(decremented);
        return res.status(400).json({ message: `${listing.title} does not belong to your farm` });
      }

      // Same atomic claim as a normal order — reserves the stock immediately
      const updatedListing = await Listing.findOneAndUpdate(
        { _id: item.listingId, quantityAvailable: { $gte: item.quantity } },
        { $inc: { quantityAvailable: -item.quantity } },
        { new: true }
      );

      if (!updatedListing) {
        await rollbackDecrements(decremented);
        return res.status(400).json({ message: `Not enough quantity available for ${listing.title}` });
      }

      decremented.push({ listingId: item.listingId, quantity: item.quantity });

      const subtotal = listing.pricePerUnit * item.quantity;
      itemsTotal += subtotal;

      orderItems.push({
        listing: listing._id,
        title: listing.title,
        pricePerUnit: listing.pricePerUnit,
        unit: listing.unit,
        quantity: item.quantity,
        subtotal,
      });
    }

    // In-person sales have no delivery fee — the customer is standing right here
    const totalAmount = parseFloat(itemsTotal.toFixed(2));
    const platformFee = parseFloat((itemsTotal * 0.04).toFixed(2));
    const farmerPayout = parseFloat((totalAmount - platformFee).toFixed(2));

    let order;
    try {
      order = await Order.create({
        farm: farm._id,
        items: orderItems,
        totalAmount,
        platformFee,
        deliveryFee: 0,
        farmerPayout,
        pickupOrDelivery: 'in-person',
        // consumer intentionally left unset until claimed
      });
    } catch (createErr) {
      await rollbackDecrements(decremented);
      throw createErr;
    }

    // No emails yet — we don't know who the consumer is until they claim it
    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/quick-sale/:id
// @desc    Preview an unclaimed in-person order before a consumer commits to it
// @access  Private (consumers only)
router.get('/quick-sale/:id', quickSaleLimiter, protect, authorizeRoles('consumer'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('farm', 'farmName')
      .populate('items.listing', 'title photos');

    if (
      !order ||
      order.pickupOrDelivery !== 'in-person' ||
      order.status !== 'pending' ||
      order.consumer
    ) {
      return res.status(404).json({ message: 'This quick sale is no longer available' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/orders/quick-sale/:id/claim
// @desc    Consumer claims an in-person order so they can pay for it
// @access  Private (consumers only)
router.post('/quick-sale/:id/claim', quickSaleLimiter, protect, authorizeRoles('consumer'), async (req, res) => {
  try {
    // Atomic claim so only the first consumer wins if two people tap the link at
    // nearly the same time. The status:'pending' guard matters — without it, a
    // cancelled quick sale (inventory already restored) could be claimed and paid
    // against after the fact.
    const order = await Order.findOneAndUpdate(
      {
        _id: req.params.id,
        pickupOrDelivery: 'in-person',
        status: 'pending',
        consumer: { $exists: false },
      },
      { $set: { consumer: req.user.id } },
      { new: true }
    ).populate('farm', 'farmName');

    if (!order) {
      return res.status(400).json({ message: 'This quick sale is no longer available' });
    }

    // Now that we know who the consumer is, send the confirmation email
    try {
      sendOrderConfirmation(order, req.user);
    } catch (emailErr) {
      console.error('Email notification failed:', emailErr);
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
module.exports.startQuickSaleExpirySweep = startQuickSaleExpirySweep;

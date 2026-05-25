const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

// @route   POST /api/payments/create-intent
// @desc    Create a Stripe payment intent
// @access  Private (consumers only)
router.post('/create-intent', protect, async (req, res) => {
  try {
    const { orderId } = req.body;

    // Find the order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Make sure the logged in user owns the order
    if (order.consumer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Make sure order hasn't already been paid
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Order has already been paid' });
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100), // Stripe uses cents
      currency: 'usd',
      metadata: {
        orderId: order._id.toString(),
        consumerId: req.user.id,
      },
    });

    // Save the payment intent ID to the order
    order.stripePaymentIntentId = paymentIntent.id;
    await order.save();

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payments/webhook
// @desc    Handle Stripe webhook events
// @access  Public (Stripe only)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('Webhook error:', error.message);
    return res.status(400).json({ message: `Webhook error: ${error.message}` });
  }

  // Handle payment success
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;

    try {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: 'paid',
        status: 'confirmed',
      });
      console.log(`Order ${orderId} payment confirmed`);
    } catch (error) {
      console.error('Error updating order:', error);
    }
  }

  // Handle payment failure
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;
    console.log(`Payment failed for order ${orderId}`);
  }

  res.status(200).json({ received: true });
});

module.exports = router;
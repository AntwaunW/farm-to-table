// Payment routes — Stripe integration for processing consumer payments
//
// Flow:
//  1. Consumer places an order (orders route) → order is created with paymentStatus 'unpaid'
//  2. Frontend calls POST /create-intent → gets a clientSecret to render Stripe's payment UI
//  3. Consumer completes payment in the browser
//  4. Stripe calls POST /webhook → we update the order to 'paid' / 'confirmed'
//
// The webhook endpoint uses raw body parsing (registered before express.json in server.js)
// so Stripe can verify the request signature

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

// @route   POST /api/payments/create-intent
// @desc    Create a Stripe PaymentIntent for an existing order
// @access  Private (consumer who owns the order)
router.post('/create-intent', protect, async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only the consumer who placed the order can pay for it
    if (order.consumer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Prevent double-charging if the consumer hits this endpoint again after paying
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Order has already been paid' });
    }

    // Reuse an existing open PaymentIntent for this order instead of creating a new
    // one every time this endpoint is hit (e.g. React StrictMode double-invoking this
    // effect in dev, or the consumer simply refreshing the checkout page). Without this,
    // the consumer can end up paying through a PaymentIntent that isn't the one saved on
    // the order, so the order never gets marked paid even though the charge succeeded.
    let paymentIntent;
    if (order.stripePaymentIntentId) {
      try {
        const existing = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
        if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(existing.status)) {
          paymentIntent = existing;
        }
      } catch {
        // Intent no longer exists or isn't retrievable — fall through and create a new one
      }
    }

    if (!paymentIntent) {
      // Stripe amounts are in the smallest currency unit (cents for USD)
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.totalAmount * 100),
        currency: 'usd',
        // Metadata links the Stripe payment back to our order when the webhook fires
        metadata: {
          orderId: order._id.toString(),
          consumerId: req.user.id,
        },
      });

      // Save the intent ID so we can reference it if a refund is needed later
      order.stripePaymentIntentId = paymentIntent.id;
      await order.save();
    }

    // The clientSecret is passed to the frontend to initialize Stripe's payment UI
    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payments/confirm
// @desc    Verify a payment's status directly with Stripe and sync the order
//          Fallback to the webhook — covers local dev (no webhook forwarding) and
//          any lag between the client's confirmPayment and the webhook arriving
// @access  Private (consumer who owns the order)
router.post('/confirm', protect, async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.consumer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(200).json({ success: true, order });
    }

    if (!order.stripePaymentIntentId) {
      return res.status(400).json({ message: 'No payment has been initiated for this order' });
    }

    // Ask Stripe directly rather than trusting the client's word that payment succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      await order.save();
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payments/webhook
// @desc    Receive and handle Stripe webhook events
// @access  Public (Stripe servers only — verified by signature)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify the event came from Stripe using the webhook signing secret
    // This prevents anyone from faking a payment_intent.succeeded event
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('Webhook error:', error.message);
    return res.status(400).json({ message: `Webhook error: ${error.message}` });
  }

  // Payment was successful — mark the order as paid and confirmed
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;

    try {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: 'paid',
        status: 'confirmed', // Automatically moves the order out of 'pending'
      });
      console.log(`Order ${orderId} payment confirmed`);
    } catch (error) {
      console.error('Error updating order:', error);
    }
  }

  // Payment failed — log it for visibility (could send a notification to the consumer here)
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;
    console.log(`Payment failed for order ${orderId}`);
  }

  // Stripe expects a 200 response to acknowledge receipt of the webhook
  res.status(200).json({ received: true });
});

module.exports = router;

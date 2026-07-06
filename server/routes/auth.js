// Auth routes — handles user registration, login, and profile fetching
// JWTs are signed with JWT_SECRET and expire after 7 days
// Tokens must be sent on protected requests as: Authorization: Bearer <token>

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Farm = require('../models/Farm');
const Listing = require('../models/Listing');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../utils/email');

// Orders in these states have someone actively waiting on the other party —
// deletion is blocked while any exist, for either role
const ACTIVE_ORDER_STATUSES = ['pending', 'confirmed', 'ready'];

// @route   POST /api/auth/register
// @desc    Register a new user (farmer or consumer)
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, role, location } = req.body;

  try {
    // Prevent duplicate accounts with the same email
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Password is hashed automatically in the User model's pre-save hook
    user = await User.create({
      name,
      email,
      password,
      role,
      location,
    });

    // Send a welcome email - non blocking
      sendWelcomeEmail(user);

    // Sign a JWT with the user's ID and role
    // The role is embedded in the token so protect/authorizeRoles can decode it without a DB hit
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return the token and safe user data (no password) so the frontend can log in immediately
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        avatar: user.avatar || '',
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login with email and password — returns a JWT token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Password is excluded by default (select: false in the schema)
    // so we must explicitly request it here to run the comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      // Return a generic message so we don't reveal whether the email exists
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Use the model method to compare the entered password against the stored bcrypt hash
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Checked after the password match (not before) so a wrong-password
    // guess never reveals whether an account was deleted
    if (!user.isActive) {
      return res.status(401).json({ message: 'This account has been deleted' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        avatar: user.avatar || '',
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get the profile of the currently logged-in user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    // req.user is populated by the protect middleware
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/avatar
// @desc    Update the logged-in user's profile picture URL
// @access  Private
router.put('/avatar', protect, async (req, res) => {
  const { avatarUrl } = req.body;
  if (!avatarUrl) {
    return res.status(400).json({ message: 'Avatar URL is required' });
  }
  try {
    await User.findByIdAndUpdate(req.user.id, { avatar: avatarUrl });
    res.json({ success: true, avatarUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/auth/me
// @desc    Delete (soft-delete/anonymize) the logged-in user's own account.
//          The User document is kept — not hard-deleted — so existing
//          orders/reviews that reference it keep working; they'll just show
//          "Deleted user" instead of a real name. Farmers additionally have
//          their farm and listings deactivated. Blocked while any order is
//          still in an active (non-final) state for either role.
// @access  Private
router.delete('/me', protect, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required to delete your account' });
    }

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    let farm = null;
    if (user.role === 'farmer') {
      farm = await Farm.findOne({ owner: user.id });
    }

    const activeOrderQuery = user.role === 'farmer'
      ? (farm ? { farm: farm._id, status: { $in: ACTIVE_ORDER_STATUSES } } : null)
      : { consumer: user.id, status: { $in: ACTIVE_ORDER_STATUSES } };

    if (activeOrderQuery) {
      const hasActiveOrder = await Order.exists(activeOrderQuery);
      if (hasActiveOrder) {
        return res.status(400).json({
          message: 'You have active orders that need to be resolved before deleting your account',
        });
      }
    }

    if (farm) {
      await Farm.findByIdAndUpdate(farm._id, { isActive: false });
      await Listing.updateMany({ farm: farm._id }, { isAvailable: false });
    }

    user.name = 'Deleted user';
    user.email = `deleted-${user._id}@deleted.local`;
    user.location = {};
    user.avatar = '';
    user.isActive = false;
    await user.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

// Auth routes — handles user registration, login, and profile fetching
// JWTs are signed with JWT_SECRET and expire after 7 days
// Tokens must be sent on protected requests as: Authorization: Bearer <token>

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

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

module.exports = router;

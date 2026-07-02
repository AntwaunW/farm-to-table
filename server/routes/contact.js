const express = require('express');
const router = express.Router();
const { sendContactEmail } = require('../utils/email');

// @route   POST /api/contact
// @desc    Submit a contact form message — sends an email to the business inbox
// @access  Public
router.post('/', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email, and message are required.' });
  }

  try {
    await sendContactEmail({ name, email, phone, subject, message });
    res.json({ success: true });
  } catch (err) {
    console.error('Contact form error:', err.message);
    res.status(500).json({ message: 'Failed to send your message. Please try again.' });
  }
});

module.exports = router;

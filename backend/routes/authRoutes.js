const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const rateLimit = require('express-rate-limit');
const { auth } = require('../middleware/auth');


module.exports = router;

// GET /api/auth/me - Get current authenticated user profile
router.get('/me', auth, async (req, res) => {
  try {
    // Only return safe fields
    const { _id, name, email, phone, role, username, address, profileImageUrl, createdAt, updatedAt } = req.user;
    res.json({
      user: { _id, name, email, phone, role, username, address, profileImageUrl, createdAt, updatedAt }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
});
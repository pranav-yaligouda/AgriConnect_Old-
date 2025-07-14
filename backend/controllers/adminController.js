// controllers/adminController.js
const User = require('../models/User');
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');


// List all users (admin only)
async function getAllUsers(req, res) {
  const users = await User.find().select('-password');
  res.json(users);
}

// List all products (admin only)
async function getAllProducts(req, res) {
  const products = await Product.find().populate('farmer', 'name email');
  res.json(products);
}

// Change user role (admin only)
async function changeUserRole(req, res) {
  const { userId, role } = req.body;
  const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
  res.json(user);
}

// Admin login by username
async function adminLogin(req, res) {
  try {
    const { username, password, deviceFingerprint } = req.body;
    if (!username || !password || !deviceFingerprint) {
      return res.status(400).json({ message: 'Username, password, and device fingerprint are required' });
    }
    const user = await User.findOne({ username, role: 'admin' });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!user.deviceFingerprint) {
      user.deviceFingerprint = deviceFingerprint;
      await user.save();
    } else if (user.deviceFingerprint !== deviceFingerprint) {
      return res.status(403).json({ message: 'Access denied: device not recognized' });
    }
    const token = jwt.sign(
      { userId: user._id, tokenVersion: user.tokenVersion },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address
      },
      token
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
}

module.exports = {
  getAllUsers,
  getAllProducts,
  changeUserRole,
  adminLogin
};

// controllers/analyticsController.js

const Product = require('../models/Product');
const User = require('../models/User');

// Example: Get basic stats for admin dashboard
async function getSummaryStats(req, res) {
  try {
    const [userCount, productCount] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
    ]);
    res.json({ userCount, productCount });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching analytics', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
}

// Example: Get order stats by status
async function getOrderStatusStats(req, res) {
  try {
    const stats = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching order stats', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
}

module.exports = { getSummaryStats, getOrderStatusStats };

// routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

// Only admins can access analytics endpoints
router.get('/summary', auth, authorize('admin'), analyticsController.getSummaryStats);
router.get('/orders/status', auth, authorize('admin'), analyticsController.getOrderStatusStats);

module.exports = router;

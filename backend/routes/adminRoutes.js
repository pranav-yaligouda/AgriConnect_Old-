// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Admin login route (public)
router.post('/login', adminController.adminLogin);

// Admin dashboard APIs
router.get('/users', auth, authorize('admin'), adminController.getAllUsers);
router.get('/products', auth, authorize('admin'), adminController.getAllProducts);

router.patch('/users/role', auth, authorize('admin'), adminController.changeUserRole);

module.exports = router;

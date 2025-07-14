const express = require('express');
const router = express.Router();
const {
    register,
    login,
    resetPassword,
    getProfile,
    updateProfile,
    getDashboardData,
    deleteAccount,
    generateUsername,
    checkPhone } = require('../controllers/userController');
const { auth, authorize } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword);
router.post('/generate-username', generateUsername);
router.post('/check-phone', checkPhone);

// Protected routes
router.get('/profile', auth, getProfile);
router.patch('/profile', auth, updateProfile);
router.delete('/profile', auth, deleteAccount);

// Add dashboard route
router.get('/dashboard', auth, getDashboardData);

// --- ADMIN ROUTES ---
router.get('/admin/users', auth, authorize('admin'), (req, res) => res.json({ message: 'Admin: list users' }));
router.get('/admin/products', auth, authorize('admin'), (req, res) => res.json({ message: 'Admin: list products' }));
router.get('/admin/logs', auth, authorize('admin'), (req, res) => res.json({ message: 'Admin: list logs' }));
router.get('/admin/settings', auth, authorize('admin'), (req, res) => res.json({ message: 'Admin: settings' }));

module.exports = router;
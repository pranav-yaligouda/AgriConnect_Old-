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
    checkPhone,
    uploadProfileImage,
    checkUsername } = require('../controllers/userController');
const { auth, authorize } = require('../middleware/auth');
const multer = require('multer');
const memoryUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB limit
const { profileImageStorage } = require('../utils/cloudinary');
const upload = multer({ storage: profileImageStorage, limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB limit
const rateLimit = require('express-rate-limit');

// Rate limiter for username endpoints
const usernameLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per minute
  message: { message: 'Too many requests. Please try again later.' }
});

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword);
router.post('/generate-username', usernameLimiter, generateUsername);
router.post('/check-username', usernameLimiter, checkUsername);
router.post('/check-phone', checkPhone);

// Protected routes
router.get('/profile', auth, getProfile);
router.patch('/profile', auth, updateProfile);
router.patch('/profile/image', auth, memoryUpload.single('profileImage'), uploadProfileImage);
router.delete('/profile', auth, deleteAccount);

// Add dashboard route
router.get('/dashboard', auth, getDashboardData);

// --- ADMIN ROUTES ---
router.get('/admin/users', auth, authorize('admin'), (req, res) => res.json({ message: 'Admin: list users' }));
router.get('/admin/products', auth, authorize('admin'), (req, res) => res.json({ message: 'Admin: list products' }));
router.get('/admin/logs', auth, authorize('admin'), (req, res) => res.json({ message: 'Admin: list logs' }));
router.get('/admin/settings', auth, authorize('admin'), (req, res) => res.json({ message: 'Admin: settings' }));

module.exports = router;
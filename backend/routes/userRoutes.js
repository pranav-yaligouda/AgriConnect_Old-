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
    checkUsername,
    sendEmailOtp,
    verifyEmailOtp } = require('../controllers/userController');
const { auth, authorize } = require('../middleware/auth');
const multer = require('multer');
const memoryUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB limit
const { profileImageStorage } = require('../utils/cloudinary');
const upload = multer({ storage: profileImageStorage, limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB limit
const { auth: authLimiter, general: generalLimiter } = require('../middleware/security');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/generate-username', generalLimiter, generateUsername);
router.post('/check-username', generalLimiter, checkUsername);
router.post('/check-phone', generalLimiter, checkPhone);
router.post('/send-email-otp', authLimiter, sendEmailOtp);
router.post('/verify-email-otp', authLimiter, verifyEmailOtp);

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
// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const contactRequestController = require('../controllers/contactRequestController');
const { adminSchemas, validate, validateQuery } = require('../utils/validation');
const { auth: authLimiter } = require('../middleware/security');
const Joi = require('joi');

const updateAdminNotesSchema = Joi.object({
  userId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required(),
  adminNotes: Joi.string().max(1000).allow('').required()
});

// Admin login route (public)
router.post('/login', authLimiter, validate(adminSchemas.login), adminController.adminLogin);

// Admin dashboard APIs
router.get('/users', auth, authorize('admin'), validateQuery(adminSchemas.userQuery), adminController.getAllUsers);
router.get('/products', auth, authorize('admin'), validateQuery(adminSchemas.productQuery), adminController.getAllProducts);
router.get('/contact-requests', auth, authorize('admin'), validateQuery(adminSchemas.contactRequestQuery), contactRequestController.getAllContactRequests);

router.patch('/users/role', auth, authorize('admin'), validate(adminSchemas.changeUserRole), adminController.changeUserRole);
router.patch('/users/admin-notes', auth, authorize('admin'), validate(updateAdminNotesSchema), adminController.updateAdminNotes);

// Admin logs and settings
router.get('/logs', auth, authorize('admin'), adminController.getAdminLogs);
router.get('/settings', auth, authorize('admin'), adminController.getAdminSettings);

module.exports = router;

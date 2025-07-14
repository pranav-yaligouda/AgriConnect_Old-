const express = require('express');
const router = express.Router();
const {
  checkRequestStatus,
  createRequestLimiter,
  createContactRequest,
  acceptContactRequest,
  rejectContactRequest,
  getMyContactRequests,
  userConfirm,
  farmerConfirm,
  getDisputes,
  adminResolveDispute
} = require('../controllers/contactRequestController');
const { auth, validateObjectId } = require('../middleware/auth');

// Check existing contact requests
router.get('/status/:farmerId/:productId', auth, validateObjectId('farmerId'), validateObjectId('productId'), checkRequestStatus);
// Create a contact request (rate limited)
router.post('/create', auth, createRequestLimiter, createContactRequest);
// Approve a contact request (farmer)
router.put('/:id/accept', auth, validateObjectId('id'), acceptContactRequest);
// Reject a contact request (farmer)
router.put('/:id/reject', auth, validateObjectId('id'), rejectContactRequest);
// Get all contact requests for current user
router.get('/my', auth, getMyContactRequests);
// User confirms purchase
router.post('/:id/user-confirm', auth, validateObjectId('id'), userConfirm);
// Farmer confirms purchase
router.post('/:id/farmer-confirm', auth, validateObjectId('id'), farmerConfirm);
// Admin: get all disputes
router.get('/disputes', auth, getDisputes);
// Admin: resolve a dispute
router.post('/:id/admin-resolve', auth, validateObjectId('id'), adminResolveDispute);

module.exports = router;

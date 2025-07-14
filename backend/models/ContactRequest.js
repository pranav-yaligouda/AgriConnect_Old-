const mongoose = require('mongoose');

const ContactRequestSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  requesterRole: {
    type: String,
    enum: ['user', 'vendor'],
    required: true,
  },
  requestedQuantity: {
    type: Number,
    required: true,
    min: 1,
  },
  status: {
    type: String,
    enum: [
      'pending',        // Request sent, waiting for farmer action
      'accepted',       // Farmer accepted, contact info shared
      'rejected',       // Farmer rejected
      'completed',      // Both confirmed, details match
      'not_completed',  // One or both said "No"
      'disputed',       // Both confirmed, but details don't match
      'expired'         // No confirmation after 2 days
    ],
    default: 'pending',
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  acceptedAt: Date,
  rejectedAt: Date,

  // Confirmation/negotiation
  finalQuantity: Number,
  finalPrice: Number,
  userConfirmed: { type: Boolean, default: false },
  farmerConfirmed: { type: Boolean, default: false },
  userConfirmationAt: Date,
  farmerConfirmationAt: Date,
  userFeedback: String,
  farmerFeedback: String,
  confirmationStatus: {
    type: String,
    enum: ['pending', 'completed', 'not_completed', 'disputed', 'expired'],
    default: 'pending',
  },
  farmerFinalQuantity: Number,
  farmerFinalPrice: Number,
  adminNote: String,
});

// Indexes for fast queries
ContactRequestSchema.index({ status: 1, farmerId: 1 });
ContactRequestSchema.index({ requesterId: 1, status: 1 });
ContactRequestSchema.index({ requestedAt: 1 });

module.exports = mongoose.model('ContactRequest', ContactRequestSchema);

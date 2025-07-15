const mongoose = require('mongoose');

const adminActionLogSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // e.g., 'role_change', 'login', 'product_update'
  target: { type: String }, // e.g., userId, productId, etc.
  details: { type: Object }, // Additional details about the action
  createdAt: { type: Date, default: Date.now }
});

const AdminActionLog = mongoose.model('AdminActionLog', adminActionLogSchema);

module.exports = AdminActionLog; 
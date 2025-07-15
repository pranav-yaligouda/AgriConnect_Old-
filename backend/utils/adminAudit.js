const AdminActionLog = require('../models/AdminActionLog');

/**
 * Logs an admin action to the AdminActionLog collection.
 * @param {Object} params
 * @param {string|ObjectId} params.admin - Admin user ID
 * @param {string} params.action - Action type (e.g., 'role_change', 'login')
 * @param {string} [params.target] - Target entity ID (user, product, etc.)
 * @param {Object} [params.details] - Additional details
 */
async function logAdminAction({ admin, action, target, details }) {
  try {
    await AdminActionLog.create({
      admin,
      action,
      target,
      details
    });
  } catch (err) {
    // Optionally log to console or external service
    console.error('Failed to log admin action:', err);
  }
}

module.exports = { logAdminAction }; 
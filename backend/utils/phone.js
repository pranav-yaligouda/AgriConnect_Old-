// Centralized phone normalization utility
// Always returns the last 10 digits (Indian mobile standard)
function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '').slice(-10);
}

module.exports = { normalizePhone }; 
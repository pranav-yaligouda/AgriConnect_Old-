// username.js
// Utility for consistent username generation in AgriConnect backend

const User = require('../models/User');

/**
 * Generate a unique username from a name string (async)
 * @param {string} name
 * @returns {Promise<string>} unique username
 */
async function generateUniqueUsername(name) {
  if (typeof name !== 'string' || name.length > 50) name = 'user';
  let base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
  base = base.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
  if (!base) base = 'user';
  if (!/^[a-z0-9_]+$/.test(base)) base = 'user';
  // Truncate base to max 18 chars to allow for _99, _100, etc.
  base = base.slice(0, 18);
  let uniqueUsername = base;
  let counter = 0;
  while (await User.findOne({ username: uniqueUsername })) {
    counter++;
    // Ensure total length ≤ 20
    uniqueUsername = `${base.slice(0, 20 - String(counter).length - 1)}_${counter}`;
    if (uniqueUsername.length > 30) uniqueUsername = uniqueUsername.slice(0, 30);
  }
  return uniqueUsername;
}

module.exports = { generateUniqueUsername }; 
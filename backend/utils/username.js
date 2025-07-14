// username.js
// Utility for consistent username generation in AgriConnect backend

const User = require('../models/User');

/**
 * Generate a unique username from a name string (async)
 * @param {string} name
 * @returns {Promise<string>} unique username
 */
async function generateUniqueUsername(name) {
  let base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
  base = base.replace(/_+/g, '_');
  base = base.replace(/^_+|_+$/g, '');
  if (!base) base = 'user';
  if (!/^[a-z0-9_]+$/.test(base)) base = 'user';
  let uniqueUsername = base;
  let counter = 0;
  while (await User.findOne({ username: uniqueUsername })) {
    counter++;
    uniqueUsername = `${base}${counter}`;
  }
  return uniqueUsername;
}

module.exports = { generateUniqueUsername }; 
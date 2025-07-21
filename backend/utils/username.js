// username.js
// Utility for consistent username generation in AgriConnect backend

const User = require('../models/User'); // or your user model

async function generateUniqueUsername(name) {
  // 1. Sanitize and normalize
  let base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
  base = base.replace(/_+/g, '_').replace(/^_+/, '').replace(/_+$/, '');

  // 2. Limit length for base (16 chars to allow for suffixes)
  base = base.slice(0, 16);
  if (!base) base = 'user';

  // 3. Ensure only valid characters
  if (!/^[a-z0-9_]+$/.test(base)) base = 'user';

  // 4. Check uniqueness and append suffix if needed
  let username = base;
  let suffix = 1;
  while (await User.exists({ username })) {
    const suffixStr = `_${suffix}`;
    username = base.slice(0, 20 - suffixStr.length) + suffixStr;
    suffix++;
    if (suffix > 9999) throw new Error('Unable to generate unique username');
  }
  return username;
}

module.exports = { generateUniqueUsername }; 
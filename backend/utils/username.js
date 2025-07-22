// username.js
// Utility for consistent username generation in AgriConnect backend

const User = require('../models/User'); // or your user model

async function generateUniqueUsername(name) {
  let base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
  base = base.replace(/_+/g, '_');
  base = base.slice(0, 16);
  // Remove leading/trailing underscores without regex
  while (base.startsWith('_')) base = base.slice(1);
  while (base.endsWith('_')) base = base.slice(0, -1);
  if (!base) base = 'user';
  if (!/^[a-z0-9_]+$/.test(base)) base = 'user';

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
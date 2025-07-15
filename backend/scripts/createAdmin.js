const mongoose = require('mongoose');
const readline = require('readline');
const User = require('../models/User');
const config = require('../config');

// Helper to prompt for input
function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans); }));
}

async function main() {
  try {
    // Use config or fallback to env
    const mongoUri = (config.get && config.get('MONGODB_URI')) || process.env.MONGODB_URI || 'mongodb://localhost:27017/agriconnect';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const name = await prompt('Admin Name: ');
    const username = await prompt('Username: ');
    const email = await prompt('Email: ');
    const phone = await prompt('Phone (+91...): ');
    const passwordRaw = await prompt('Password: ');
    const street = await prompt('Street (optional): ');
    const district = await prompt('District: ');
    const state = await prompt('State: ');
    const zipcode = await prompt('Zipcode (6 digits): ');

    if (!name || !username || !email || !phone || !passwordRaw || !district || !state) {
      throw new Error('All required fields must be provided.');
    }
    if (passwordRaw.length < 6) throw new Error('Password must be at least 6 characters.');

    const existing = await User.findOne({ $or: [ { username }, { email }, { phone } ] });
    if (existing) throw new Error('A user with this username, email, or phone already exists.');

    const admin = new User({
      name,
      username,
      email,
      phone,
      password: passwordRaw, // Let the model hash it
      role: 'admin',
      address: { street, district, state, zipcode }
    });
    await admin.save();
    console.log('Admin user created successfully:', admin.username);
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err.message);
    process.exit(1);
  }
}

main(); 
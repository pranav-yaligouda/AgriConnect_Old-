// User.js
// User model for AgriConnect: includes unique username, email, password, role, profile, connections, and requests
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ADMIN_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0';

// Add indexes for frequently queried fields
function defineIndexes() {
  userSchema.index({ role: 1 });
}

/**
 * User schema definition
 * @type {mongoose.Schema}
 */
const userSchema = new mongoose.Schema({
  // User's display name (not unique)
  name: {
    type: String,
    required: true,
    trim: true
  },
  // Unique username for login and identification
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores.']
  },
  // Unique email for account (used for login/verification)
  email: {
    type: String,
    required: false,
    trim: true,
    lowercase: true
  },
  // Hashed password for security
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  // User's role in the system
  role: {
    type: String,
    enum: ['user', 'farmer', 'vendor', 'admin'],
    default: 'user'
  },
  // Contact phone number
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function (v) {
        return /^\+?\d{10,15}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  // Structured address
  address: {
    street: { type: String },
    district: { type: String, required: [true, 'District is required'] },
    state: { type: String, required: [true, 'State is required'] },
    zipcode: { 
      type: String,
      validate: {
        validator: function (v) {
          return /^\d{6}$/.test(v);
        },
        message: props => `${props.value} is not a valid zip code!`
      }
    }
  },
  // Cloudinary profile image URL
  profileImageUrl: {
    type: String,
    default: null
  },
  // Email verification status
  emailVerified: {
    type: Boolean,
    default: false
  },
  tokenVersion: {
    type: Number,
    default: 0,
    index: true
  },
  // Account creation timestamp
  createdAt: {
    type: Date,
    default: Date.now
  },
  deviceFingerprint: { type: String, default: null },
  lastAdminLogin: { type: Date, default: null },
  adminNotes: { type: String, default: '' },
});

// Add index for role only (email is already unique via schema)
defineIndexes();

/**
 * Pre-save hook: hash password before saving user document
 */
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Method to compare input password with hashed password
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Cascading delete: remove user's products and orders
userSchema.pre('remove', async function(next) {
  const userId = this._id;
  await Promise.all([
    require('./Product').deleteMany({ farmer: userId }),
    require('./Order').deleteMany({ $or: [{ buyer: userId }, { farmer: userId }] })
  ]);
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;

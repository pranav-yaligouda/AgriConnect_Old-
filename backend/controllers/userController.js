const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Product = require('../models/Product');
const admin = require('../config/firebaseadmin'); // Fixed casing to match existing file

const { validateEmail, validatePassword, validateAddress } = require('../utils/validation');
const { generateUniqueUsername } = require('../utils/username');

const ADMIN_USER_AGENT = 'YOUR_IPHONE_SE_USER_AGENT_STRING'; // Replace with your actual iPhone SE user-agent

// Register a new user
const register = async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        message: 'No request body received',
        error: 'req.body is undefined or not an object. Ensure Content-Type: application/json and valid JSON body.'
      });
    }
    let { username, name, email, password, role, address, phone } = req.body || {};

    // Auto-generate username if not provided
    if (!username && name) {
      username = await generateUniqueUsername(name);
    }

    // Validate required fields
    if (!name || !password || !role || !address || !phone) {
      return res.status(400).json({
        message: 'All fields are required',
        details: {
          name: !name ? 'Name is required' : undefined,
          password: !password ? 'Password is required' : undefined,
          role: !role ? 'Role is required' : undefined,
          address: !address ? 'Address is required' : undefined,
          phone: !phone ? 'Phone is required' : undefined
        }
      });
    }
    if (!validateAddress(address)) {
      return res.status(400).json({
        message: 'Invalid address structure',
        details: { address: 'Address must include at least district and state.' }
      });
    }

    // Check if user already exists by phone
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists',
        details: {
          phone: 'This phone number is already registered'
        }
      });
    }

    // Optionally, check for duplicate email only if provided
    if (email) {
      const emailUser = await User.findOne({ email });
      if (emailUser) {
        return res.status(400).json({
          message: 'User already exists',
          details: {
            email: 'This email is already registered'
          }
        });
      }
    }

    // Validate email format only if provided
    if (email && !validateEmail(email)) {
      return res.status(400).json({
        message: 'Invalid email format',
        details: { email: 'Please provide a valid email address' }
      });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({
        message: 'Invalid password format',
        details: { password: 'Password must be at least 7 characters, include uppercase and lowercase letters, and at least one digit. Symbols are allowed.' }
      });
    }

    // Create new user
    const user = new User({
      username,
      name,
      email,
      password,
      role,
      address,
      phone,
      profileImages: req.body.profileImages && Array.isArray(req.body.profileImages) && req.body.profileImages.length > 0 ? req.body.profileImages.slice(0, 1) : undefined
    });

    await user.save();

    // Check for JWT secret
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Internal server error: JWT secret is not set.' });
    }
    // Generate token
    const token = jwt.sign(
      { userId: user._id, tokenVersion: user.tokenVersion },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Always return both profileImages (array) and profileImage (string, first image or null)
    const userObj = user.toObject ? user.toObject() : user;
    
    delete userObj.password;
    res.status(201).json({
      user: userObj,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors).forEach(key => {
        validationErrors[key] = error.errors[key].message;
      });

      return res.status(400).json({
        message: 'Validation failed',
        details: validationErrors
      });
    }

    res.status(500).json({
      message: 'Error creating user',
      error: error.message,
      details: error.errors
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    console.log('LOGIN req.body:', req.body);
    if (!req.body) {
      return res.status(400).json({
        message: 'No request body received',
        error: 'req.body is undefined. Check if express.json() middleware is applied.'
      });
    }
    const { email, phone, password } = req.body;

    // Validate required fields
    if ((!email && !phone) || !password) {
      return res.status(400).json({
        message: 'Phone or email and password are required',
        details: {
          phone: !phone && !email ? 'Phone or email is required' : undefined,
          password: !password ? 'Password is required' : undefined
        }
      });
    }

    // Find user
    const user = await User.findOne(email ? { email } : { phone });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials',
        details: {
          email: email ? 'No user found with this email' : undefined,
          phone: phone ? 'No user found with this phone number' : undefined
        }
      });
    }

    // Prevent admin login here
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Please use the admin login page.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid credentials',
        details: {
          password: 'Incorrect password'
        }
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, tokenVersion: user.tokenVersion },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Error logging in',
      error: error.message
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { phone, newPassword, idToken } = req.body;

    // 1. Verify Firebase ID token to ensure OTP just happened
    const decoded = await admin.auth().verifyIdToken(idToken);
    if (decoded.phone_number !== phone) {
      return res.status(403).json({ message: 'Phone mismatch' });
    }

    // 2. Hash and update password in your User model
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ phone }, { password: hash });

    return res.json({ success: true });
  } catch (err) {
    console.error('resetPassword error:', err);
    return res.status(500).json({ message: 'Reset failed', error: err.message });
  }
};

exports.checkPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ exists: false, message: "Phone number is required" });
    }
    const user = await require('../models/User').findOne({ phone });
    res.json({ exists: !!user });
  } catch (error) {
    res.status(500).json({ exists: false, message: error.message });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  console.log('[getProfile] Request received');
  try {
    if (!req.user || !req.user._id) {
      console.error('[getProfile] No user on request object. Auth middleware failure? req.user:', req.user);
      return res.status(401).json({ message: 'Unauthorized: No user info found' });
    }
    console.log(`[getProfile] Authenticated userId: ${req.user._id}`);
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      const userObj = user.toObject ? user.toObject() : user;
      
      delete userObj.password;
      console.log('[getProfile] User found, sending profile:', { _id: userObj._id, email: userObj.email });
      return res.json(userObj);
    }
    console.warn(`[getProfile] User not found for id: ${req.user._id}`);
    res.status(404).json({ message: 'User not found' });
  } catch (error) {
    console.error('[getProfile] Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

// Update user profile, including profile image using the upload flow
const updateProfile = async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    // Allow profileImage as an object
    const allowedUpdates = ['name', 'email', 'phone', 'address', 'profileImage'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // If profileImage is being updated, expect an object with data (base64 string) and contentType
    if (req.body.profileImage) {
      const { data, contentType } = req.body.profileImage;
      if (!data || typeof data !== 'string' || !contentType || typeof contentType !== 'string') {
        return res.status(400).json({ message: 'Invalid profile image data.' });
      }
      user.profileImage = { data, contentType };
    }

    // Handle nested address updates
    updates.forEach(update => {
      if (update === 'address') {
        // Merge address fields
        user.address = { ...user.address, ...req.body.address };
      } else if (update !== 'profileImage') {
        user[update] = req.body[update];
      }
    });

    await user.save();

    // Remove sensitive data before sending response
    const userData = user.toObject();
    delete userData.password;

    // Return profileImage object directly (base64 and contentType)
    res.json(userData);
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors).forEach(key => {
        validationErrors[key] = error.errors[key].message;
      });
      return res.status(400).json({
        message: 'Validation failed',
        details: validationErrors
      });
    }
    res.status(500).json({ message: 'Error updating profile', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

const getDashboardData = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const user = await User.findById(req.user._id)
      .select('-password')
      .lean();
    let data = { user };
    // Extensible role-based dashboard logic
    switch (user.role) {
      case 'farmer': {
        const [products] = await Promise.all([
          Product.find({ farmer: user._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean(),
        ]);
        data = { ...data, products };
        break;
      }
      case 'vendor': {
        const [products] = await Promise.all([
          Product.find({ 'location.district': user.address.district })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean(),

        ]);
        data = { ...data, products };
        break;
      }
    }
    res.json(data);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Error fetching dashboard data', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Delete user account
const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Delete user's products if they are a farmer
    if (user.role === 'farmer') {
      await Product.deleteMany({ farmer: user._id });
    }

    await user.deleteOne();
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting account', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};


// Check if a phone number is registered
const checkPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ exists: false, message: "Phone number is required" });
    }
    const user = await User.findOne({ phone });
    res.json({ exists: !!user });
  } catch (error) {
    res.status(500).json({ exists: false, message: error.message });
  }
};

// Generate a unique username from a full name
const generateUsername = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: 'Name is required' });
    }
    // Basic username: lowercase, remove non-alphanumeric, replace spaces with dot
    let base = name.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/ +/g, '.');
    if (!base) base = 'user';
    let username = base;
    let counter = 0;
    // Check for uniqueness
    while (await User.findOne({ username })) {
      counter++;
      username = `${base}${counter}`;
    }
    return res.json({ username });
  } catch (error) {
    res.status(500).json({ message: 'Error declining request', error: error.message });
  }
};

module.exports = {
  register,
  login,
  resetPassword,
  getProfile,
  updateProfile,
  getDashboardData,
  deleteAccount,
  generateUsername,
  checkPhone,
};
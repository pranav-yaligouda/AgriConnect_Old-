const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Product = require('../models/Product');
const admin = require('../config/firebaseadmin'); // Fixed casing to match existing file
const { fileTypeFromBuffer } = require('file-type');
const cloudinary = require('../utils/cloudinary');

const { userSchemas } = require('../utils/validation');
const { generateUniqueUsername } = require('../utils/username');
const { normalizePhone } = require('../utils/phone');
const { signJwt } = require('../utils/jwt');

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
    let { username, name, email, password, role, address, phone, idToken } = req.body || {};

    // Require and verify Firebase ID token (OTP verification)
    if (!idToken) {
      return res.status(400).json({
        message: 'OTP verification required. Please verify your phone number.'
      });
    }
    phone = normalizePhone(phone);
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch (err) {
      return res.status(403).json({ message: 'Invalid or expired OTP token.' });
    }
    if (normalizePhone(decoded.phone_number) !== phone) {
      return res.status(403).json({ message: 'Phone number does not match OTP verification.' });
    }

    // Always lowercase username if provided
    if (username) username = username.toLowerCase();
    if (!username && name) {
      username = await generateUniqueUsername(name);
    }
    req.body.username = username;

    // Joi validation for registration (robust, enterprise-grade)
    const { error } = userSchemas.register.validate({ ...req.body, phone }, { abortEarly: false });
    if (error) {
      const details = {};
      error.details.forEach(detail => {
        const field = detail.path.join('.');
        details[field] = detail.message;
      });
      return res.status(400).json({
        message: 'Validation failed',
        details
      });
    }

    // Check if user already exists by phone
    if (typeof phone !== 'string') {
      return res.status(400).json({ message: 'Invalid phone' });
    }
    const existingUser = await User.findOne({ phone: { $eq: phone } });
    if (existingUser) {
      return res.status(400).json({
        message: 'Registration failed',
        details: { phone: 'This phone number is already in use.' }
      });
    }
    if (email) {
      if (typeof email !== 'string') {
        return res.status(400).json({ message: 'Invalid email' });
      }
      const emailUser = await User.findOne({ email: { $eq: email.toLowerCase() } });
      if (emailUser) {
        return res.status(400).json({
          message: 'Registration failed',
          details: { email: 'This email is already in use.' }
        });
      }
    }
    let user;
    let attempts = 0;
    while (attempts < 3) {
      try {
        user = new User({
          username,
          name,
          email,
          password,
          role,
          address,
          phone,
          profileImageUrl: req.body.profileImageUrl || null
        });
        await user.save();
        break;
      } catch (err) {
        if (err.code === 11000 && err.keyPattern && err.keyPattern.username) {
          username = await generateUniqueUsername(name);
          req.body.username = username;
          attempts++;
        } else {
          throw err;
        }
      }
    }
    if (!user) {
      return res.status(500).json({ message: 'Could not generate a unique username. Please try again.' });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Internal server error: JWT secret is not set.' });
    }
    const token = signJwt(
      { userId: user._id, tokenVersion: user.tokenVersion }
    );
    const userObj = user.toObject ? user.toObject() : user;
    delete userObj.password;
    res.status(201).json({
      user: userObj,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
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
      message: 'Registration failed. Please try again later.'
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
    if (typeof email !== 'string' && typeof phone !== 'string') {
      return res.status(400).json({ message: 'Invalid input' });
    }
    // Normalize phone for lookup
    let normalizedPhone = phone;
    if (typeof phone === 'string') {
      normalizedPhone = normalizePhone(phone);
    }
    const user = await User.findOne(
      email ? { email: { $eq: email } } : { phone: { $eq: normalizedPhone } }
    );
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
    const token = signJwt({ userId: user._id, tokenVersion: user.tokenVersion });

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
    let { phone, newPassword, idToken } = req.body;
    // Normalize phone for lookup
    phone = normalizePhone(phone);

    // 1. Verify Firebase ID token to ensure OTP just happened
    const decoded = await admin.auth().verifyIdToken(idToken);
    if (normalizePhone(decoded.phone_number) !== phone) {
      return res.status(403).json({ message: 'Phone mismatch' });
    }

    // 2. Hash and update password in your User model
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(newPassword, 10);
    if (typeof phone !== 'string') {
      return res.status(400).json({ message: 'Invalid phone' });
    }
    await User.updateOne({ phone: { $eq: phone } }, { password: hash });

    return res.json({ success: true });
  } catch (err) {
    console.error('resetPassword error:', err);
    return res.status(500).json({ message: 'Reset failed', error: err.message });
  }
};

exports.checkPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ exists: false, message: "Phone number is required and must be a string" });
    }
    const normalizedPhone = normalizePhone(phone);
    const user = await require('../models/User').findOne({ phone: { $eq: normalizedPhone } });
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
    // Remove base64 profileImage logic
    const allowedUpdates = ['name', 'email', 'phone', 'address', 'profileImageUrl'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // If profileImageUrl is being updated, just set the URL
    if (req.body.profileImageUrl) {
      user.profileImageUrl = req.body.profileImageUrl;
    }

    // Handle nested address updates
    updates.forEach(update => {
      if (update === 'address') {
        user.address = { ...user.address, ...req.body.address };
      } else if (update !== 'profileImageUrl') {
        user[update] = req.body[update];
      }
    });

    await user.save();
    const userData = user.toObject();
    delete userData.password;
    res.json(userData);
  } catch (error) {
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
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ exists: false, message: "Phone number is required and must be a string" });
    }
    const normalizedPhone = normalizePhone(phone);
    const user = await User.findOne({ phone: { $eq: normalizedPhone } });
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
    const username = await generateUniqueUsername(name);
    return res.json({ username });
  } catch (error) {
    res.status(500).json({ message: 'Error generating username. Please try again.' });
  }
};

// POST /api/users/check-username
const checkUsername = async (req, res) => {
  try {
    let { username } = req.body;
    if (!username || typeof username !== 'string') {
      return res.json({ available: false, message: 'Invalid username format' });
    }
    username = username.toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      return res.json({ available: false, message: 'Invalid username format' });
    }
    const exists = await User.findOne({ username: { $eq: username } });
    // Harden error message for enumeration
    if (exists) {
      return res.json({ available: false, message: 'Username is not available.' });
    }
    res.json({ available: true });
  } catch (error) {
    res.status(500).json({ available: false, message: 'Error checking username. Please try again.' });
  }
};

function uploadToCloudinary(buffer, folder) {
  const cloudinary = require('../utils/cloudinary');
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Cloudinary upload timed out')), 15000); // 15s timeout
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'image', folder },
      (error, result) => {
        clearTimeout(timeout);
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
    stream.end(buffer);
  });
}

// Multer+Cloudinary profile image upload handler (to be used in route)
// Usage: router.patch('/profile/image', auth, upload.single('profileImage'), uploadProfileImage)
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'No image uploaded' });
    }
    const fileType = await fileTypeFromBuffer(req.file.buffer);
    if (!fileType || !['image/jpeg', 'image/png'].includes(fileType.mime)) {
      return res.status(400).json({ message: 'Invalid image type. Only JPEG and PNG are allowed.' });
    }
    // Robust Cloudinary upload with timeout
    const uploadResult = await uploadToCloudinary(req.file.buffer, 'agriconnect/profile_images');
    // Fetch user from DB, update and save
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.profileImageUrl = uploadResult.secure_url;
    await user.save();
    res.json({ profileImageUrl: user.profileImageUrl });
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({ message: error.message || 'Error uploading profile image' });
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
  uploadProfileImage,
  checkUsername,
};
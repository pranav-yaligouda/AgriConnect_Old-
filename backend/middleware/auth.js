const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

// Add session validation and token invalidation
const checkTokenValidity = async (decoded) => {
  const user = await User.findOne({
    _id: decoded.userId,
    tokenVersion: decoded.tokenVersion
  });
  return !!user;
};

// JWT authentication middleware for SPA: Only supports JWT in Authorization header
const auth = async (req, res, next) => {
  try {
    let token = null;
    // Only accept JWT from Authorization header
    if (req.header('Authorization')) {
      token = req.header('Authorization').replace('Bearer ', '');
    }
    if (!token) throw new Error('Authentication token missing');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!(await checkTokenValidity(decoded))) {
      throw new Error('Token revoked');
    }
    const user = await User.findOne({ _id: decoded.userId }).lean();
    if (!user) throw new Error('User not found');
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication Error:', error.message);
    res.status(401).json({
      success: false,
      message: 'Please authenticate',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const ADMIN_USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1'; // iPhone SE user-agent

function authorize(role) {
  return async (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // Extra device check for admin
    if (role === 'admin') {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(403).json({ message: 'Admin user not found' });
      }
      const userAgent = req.headers['user-agent'];
      const deviceFingerprint = req.headers['x-device-fingerprint'] || req.body.deviceFingerprint;
      if (!user.deviceFingerprint || !deviceFingerprint || user.deviceFingerprint !== deviceFingerprint) {
        return res.status(403).json({ message: 'Access denied: device not recognized' });
      }
      // Temporarily allow all devices for admin login
      // if (userAgent !== ADMIN_USER_AGENT) {
      //   return res.status(403).json({ message: 'Access denied: device not recognized' });
      // }
    }
    next();
  };
}

const validateObjectId = (paramName) => (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  next();
};

module.exports = {
  auth,
  authorize,
  validateObjectId
};
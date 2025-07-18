const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const validator = require('validator');

// Advanced rate limiting with different rules for different endpoints
const createRateLimiters = () => {
  // General API rate limiter
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX, 10) : 100,
    message: {
      error: 'Too many requests from this IP, please try again after 15 minutes',
      retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many requests from this IP, please try again after 15 minutes',
        retryAfter: Math.ceil(15 * 60 / 1000)
      });
    }
  });

  // Stricter rate limiter for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
      error: 'Too many authentication attempts, please try again after 15 minutes',
      retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many authentication attempts, please try again after 15 minutes',
        retryAfter: Math.ceil(15 * 60 / 1000)
      });
    }
  });

  // Rate limiter for file uploads
  const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 uploads per hour
    message: {
      error: 'Too many file uploads, please try again after 1 hour',
      retryAfter: 60 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many file uploads, please try again after 1 hour',
        retryAfter: Math.ceil(60 * 60 / 1000)
      });
    }
  });

  // Speed limiter for brute force protection
  const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 3, // allow 3 requests per 15 minutes, then...
    delayMs: 500 // begin adding 500ms of delay per request above 100
  });

  return {
    general: generalLimiter,
    auth: authLimiter,
    upload: uploadLimiter,
    speed: speedLimiter
  };
};

const rateLimiters = createRateLimiters();

// Input validation and sanitization middleware
const inputValidation = (req, res, next) => {
  try {
    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = validator.escape(req.query[key]);
        }
      });
    }

    // Sanitize body parameters
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = validator.escape(req.body[key]);
        }
      });
    }

    // Validate and sanitize email addresses
    if (req.body.email && !validator.isEmail(req.body.email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        field: 'email'
      });
    }

    // Validate phone numbers (basic validation)
    if (req.body.phone && !validator.isMobilePhone(req.body.phone, 'en-IN')) {
      return res.status(400).json({
        error: 'Invalid phone number format',
        field: 'phone'
      });
    }

    // Validate URLs
    if (req.body.url && !validator.isURL(req.body.url)) {
      return res.status(400).json({
        error: 'Invalid URL format',
        field: 'url'
      });
    }

    next();
  } catch (error) {
    console.error('Input validation error:', error);
    res.status(400).json({
      error: 'Invalid input data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Request size validation
const requestSizeValidation = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'], 10);
    const maxSizeBytes = parseSize(maxSize);
    
    if (contentLength && contentLength > maxSizeBytes) {
      return res.status(413).json({
        error: 'Request entity too large',
        maxSize: maxSize,
        receivedSize: formatBytes(contentLength)
      });
    }
    
    next();
  };
};

// Parse size string to bytes
const parseSize = (size) => {
  const units = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };
  
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/);
  if (!match) return 10 * 1024 * 1024; // Default 10MB
  
  const [, value, unit] = match;
  return Math.floor(parseFloat(value) * units[unit]);
};

// Format bytes to human readable
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Remove sensitive headers
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.cloudinary.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', csp);
  
  next();
};

// Request logging for security monitoring
const securityLogging = (req, res, next) => {
  const start = Date.now();
  
  // Log suspicious requests
  const suspiciousPatterns = [
    /\.\.\//, // Directory traversal
    /<script/i, // XSS attempts
    /union\s+select/i, // SQL injection
    /eval\s*\(/i, // Code injection
    /javascript:/i // JavaScript protocol
  ];
  
  const requestString = JSON.stringify({
    url: req.url,
    method: req.method,
    headers: req.headers,
    body: req.body,
    query: req.query
  });
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestString));
  
  if (isSuspicious) {
    console.warn(`[SECURITY] Suspicious request detected:`, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }
  
  // Log response time
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 5000) { // Log slow requests
      console.warn(`[PERFORMANCE] Slow request: ${req.method} ${req.url} took ${duration}ms`);
    }
  });
  
  next();
};

module.exports = {
  ...rateLimiters,
  inputValidation,
  requestSizeValidation,
  securityHeaders,
  securityLogging,
  mongoSanitize,
  xss,
  hpp
}; 
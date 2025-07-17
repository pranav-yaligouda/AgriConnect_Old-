// AgriConnect Backend Server
// Applies best practices for security, error handling, logging, and maintainability.
const config = require('./config');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');

// Import basic security middleware (simplified for now)
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

// Basic error handling
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({ message: 'API route not found.' });
};

// Basic health check
const healthCheck = (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    uptime: process.uptime(), 
    timestamp: Date.now() 
  });
};

// Basic monitoring
const requestMonitor = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 5000) {
      console.warn(`[PERFORMANCE] Slow request: ${req.method} ${req.url} took ${duration}ms`);
    }
  });
  next();
};
// const bodyParser = require('body-parser'); // Express 4.16+ has built-in body parsing
const app = express();
const server = http.createServer(app);

// Access environment variables using config
const port = config.get('PORT');
const jwtSecret = config.get('JWT_SECRET');
const frontendUrl = config.get('FRONTEND_URL');
const mongoUri = config.get('MONGODB_URI');

const isDev = config.get('NODE_ENV') === 'development';


// Advanced security middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // Disable to allow cross-origin images
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.cloudinary.com"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  }
}));

// Logging
app.use(morgan(isDev ? 'dev' : 'combined'));

// Basic rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Performance monitoring
app.use(requestMonitor);

// Input sanitization and validation
// app.use(mongoSanitize()); // Temporarily disabled due to Express 5.x compatibility
// app.use(xss()); // Removed due to incompatibility with Express 4.18+
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Rate limiting
app.use('/api', limiter);

// CORS configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim());
const corsOptions = {
  origin: (origin, callback) => {
    const isLocalhost = origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'));
    if (!origin || allowedOrigins.includes(origin) || isLocalhost) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-device-fingerprint'],
  credentials: true
};
app.use(cors(corsOptions));

// Serve favicon.ico at the root
app.use('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'favicon.ico'));
});


// Body parsers (increase payload limit for large uploads)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));


app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});


// Import routes with error handling
let authRoutes, productRoutes, userRoutes;
try {
  authRoutes = require('./routes/authRoutes');
  productRoutes = require('./routes/productRoutes');
  userRoutes = require('./routes/userRoutes');
  // uploadRoutes = require('./routes/uploadRoutes');
} catch (err) {
  console.error('Error loading routes:', err);
  process.exit(1);
}

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);

// Mount analytics and admin routes
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', healthCheck);

const contactRequestRoutes = require('./routes/contactRequestRoutes');
app.use('/api/contact-requests', contactRequestRoutes);



// 404 handler for unknown API routes
app.all(/^\/api(\/|$)/, notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

try {
  config.validate();
} catch (error) {
  console.error('Configuration validation failed:', error);
  process.exit(1);
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET is not set or is too weak (must be at least 32 characters).');
  process.exit(1);
}

const maxRequests = config.getAsNumber('RATE_LIMIT_MAX') || 
  (config.get('NODE_ENV') === 'development' ? 10000 : 100);

// Start server
const startServer = async () => {
  try {
    await connectDB();
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

const contactRequestController = require('./controllers/contactRequestController');

// Scheduled job: expire old accepted requests every hour
setInterval(async () => {
  try {
    const result = await contactRequestController.expireOldRequests();
    if (result && result.modifiedCount) {
      console.log(`[CRON] Expired ${result.modifiedCount} old accepted contact requests.`);
    }
  } catch (err) {
    console.error('[CRON] Error expiring old contact requests:', err);
  }
}, 60 * 60 * 1000); // every hour

module.exports = app;
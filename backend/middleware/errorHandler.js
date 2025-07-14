const config = require('../config');

// Error types for classification
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Operational errors (expected errors)
class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 400);
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
  }
}

// Database errors
class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500, false);
  }
}

// External service errors
class ExternalServiceError extends AppError {
  constructor(service, message = 'External service error') {
    super(`${service}: ${message}`, 502, false);
    this.service = service;
  }
}

// Error logging with different levels
const logError = (error, req = null) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    statusCode: error.statusCode || 500,
    timestamp: new Date().toISOString(),
    isOperational: error.isOperational !== false,
    url: req?.url,
    method: req?.method,
    ip: req?.ip,
    userAgent: req?.headers?.['user-agent'],
    userId: req?.user?._id
  };

  if (error.isOperational !== false) {
    // Operational errors - log as warning
    console.warn('[OPERATIONAL ERROR]', errorInfo);
  } else {
    // Programming errors - log as error
    console.error('[PROGRAMMING ERROR]', errorInfo);
  }

  // In production, you might want to send to external logging service
  if (config.get('NODE_ENV') === 'production') {
    // TODO: Send to external logging service (e.g., Sentry, LogRocket)
    // logToExternalService(errorInfo);
  }
};

// Handle MongoDB errors
const handleMongoError = (error) => {
  if (error.name === 'CastError') {
    return new ValidationError('Invalid ID format');
  }
  
  if (error.name === 'ValidationError') {
    const details = {};
    Object.keys(error.errors).forEach(key => {
      details[key] = error.errors[key].message;
    });
    return new ValidationError('Validation failed', details);
  }
  
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return new ConflictError(`${field} already exists`);
  }
  
  if (error.name === 'MongoNetworkError') {
    return new ExternalServiceError('Database', 'Connection failed');
  }
  
  return new DatabaseError(error.message);
};

// Handle JWT errors
const handleJWTError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token');
  }
  
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired');
  }
  
  return new AuthenticationError('Token verification failed');
};

// Handle Multer errors
const handleMulterError = (error) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new ValidationError('File too large');
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return new ValidationError('Too many files');
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new ValidationError('Unexpected file field');
  }
  
  return new ValidationError('File upload error');
};

// Main error handling middleware
const errorHandler = (error, req, res, next) => {
  let appError = error;

  // Convert known errors to AppError instances
  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    appError = handleMongoError(error);
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    appError = handleJWTError(error);
  } else if (error.code && error.code.startsWith('LIMIT_')) {
    appError = handleMulterError(error);
  } else if (!(error instanceof AppError)) {
    // Unknown error - treat as programming error
    appError = new AppError('Internal server error', 500, false);
  }

  // Log the error
  logError(appError, req);

  // Send error response
  const statusCode = appError.statusCode || 500;
  const message = appError.message || 'Something went wrong';
  
  const errorResponse = {
    error: {
      message,
      status: appError.status || 'error',
      ...(appError.details && { details: appError.details }),
      ...(config.get('NODE_ENV') === 'development' && {
        stack: appError.stack,
        originalError: error.message
      })
    }
  };

  // Add retry-after header for rate limit errors
  if (statusCode === 429) {
    res.setHeader('Retry-After', 60);
  }

  res.status(statusCode).json(errorResponse);
};

// 404 handler for unknown routes
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError('Route');
  next(error);
};

// Async error wrapper for route handlers
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    try {
      const { error } = schema.validate(req.body);
      if (error) {
        const details = {};
        error.details.forEach(detail => {
          details[detail.path[0]] = detail.message;
        });
        throw new ValidationError('Validation failed', details);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Request timeout middleware
const timeout = (ms = 30000) => {
  return (req, res, next) => {
    const timer = setTimeout(() => {
      next(new AppError('Request timeout', 408));
    }, ms);

    res.on('finish', () => {
      clearTimeout(timer);
    });

    next();
  };
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  validate,
  timeout,
  logError
}; 
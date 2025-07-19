const Joi = require('joi');

// Common validation patterns
const patterns = {
  phone: /^[6-9]\d{9}$/, // Indian mobile numbers
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  username: /^[a-zA-Z0-9_]{3,20}$/,
  objectId: /^[0-9a-fA-F]{24}$/
};

// Common validation messages
const messages = {
  'string.empty': '{{#label}} cannot be empty',
  'string.min': '{{#label}} must be at least {{#limit}} characters long',
  'string.max': '{{#label}} must not exceed {{#limit}} characters',
  'string.pattern.base': '{{#label}} format is invalid',
  'number.min': '{{#label}} must be at least {{#limit}}',
  'number.max': '{{#label}} must not exceed {{#limit}}',
  'any.required': '{{#label}} is required',
  'any.only': '{{#label}} must be one of {{#valids}}',
  'object.unknown': '{{#label}} is not allowed'
};

// User validation schemas
const userSchemas = {
  register: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages(messages),
    
    email: Joi.string()
      .email()
      .optional()
      .messages(messages),
    
    phone: Joi.string()
      .pattern(patterns.phone)
      .required()
      .messages(messages),
    
    password: Joi.string()
      .pattern(patterns.password)
      .min(8)
      .max(128)
      .required()
      .messages({
        ...messages,
        'string.pattern.base': 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character'
      }),
    
    role: Joi.string()
      .valid('user', 'farmer', 'vendor')
      .default('user')
      .messages(messages),
    
    address: Joi.object({
      street: Joi.string().max(200).allow(''),
      district: Joi.string().max(100).required(),
      state: Joi.string().max(100).required(),
      zipcode: Joi.string().pattern(/^[0-9]{6}$/).allow('')
    }).optional(),
    
    username: Joi.string()
      .pattern(patterns.username)
      .optional()
      .messages(messages),

    idToken: Joi.string().optional()
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .optional()
      .messages(messages),
    
    phone: Joi.string()
      .pattern(patterns.phone)
      .optional()
      .messages(messages),
    
    password: Joi.string()
      .required()
      .messages(messages)
  }).or('email', 'phone'),

  updateProfile: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .optional()
      .messages(messages),
    
    email: Joi.string()
      .email()
      .optional()
      .messages(messages),
    
    phone: Joi.string()
      .pattern(patterns.phone)
      .optional()
      .messages(messages),
    
    address: Joi.object({
      street: Joi.string().max(200).allow(''),
      district: Joi.string().max(100).required(),
      state: Joi.string().max(100).required(),
      zipcode: Joi.string().pattern(/^\d{6}$/).allow('')
    }).optional(),
    
    profileImageUrl: Joi.string()
      .uri()
      .optional()
      .messages(messages)
  }),

  resetPassword: Joi.object({
    phone: Joi.string()
      .pattern(patterns.phone)
      .required()
      .messages(messages),
    
    newPassword: Joi.string()
      .pattern(patterns.password)
      .min(8)
      .max(128)
      .required()
      .messages({
        ...messages,
        'string.pattern.base': 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character'
      }),
    
    idToken: Joi.string()
      .required()
      .messages(messages)
  })
};

// Product validation schemas
const productSchemas = {
  create: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages(messages),
    
    description: Joi.string()
      .min(10)
      .max(1000)
      .required()
      .messages(messages),
    
    price: Joi.number()
      .positive()
      .max(1000000)
      .required()
      .messages(messages),
    
    unit: Joi.string()
      .valid('kg', 'g', 'l', 'ml', 'piece', 'dozen', 'quintal', 'ton')
      .required()
      .messages(messages),
    
    category: Joi.string()
      .valid('vegetables', 'fruits', 'grains', 'pulses', 'oilseeds', 'spices', 'dairy')
      .required()
      .messages(messages),
    
    availableQuantity: Joi.number()
      .positive()
      .max(1000000)
      .required()
      .messages(messages),
    
    minimumOrderQuantity: Joi.number()
      .positive()
      .max(1000000)
      .optional()
      .allow(null)
      .messages(messages),
    
    harvestDate: Joi.date()
      .iso()
      .required()
      .messages(messages),
    
    isOrganic: Joi.boolean()
      .default(false)
      .messages(messages),
    
    location: Joi.object({
      district: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages(messages),
      state: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages(messages)
    }).required(),
    
    storageInfo: Joi.string()
      .max(500)
      .optional()
      .allow('')
      .messages(messages),
    
    nutritionalInfo: Joi.object({
      calories: Joi.number().positive().optional(),
      protein: Joi.string().max(50).optional(),
      carbs: Joi.string().max(50).optional(),
      fat: Joi.string().max(50).optional(),
      fiber: Joi.string().max(50).optional(),
      vitamins: Joi.string().max(100).optional()
    }).optional()
  }),

  update: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .optional()
      .messages(messages),
    
    description: Joi.string()
      .min(10)
      .max(1000)
      .optional()
      .messages(messages),
    
    price: Joi.number()
      .positive()
      .max(1000000)
      .optional()
      .messages(messages),
    
    unit: Joi.string()
      .valid('kg', 'g', 'l', 'ml', 'piece', 'dozen', 'quintal', 'ton')
      .optional()
      .messages(messages),
    
    category: Joi.string()
      .valid('vegetables', 'fruits', 'grains', 'pulses', 'oilseeds', 'spices', 'dairy')
      .optional()
      .messages(messages),
    
    availableQuantity: Joi.number()
      .positive()
      .max(1000000)
      .optional()
      .messages(messages),
    
    minimumOrderQuantity: Joi.number()
      .positive()
      .max(1000000)
      .optional()
      .allow(null)
      .messages(messages),
    
    harvestDate: Joi.date()
      .iso()
      .optional()
      .messages(messages),
    
    isOrganic: Joi.boolean()
      .optional()
      .messages(messages),
    
    location: Joi.object({
      district: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages(messages),
      state: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages(messages)
    }).optional(),
    
    storageInfo: Joi.string()
      .max(500)
      .optional()
      .allow('')
      .messages(messages),
    
    nutritionalInfo: Joi.object({
      calories: Joi.number().positive().optional(),
      protein: Joi.string().max(50).optional(),
      carbs: Joi.string().max(50).optional(),
      fat: Joi.string().max(50).optional(),
      fiber: Joi.string().max(50).optional(),
      vitamins: Joi.string().max(100).optional()
    }).optional()
  }),

  query: Joi.object({
    category: Joi.string().optional(),
    minPrice: Joi.number().positive().optional(),
    maxPrice: Joi.number().positive().optional(),
    district: Joi.string().allow('').optional(),
    state: Joi.string().allow('').optional(),
    search: Joi.string().max(100).allow('').optional(),
    isOrganic: Joi.boolean().optional(),
    sort: Joi.string().valid('price-asc', 'price-desc', 'newest', 'featured').optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional()
  }),

  review: Joi.object({
    rating: Joi.number()
      .integer()
      .min(1)
      .max(5)
      .required()
      .messages(messages),
    
    comment: Joi.string()
      .min(10)
      .max(500)
      .required()
      .messages(messages)
  })
};

// Contact request validation schemas
const contactRequestSchemas = {
  create: Joi.object({
    productId: Joi.string()
      .pattern(patterns.objectId)
      .required()
      .messages(messages),
    
    requestedQuantity: Joi.number()
      .positive()
      .max(1000000)
      .required()
      .messages(messages)
  }),

  confirm: Joi.object({
    finalQuantity: Joi.number()
      .positive()
      .max(1000000)
      .required()
      .messages(messages),
    
    finalPrice: Joi.number()
      .positive()
      .max(1000000)
      .required()
      .messages(messages),
    
    didBuy: Joi.boolean()
      .required()
      .messages(messages),
    
    didSell: Joi.boolean()
      .required()
      .messages(messages),
    
    feedback: Joi.string()
      .max(500)
      .optional()
      .allow('')
      .messages(messages)
  })
};

// Admin validation schemas
const adminSchemas = {
  login: Joi.object({
    username: Joi.string()
      .min(3)
      .max(50)
      .required()
      .messages(messages),
    password: Joi.string()
      .required()
      .messages(messages),
    deviceFingerprint: Joi.string()
      .required()
      .messages(messages)
  }),
  changeUserRole: Joi.object({
    userId: Joi.string().pattern(patterns.objectId).required().messages(messages),
    role: Joi.string().valid('user', 'farmer', 'vendor', 'admin').required().messages(messages)
  })
};

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = {};
      error.details.forEach(detail => {
        const field = detail.path.join('.');
        details[field] = detail.message;
      });

      return res.status(400).json({
        error: 'Validation failed',
        details
      });
    }

    // Replace req.body with validated data
    req.body = value;
    next();
  };
};

// Query validation middleware
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = {};
      error.details.forEach(detail => {
        const field = detail.path.join('.');
        details[field] = detail.message;
      });

      return res.status(400).json({
        error: 'Invalid query parameters',
        details
      });
    }

    // Replace req.query with validated data
    req.query = value;
    next();
  };
};

// ObjectId validation middleware
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!patterns.objectId.test(id)) {
      return res.status(400).json({
        error: 'Invalid ID format',
        field: paramName
      });
    }
    next();
  };
};

module.exports = {
  patterns,
  messages,
  userSchemas,
  productSchemas,
  contactRequestSchemas,
  adminSchemas,
  validate,
  validateQuery,
  validateObjectId,
};

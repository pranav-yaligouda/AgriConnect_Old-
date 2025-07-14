// Configuration management class
// Handles environment variables and provides type-safe access
const dotenv = require('dotenv');
const path = require('path');

class Config {
  constructor() {
    // Always load .env from the project root
    const envPath = path.resolve(__dirname, '../', '.env');
    const result = dotenv.config({ 
      path: envPath,
      encoding: 'utf8'
    });
  
    if (result.error) {
      console.warn(`[Config] Could not load .env: ${result.error.message}. Falling back to existing environment variables.`);
    }
  }

  // Get raw environment variable value
  get(key) {
    const value = process.env[key];
    if (value === undefined) {
      console.warn(`Environment variable ${key} is not set`);
    }
    return value;
  }

  // Parse and return value as boolean
  getAsBoolean(key) {
    const value = this.get(key);
    return value ? value.toLowerCase() === 'true' : false;
  }

  // Parse and return value as number
  getAsNumber(key) {
    const value = this.get(key);
    return value ? parseInt(value, 10) : undefined;
  }

  // Parse and return value as array
  getAsArray(key, separator = ',') {
    const value = this.get(key);
    return value ? value.split(separator).map(item => item.trim()) : [];
  }

  // Parse and return value as object
  getAsObject(key) {
    const value = this.get(key);
    try {
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Failed to parse ${key} as JSON: ${error.message}`);
      return null;
    }
  }

  // Validate required environment variables
  validate() {
    const required = [
      'NODE_ENV',
      'PORT',
      'MONGODB_URI',
      'JWT_SECRET',
      'FRONTEND_URL',
      'RATE_LIMIT_MAX',
      'UPLOAD_DIR',
      'MAX_FILE_SIZE',
      'ALLOWED_FILE_TYPES'
    ];

    const missing = required.filter(key => !this.get(key));
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Additional validations
    const validations = [
      {
        key: 'PORT',
        validate: value => !isNaN(value) && value > 0 && value < 65536,
        message: 'PORT must be a valid port number between 0 and 65536'
      },
      {
        key: 'JWT_SECRET',
        validate: value => value && value.length >= 32,
        message: 'JWT_SECRET must be at least 32 characters long'
      },
      {
        key: 'MONGODB_URI',
        validate: value => value.startsWith('mongodb'),
        message: 'MONGODB_URI must be a valid MongoDB connection string'
      },
      {
        key: 'MAX_FILE_SIZE',
        validate: value => !isNaN(value) && value > 0,
        message: 'MAX_FILE_SIZE must be a positive number'
      }
    ];

    const failedValidations = validations
      .filter(v => !v.validate(this.get(v.key)))
      .map(v => `${v.key}: ${v.message}`);

    if (failedValidations.length > 0) {
      throw new Error(`Invalid environment variables: ${failedValidations.join(', ')}`);
    }
  }
}

// Export singleton instance
module.exports = new Config();
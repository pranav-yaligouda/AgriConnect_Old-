/**
 * Testing Utilities
 * 
 * Contains helpful functions for development and testing
 */
const seedTestUsers = require('./seedTestUsers');

/**
 * Set up testing environment
 * Only runs in development mode
 */
const setupTestingEnvironment = async () => {
  // Only run in development mode
  if (process.env.NODE_ENV !== 'production') {
    console.log('Setting up testing environment...');
    
    try {
      // Seed test users
      await seedTestUsers();
      
      console.log('Testing environment setup complete');
    } catch (error) {
      console.error('Error setting up testing environment:', error);
    }
  }
};

module.exports = {
  setupTestingEnvironment
};

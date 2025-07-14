#!/usr/bin/env node

/**
 * AgriConnect Production Deployment Script
 * 
 * This script handles production deployment with security checks,
 * environment validation, and deployment best practices.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}=== ${msg} ===${colors.reset}`)
};

class ProductionDeployer {
  constructor() {
    this.checks = [];
    this.errors = [];
    this.warnings = [];
  }

  addCheck(name, fn) {
    this.checks.push({ name, fn });
  }

  addError(message) {
    this.errors.push(message);
  }

  addWarning(message) {
    this.warnings.push(message);
  }

  // Check if we're in production environment
  checkEnvironment() {
    log.section('Environment Check');
    
    if (process.env.NODE_ENV !== 'production') {
      this.addError('NODE_ENV must be set to "production" for deployment');
    } else {
      log.success('NODE_ENV is set to production');
    }

    // Check for required production environment variables
    const requiredVars = [
      'MONGODB_URI',
      'JWT_SECRET',
      'FRONTEND_URL',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      this.addError(`Missing required environment variables: ${missingVars.join(', ')}`);
    } else {
      log.success('All required environment variables are set');
    }

    // Check for development-only variables that shouldn't be in production
    const devOnlyVars = ['DEBUG', 'VERBOSE_LOGGING'];
    const devVarsFound = devOnlyVars.filter(varName => 
      process.env[varName] && process.env[varName] !== 'false'
    );
    
    if (devVarsFound.length > 0) {
      this.addWarning(`Development variables found in production: ${devVarsFound.join(', ')}`);
    }
  }

  // Check for security issues
  async checkSecurity() {
    log.section('Security Check');
    
    try {
      // Run security audit
      const SecurityAuditor = require('./securityAudit');
      const auditor = new SecurityAuditor();
      
      // Override console methods to capture output
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;
      
      let auditOutput = '';
      console.log = (msg) => { auditOutput += msg + '\n'; };
      console.error = (msg) => { auditOutput += msg + '\n'; };
      console.warn = (msg) => { auditOutput += msg + '\n'; };
      
      await auditor.runAudit();
      
      // Restore console methods
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      
      // Check for high-severity issues
      if (auditOutput.includes('CRITICAL:') || auditOutput.includes('high-severity issues')) {
        this.addError('Security audit failed - high-severity issues found');
      } else {
        log.success('Security audit passed');
      }
      
    } catch (error) {
      this.addError(`Security check failed: ${error.message}`);
    }
  }

  // Check dependencies
  checkDependencies() {
    log.section('Dependencies Check');
    
    try {
      // Check if package-lock.json exists
      if (!fs.existsSync('package-lock.json')) {
        this.addError('package-lock.json not found - run npm install first');
        return;
      }

      // Check for outdated packages
      try {
        const outdatedOutput = execSync('npm outdated --json', { encoding: 'utf8' });
        const outdated = JSON.parse(outdatedOutput);
        
        if (Object.keys(outdated).length > 0) {
          this.addWarning(`${Object.keys(outdated).length} packages are outdated`);
          Object.keys(outdated).forEach(pkg => {
            log.warning(`  ${pkg}: ${outdated[pkg].current} -> ${outdated[pkg].latest}`);
          });
        } else {
          log.success('All packages are up to date');
        }
      } catch (error) {
        // npm outdated returns non-zero exit code when packages are outdated
        log.warning('Some packages may be outdated - consider updating');
      }

      // Check for vulnerabilities
      try {
        const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
        const audit = JSON.parse(auditOutput);
        
        if (audit.metadata.vulnerabilities.high > 0 || audit.metadata.vulnerabilities.critical > 0) {
          this.addError(`Security vulnerabilities found: ${audit.metadata.vulnerabilities.critical} critical, ${audit.metadata.vulnerabilities.high} high`);
        } else {
          log.success('No critical or high vulnerabilities found');
        }
      } catch (error) {
        this.addWarning('Could not check for vulnerabilities - run npm audit manually');
      }
      
    } catch (error) {
      this.addError(`Dependencies check failed: ${error.message}`);
    }
  }

  // Check file structure
  checkFileStructure() {
    log.section('File Structure Check');
    
    const requiredFiles = [
      'server.js',
      'package.json',
      'package-lock.json',
      'config/index.js',
      'middleware/auth.js',
      'middleware/security.js',
      'middleware/errorHandler.js',
      'middleware/monitoring.js',
      'utils/validation.js',
      'utils/cloudinary.js'
    ];

    const requiredDirs = [
      'controllers',
      'models',
      'routes',
      'middleware',
      'utils',
      'config'
    ];

    // Check required files
    const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
    if (missingFiles.length > 0) {
      this.addError(`Missing required files: ${missingFiles.join(', ')}`);
    } else {
      log.success('All required files exist');
    }

    // Check required directories
    const missingDirs = requiredDirs.filter(dir => !fs.existsSync(dir));
    if (missingDirs.length > 0) {
      this.addError(`Missing required directories: ${missingDirs.join(', ')}`);
    } else {
      log.success('All required directories exist');
    }

    // Check for sensitive files that shouldn't be in production
    const sensitiveFiles = [
      '.env',
      'config/serviceAccountKey.json',
      'logs/',
      'uploads/',
      'node_modules/'
    ];

    sensitiveFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.addWarning(`Sensitive file/directory found: ${file}`);
      }
    });
  }

  // Check database connection
  async checkDatabase() {
    log.section('Database Check');
    
    try {
      // Test database connection
      const mongoose = require('mongoose');
      const mongoUri = process.env.MONGODB_URI;
      
      if (!mongoUri) {
        this.addError('MONGODB_URI not set');
        return;
      }

      // Check if it's a production MongoDB URI
      if (mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1')) {
        this.addWarning('Using localhost MongoDB - ensure this is correct for production');
      }

      // Test connection
      await mongoose.connect(mongoUri, { 
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 5000
      });
      
      log.success('Database connection successful');
      
      // Check if database is empty (warning for production)
      const collections = await mongoose.connection.db.listCollections().toArray();
      if (collections.length === 0) {
        this.addWarning('Database appears to be empty');
      } else {
        log.success(`Database has ${collections.length} collections`);
      }
      
      await mongoose.disconnect();
      
    } catch (error) {
      this.addError(`Database connection failed: ${error.message}`);
    }
  }

  // Check Cloudinary configuration
  checkCloudinary() {
    log.section('Cloudinary Check');
    
    const requiredVars = [
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      this.addError(`Missing Cloudinary variables: ${missingVars.join(', ')}`);
    } else {
      log.success('Cloudinary configuration is complete');
    }

    // Check if Cloudinary config file exists
    if (!fs.existsSync('utils/cloudinary.js')) {
      this.addError('Cloudinary configuration file not found');
    } else {
      log.success('Cloudinary configuration file exists');
    }
  }

  // Check SSL/TLS configuration
  checkSSL() {
    log.section('SSL/TLS Check');
    
    // Check if HTTPS is enforced
    if (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.startsWith('https://')) {
      this.addWarning('Frontend URL is not using HTTPS');
    } else {
      log.success('Frontend URL uses HTTPS');
    }

    // Check for HTTPS enforcement middleware
    try {
      const serverContent = fs.readFileSync('server.js', 'utf8');
      if (serverContent.includes('enforceHttps') || serverContent.includes('https')) {
        log.success('HTTPS enforcement is configured');
      } else {
        this.addWarning('HTTPS enforcement middleware not found');
      }
    } catch (error) {
      this.addWarning('Could not check HTTPS configuration');
    }
  }

  // Check logging configuration
  checkLogging() {
    log.section('Logging Check');
    
    // Check if logs directory exists
    if (!fs.existsSync('logs')) {
      this.addWarning('Logs directory not found - create it for production logging');
    } else {
      log.success('Logs directory exists');
    }

    // Check logging configuration
    const logLevel = process.env.LOG_LEVEL || 'info';
    if (logLevel === 'debug' || logLevel === 'verbose') {
      this.addWarning('Log level is set to debug/verbose - consider using info or warn for production');
    } else {
      log.success(`Log level is set to ${logLevel}`);
    }
  }

  // Check performance configuration
  checkPerformance() {
    log.section('Performance Check');
    
    // Check rate limiting
    const rateLimit = process.env.RATE_LIMIT_MAX;
    if (!rateLimit) {
      this.addWarning('Rate limit not configured');
    } else {
      const limit = parseInt(rateLimit);
      if (limit > 1000) {
        this.addWarning('Rate limit is very high - consider reducing for production');
      } else {
        log.success(`Rate limit is set to ${limit}`);
      }
    }

    // Check request timeout
    const timeout = process.env.REQUEST_TIMEOUT || 30000;
    if (timeout > 60000) {
      this.addWarning('Request timeout is very high - consider reducing for production');
    } else {
      log.success(`Request timeout is set to ${timeout}ms`);
    }
  }

  // Run deployment checks
  async runChecks() {
    log.info('Starting production deployment checks...\n');
    
    this.checkEnvironment();
    await this.checkSecurity();
    this.checkDependencies();
    this.checkFileStructure();
    await this.checkDatabase();
    this.checkCloudinary();
    this.checkSSL();
    this.checkLogging();
    this.checkPerformance();
    
    return this.generateReport();
  }

  // Generate deployment report
  generateReport() {
    log.section('Deployment Report');
    
    console.log(`\n${colors.green}Checks Passed: ${this.checks.length}${colors.reset}`);
    
    if (this.warnings.length > 0) {
      console.log(`\n${colors.yellow}Warnings: ${this.warnings.length}${colors.reset}`);
      this.warnings.forEach(warning => {
        console.log(`  ⚠️  ${warning}`);
      });
    }
    
    if (this.errors.length > 0) {
      console.log(`\n${colors.red}Errors: ${this.errors.length}${colors.reset}`);
      this.errors.forEach(error => {
        console.log(`  ❌ ${error}`);
      });
    }

    // Summary
    console.log(`\n${colors.cyan}Summary:${colors.reset}`);
    console.log(`  Total Checks: ${this.checks.length}`);
    console.log(`  Warnings: ${this.warnings.length}`);
    console.log(`  Errors: ${this.errors.length}`);

    if (this.errors.length > 0) {
      console.log(`\n${colors.red}DEPLOYMENT BLOCKED: ${this.errors.length} errors found!${colors.reset}`);
      console.log('Please fix all errors before deploying to production.');
      return false;
    } else if (this.warnings.length > 0) {
      console.log(`\n${colors.yellow}DEPLOYMENT WARNING: ${this.warnings.length} warnings found.${colors.reset}`);
      console.log('Consider addressing warnings before deploying to production.');
      return true;
    } else {
      console.log(`\n${colors.green}DEPLOYMENT READY: All checks passed!${colors.reset}`);
      return true;
    }
  }

  // Deploy to production
  async deploy() {
    log.section('Production Deployment');
    
    const canDeploy = await this.runChecks();
    
    if (!canDeploy) {
      log.error('Deployment aborted due to errors');
      process.exit(1);
    }

    log.info('Starting deployment process...');
    
    try {
      // Install production dependencies
      log.info('Installing production dependencies...');
      execSync('npm ci --only=production', { stdio: 'inherit' });
      log.success('Dependencies installed');

      // Create logs directory if it doesn't exist
      if (!fs.existsSync('logs')) {
        fs.mkdirSync('logs', { recursive: true });
        log.success('Logs directory created');
      }

      // Set production environment
      process.env.NODE_ENV = 'production';
      
      // Start the application
      log.info('Starting production server...');
      execSync('node server.js', { stdio: 'inherit' });
      
    } catch (error) {
      log.error(`Deployment failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// Run deployment if this script is executed directly
if (require.main === module) {
  const deployer = new ProductionDeployer();
  
  const command = process.argv[2];
  
  if (command === 'check') {
    deployer.runChecks().then(canDeploy => {
      process.exit(canDeploy ? 0 : 1);
    });
  } else if (command === 'deploy') {
    deployer.deploy();
  } else {
    console.log('Usage:');
    console.log('  node deploy.js check  - Run deployment checks');
    console.log('  node deploy.js deploy - Deploy to production');
    process.exit(1);
  }
}

module.exports = ProductionDeployer; 
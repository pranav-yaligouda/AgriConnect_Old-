#!/usr/bin/env node

/**
 * AgriConnect Security Audit Script
 * 
 * This script performs a comprehensive security audit of the application
 * including configuration validation, dependency checks, and security best practices.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}=== ${msg} ===${colors.reset}`)
};

class SecurityAuditor {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.passed = [];
  }

  addIssue(severity, message, details = null) {
    this.issues.push({ severity, message, details });
  }

  addWarning(message, details = null) {
    this.warnings.push({ message, details });
  }

  addPassed(message) {
    this.passed.push(message);
  }

  // Check environment variables
  checkEnvironmentVariables() {
    log.section('Environment Variables Audit');
    
    const requiredVars = [
      'NODE_ENV',
      'PORT',
      'MONGODB_URI',
      'JWT_SECRET',
      'FRONTEND_URL',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET'
    ];

    const sensitiveVars = [
      'JWT_SECRET',
      'CLOUDINARY_API_SECRET',
      'FIREBASE_PRIVATE_KEY',
      'STRIPE_SECRET_KEY'
    ];

    // Check for required variables
    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        this.addIssue('HIGH', `Missing required environment variable: ${varName}`);
      } else {
        this.addPassed(`Environment variable ${varName} is set`);
      }
    });

    // Check JWT secret strength
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret) {
      if (jwtSecret.length < 32) {
        this.addIssue('HIGH', 'JWT_SECRET is too short (minimum 32 characters)');
      } else if (jwtSecret.length < 64) {
        this.addWarning('JWT_SECRET should be at least 64 characters for production');
      } else {
        this.addPassed('JWT_SECRET meets security requirements');
      }
    }

    // Check for weak secrets
    const weakSecrets = ['secret', 'password', '123456', 'admin', 'test'];
    sensitiveVars.forEach(varName => {
      const value = process.env[varName];
      if (value && weakSecrets.some(weak => value.toLowerCase().includes(weak))) {
        this.addIssue('HIGH', `Weak ${varName} detected`);
      }
    });
  }

  // Check package.json for vulnerabilities
  async checkDependencies() {
    log.section('Dependencies Security Audit');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Check for known vulnerable packages
      const vulnerablePackages = [
        'express-session@1.17.0',
        'lodash@4.17.0',
        'moment@2.29.0'
      ];

      for (const [pkg, version] of Object.entries(dependencies)) {
        const fullPkg = `${pkg}@${version}`;
        if (vulnerablePackages.includes(fullPkg)) {
          this.addIssue('HIGH', `Vulnerable package detected: ${fullPkg}`);
        } else {
          this.addPassed(`Package ${pkg}@${version} appears safe`);
        }
      }

      // Check for outdated packages
      this.addWarning('Consider running npm audit to check for vulnerabilities');
      
    } catch (error) {
      this.addIssue('MEDIUM', 'Could not read package.json', error.message);
    }
  }

  // Check file permissions
  checkFilePermissions() {
    log.section('File Permissions Audit');
    
    const sensitiveFiles = [
      '.env',
      'config/serviceAccountKey.json',
      'logs/',
      'uploads/'
    ];

    sensitiveFiles.forEach(file => {
      try {
        if (fs.existsSync(file)) {
          const stats = fs.statSync(file);
          const mode = stats.mode.toString(8);
          
          // Check if files are readable by others
          if (mode.endsWith('6') || mode.endsWith('7')) {
            this.addIssue('MEDIUM', `File ${file} has loose permissions: ${mode}`);
          } else {
            this.addPassed(`File ${file} has secure permissions: ${mode}`);
          }
        }
      } catch (error) {
        this.addWarning(`Could not check permissions for ${file}`);
      }
    });
  }

  // Check for hardcoded secrets
  checkHardcodedSecrets() {
    log.section('Hardcoded Secrets Audit');
    
    const codeFiles = [
      'server.js',
      'config/index.js',
      'middleware/auth.js',
      'controllers/userController.js',
      'controllers/productController.js'
    ];

    const secretPatterns = [
      /password\s*[:=]\s*['"`][^'"`]+['"`]/gi,
      /secret\s*[:=]\s*['"`][^'"`]+['"`]/gi,
      /key\s*[:=]\s*['"`][^'"`]+['"`]/gi,
      /token\s*[:=]\s*['"`][^'"`]+['"`]/gi,
      /api_key\s*[:=]\s*['"`][^'"`]+['"`]/gi
    ];

    codeFiles.forEach(file => {
      try {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          let foundSecrets = false;

          secretPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
              matches.forEach(match => {
                // Skip obvious false positives
                if (!match.includes('process.env') && 
                    !match.includes('config.get') &&
                    !match.includes('placeholder') &&
                    !match.includes('example')) {
                  this.addIssue('HIGH', `Potential hardcoded secret in ${file}: ${match.substring(0, 50)}...`);
                  foundSecrets = true;
                }
              });
            }
          });

          if (!foundSecrets) {
            this.addPassed(`No hardcoded secrets found in ${file}`);
          }
        }
      } catch (error) {
        this.addWarning(`Could not check ${file} for secrets`);
      }
    });
  }

  // Check CORS configuration
  checkCORSConfiguration() {
    log.section('CORS Configuration Audit');
    
    try {
      const serverContent = fs.readFileSync('server.js', 'utf8');
      
      // Check for overly permissive CORS
      if (serverContent.includes('origin: "*"') || serverContent.includes('origin: true')) {
        this.addIssue('HIGH', 'Overly permissive CORS configuration detected');
      } else if (serverContent.includes('ALLOWED_ORIGINS')) {
        this.addPassed('CORS is configured with allowed origins');
      } else {
        this.addWarning('CORS configuration should be reviewed');
      }

      // Check for credentials
      if (serverContent.includes('credentials: true')) {
        this.addPassed('CORS credentials are properly configured');
      } else {
        this.addWarning('CORS credentials configuration should be reviewed');
      }

    } catch (error) {
      this.addWarning('Could not check CORS configuration');
    }
  }

  // Check authentication configuration
  checkAuthenticationConfiguration() {
    log.section('Authentication Configuration Audit');
    
    try {
      const authContent = fs.readFileSync('middleware/auth.js', 'utf8');
      
      // Check for JWT verification
      if (authContent.includes('jwt.verify')) {
        this.addPassed('JWT verification is implemented');
      } else {
        this.addIssue('HIGH', 'JWT verification not found in auth middleware');
      }

      // Check for token expiration
      if (authContent.includes('expiresIn') || authContent.includes('exp')) {
        this.addPassed('Token expiration is configured');
      } else {
        this.addWarning('Token expiration should be configured');
      }

      // Check for role-based authorization
      if (authContent.includes('authorize') || authContent.includes('role')) {
        this.addPassed('Role-based authorization is implemented');
      } else {
        this.addWarning('Role-based authorization should be implemented');
      }

    } catch (error) {
      this.addWarning('Could not check authentication configuration');
    }
  }

  // Check input validation
  checkInputValidation() {
    log.section('Input Validation Audit');
    
    try {
      const validationContent = fs.readFileSync('utils/validation.js', 'utf8');
      
      if (validationContent.includes('Joi.object')) {
        this.addPassed('Input validation schemas are defined');
      } else {
        this.addIssue('MEDIUM', 'Input validation schemas not found');
      }

      if (validationContent.includes('sanitize') || validationContent.includes('escape')) {
        this.addPassed('Input sanitization is implemented');
      } else {
        this.addWarning('Input sanitization should be implemented');
      }

    } catch (error) {
      this.addIssue('MEDIUM', 'Input validation file not found');
    }
  }

  // Check for SQL injection prevention
  checkSQLInjectionPrevention() {
    log.section('SQL Injection Prevention Audit');
    
    try {
      const files = [
        'controllers/userController.js',
        'controllers/productController.js',
        'controllers/contactRequestController.js'
      ];

      let foundPrevention = false;
      files.forEach(file => {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          
          // Check for parameterized queries or ORM usage
          if (content.includes('findOne') || 
              content.includes('findById') || 
              content.includes('create') ||
              content.includes('updateOne') ||
              content.includes('deleteOne')) {
            foundPrevention = true;
          }
        }
      });

      if (foundPrevention) {
        this.addPassed('MongoDB operations use safe methods');
      } else {
        this.addIssue('HIGH', 'No safe database operations found');
      }

    } catch (error) {
      this.addWarning('Could not check SQL injection prevention');
    }
  }

  // Check for XSS prevention
  checkXSSPrevention() {
    log.section('XSS Prevention Audit');
    
    try {
      const serverContent = fs.readFileSync('server.js', 'utf8');
      
      if (serverContent.includes('xss-clean') || serverContent.includes('xss()')) {
        this.addPassed('XSS protection middleware is configured');
      } else {
        this.addIssue('MEDIUM', 'XSS protection middleware not found');
      }

      if (serverContent.includes('helmet') || serverContent.includes('Content-Security-Policy')) {
        this.addPassed('Security headers are configured');
      } else {
        this.addIssue('MEDIUM', 'Security headers not configured');
      }

    } catch (error) {
      this.addWarning('Could not check XSS prevention');
    }
  }

  // Check rate limiting
  checkRateLimiting() {
    log.section('Rate Limiting Audit');
    
    try {
      const serverContent = fs.readFileSync('server.js', 'utf8');
      
      if (serverContent.includes('rate-limit') || serverContent.includes('express-rate-limit')) {
        this.addPassed('Rate limiting is configured');
      } else {
        this.addIssue('MEDIUM', 'Rate limiting not configured');
      }

      if (serverContent.includes('slow-down') || serverContent.includes('express-slow-down')) {
        this.addPassed('Speed limiting is configured');
      } else {
        this.addWarning('Speed limiting should be configured');
      }

    } catch (error) {
      this.addWarning('Could not check rate limiting');
    }
  }

  // Generate security report
  generateReport() {
    log.section('Security Audit Report');
    
    console.log(`\n${colors.green}Passed Checks: ${this.passed.length}${colors.reset}`);
    this.passed.forEach(item => {
      console.log(`  ✅ ${item}`);
    });

    console.log(`\n${colors.yellow}Warnings: ${this.warnings.length}${colors.reset}`);
    this.warnings.forEach(item => {
      console.log(`  ⚠️  ${item.message}`);
      if (item.details) {
        console.log(`     Details: ${item.details}`);
      }
    });

    console.log(`\n${colors.red}Issues: ${this.issues.length}${colors.reset}`);
    this.issues.forEach(item => {
      const severityColor = item.severity === 'HIGH' ? colors.red : colors.yellow;
      console.log(`  ${severityColor}${item.severity}${colors.reset}: ${item.message}`);
      if (item.details) {
        console.log(`     Details: ${item.details}`);
      }
    });

    // Summary
    const highIssues = this.issues.filter(i => i.severity === 'HIGH').length;
    const mediumIssues = this.issues.filter(i => i.severity === 'MEDIUM').length;
    
    console.log(`\n${colors.cyan}Summary:${colors.reset}`);
    console.log(`  Total Checks: ${this.passed.length + this.warnings.length + this.issues.length}`);
    console.log(`  Passed: ${this.passed.length}`);
    console.log(`  Warnings: ${this.warnings.length}`);
    console.log(`  Issues: ${this.issues.length} (${highIssues} High, ${mediumIssues} Medium)`);

    if (highIssues > 0) {
      console.log(`\n${colors.red}CRITICAL: ${highIssues} high-severity issues found!${colors.reset}`);
      process.exit(1);
    } else if (this.issues.length > 0) {
      console.log(`\n${colors.yellow}WARNING: ${this.issues.length} issues found that should be addressed.${colors.reset}`);
    } else {
      console.log(`\n${colors.green}SUCCESS: No security issues found!${colors.reset}`);
    }
  }

  // Run all security checks
  async runAudit() {
    log.info('Starting security audit...\n');
    
    this.checkEnvironmentVariables();
    await this.checkDependencies();
    this.checkFilePermissions();
    this.checkHardcodedSecrets();
    this.checkCORSConfiguration();
    this.checkAuthenticationConfiguration();
    this.checkInputValidation();
    this.checkSQLInjectionPrevention();
    this.checkXSSPrevention();
    this.checkRateLimiting();
    
    this.generateReport();
  }
}

// Run the audit if this script is executed directly
if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor.runAudit().catch(error => {
    log.error('Security audit failed: ' + error.message);
    process.exit(1);
  });
}

module.exports = SecurityAuditor; 
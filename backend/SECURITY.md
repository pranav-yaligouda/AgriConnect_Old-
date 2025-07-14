# 🔒 AgriConnect Security Documentation

This document outlines the comprehensive security measures implemented in the AgriConnect backend to ensure production-grade security and robustness.

## 🛡️ Security Features Overview

### 1. **Advanced Authentication & Authorization**
- **JWT-based authentication** with configurable expiration
- **Role-based access control** (user, farmer, vendor, admin)
- **Token versioning** for session invalidation
- **Device fingerprinting** for admin access
- **Password strength validation** with configurable policies

### 2. **Input Validation & Sanitization**
- **Joi schema validation** for all API endpoints
- **Input sanitization** to prevent XSS attacks
- **NoSQL injection prevention** with express-mongo-sanitize
- **HTTP Parameter Pollution** prevention with hpp
- **Request size validation** with configurable limits

### 3. **Rate Limiting & DDoS Protection**
- **Multi-tier rate limiting**:
  - General API: 100 requests per 15 minutes
  - Authentication: 5 attempts per 15 minutes
  - File uploads: 10 uploads per hour
- **Speed limiting** for brute force protection
- **IP-based rate limiting** with proper headers

### 4. **Security Headers & CSP**
- **Helmet.js** for security headers
- **Content Security Policy** (CSP) with strict directives
- **XSS Protection** headers
- **Frame options** to prevent clickjacking
- **Content type sniffing** prevention

### 5. **Error Handling & Logging**
- **Structured error handling** with proper classification
- **Security event logging** for suspicious activities
- **Performance monitoring** with response time tracking
- **Error sanitization** to prevent information leakage

### 6. **File Upload Security**
- **File type validation** (images only)
- **File size limits** (2MB for profiles, 5MB for products)
- **Cloudinary integration** for secure cloud storage
- **Virus scanning** recommendations

### 7. **Database Security**
- **MongoDB injection prevention**
- **Connection string validation**
- **Query sanitization**
- **Database monitoring** and connection health checks

## 🔧 Configuration

### Environment Variables

```bash
# Security Configuration
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRES_IN=7d
RATE_LIMIT_MAX=100

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CORS_CREDENTIALS=true

# File Upload Limits
MAX_PROFILE_IMAGE_SIZE=2097152
MAX_PRODUCT_IMAGE_SIZE=5242880
MAX_PRODUCT_IMAGES=5

# Request Timeout
REQUEST_TIMEOUT=30000
```

### Security Headers Configuration

```javascript
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
```

## 🚀 Security Audit & Deployment

### Running Security Audit

```bash
# Run comprehensive security audit
npm run security-audit

# Check deployment readiness
npm run deploy-check

# Deploy to production
npm run deploy
```

### Security Audit Features

The security audit checks for:

- **Environment variable validation**
- **Dependency vulnerabilities**
- **File permissions**
- **Hardcoded secrets**
- **CORS configuration**
- **Authentication setup**
- **Input validation**
- **SQL injection prevention**
- **XSS protection**
- **Rate limiting configuration**

## 📊 Monitoring & Analytics

### Health Check Endpoints

```bash
# Application health
GET /health

# Prometheus metrics
GET /metrics
```

### Monitoring Features

- **Request/response monitoring**
- **Performance metrics**
- **Error tracking**
- **Security event logging**
- **Database connection monitoring**
- **Memory and CPU usage tracking**

## 🔍 Security Best Practices

### 1. **Password Security**
```javascript
// Password validation schema
const passwordSchema = Joi.string()
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
  .min(8)
  .max(128)
  .required();
```

### 2. **Input Validation**
```javascript
// Example validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details
      });
    }
    
    req.body = value;
    next();
  };
};
```

### 3. **Error Handling**
```javascript
// Structured error handling
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
  }
}
```

### 4. **Rate Limiting**
```javascript
// Multi-tier rate limiting
const rateLimiters = createRateLimiters();
app.use('/api/auth', rateLimiters.auth); // Stricter for auth
app.use('/api/users/profile/image', rateLimiters.upload); // Stricter for uploads
app.use('/api', rateLimiters.general); // General rate limiting
```

## 🚨 Security Incident Response

### 1. **Suspicious Activity Detection**
- **Pattern-based detection** for common attack vectors
- **Rate limit violations** logging
- **Failed authentication attempts** tracking
- **Unusual request patterns** monitoring

### 2. **Incident Response Steps**
1. **Immediate Response**
   - Block suspicious IP addresses
   - Increase rate limiting temporarily
   - Monitor affected endpoints

2. **Investigation**
   - Review security logs
   - Analyze attack patterns
   - Identify affected systems

3. **Recovery**
   - Implement additional security measures
   - Update security configurations
   - Notify stakeholders if necessary

### 3. **Logging & Alerting**
```javascript
// Security event logging
const securityLogging = (req, res, next) => {
  const suspiciousPatterns = [
    /\.\.\//, // Directory traversal
    /<script/i, // XSS attempts
    /union\s+select/i, // SQL injection
    /eval\s*\(/i, // Code injection
  ];
  
  // Log suspicious requests
  if (isSuspicious) {
    console.warn(`[SECURITY] Suspicious request detected:`, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      url: req.url,
      timestamp: new Date().toISOString()
    });
  }
};
```

## 🔐 Advanced Security Features

### 1. **Device Fingerprinting**
```javascript
// Admin device verification
if (role === 'admin') {
  const deviceFingerprint = req.headers['x-device-fingerprint'];
  if (!user.deviceFingerprint || user.deviceFingerprint !== deviceFingerprint) {
    return res.status(403).json({ message: 'Access denied: device not recognized' });
  }
}
```

### 2. **Request Timeout Protection**
```javascript
// Request timeout middleware
const timeout = (ms = 30000) => {
  return (req, res, next) => {
    const timer = setTimeout(() => {
      next(new AppError('Request timeout', 408));
    }, ms);
    
    res.on('finish', () => clearTimeout(timer));
    next();
  };
};
```

### 3. **Memory Leak Prevention**
```javascript
// Object URL cleanup
const cleanupObjectURLs = (urls) => {
  urls.forEach(url => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  });
};
```

## 📋 Security Checklist

### Pre-Deployment
- [ ] Run security audit (`npm run security-audit`)
- [ ] Check for vulnerabilities (`npm audit`)
- [ ] Validate environment variables
- [ ] Test rate limiting
- [ ] Verify CORS configuration
- [ ] Check file permissions

### Post-Deployment
- [ ] Monitor application logs
- [ ] Check health endpoints
- [ ] Verify security headers
- [ ] Test authentication flows
- [ ] Monitor performance metrics
- [ ] Review error rates

### Ongoing Maintenance
- [ ] Regular dependency updates
- [ ] Security patch monitoring
- [ ] Log analysis
- [ ] Performance optimization
- [ ] Security configuration reviews

## 🆘 Emergency Contacts

### Security Issues
- **Immediate**: Block affected endpoints
- **Investigation**: Review security logs
- **Recovery**: Implement additional measures

### Performance Issues
- **Monitoring**: Check `/health` and `/metrics` endpoints
- **Analysis**: Review performance logs
- **Optimization**: Adjust rate limits and timeouts

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security](https://expressjs.com/en/advanced/best-practices-security.html)
- [MongoDB Security](https://docs.mongodb.com/manual/security/)

---

**Remember**: Security is an ongoing process. Regularly review and update security measures to protect against emerging threats. 
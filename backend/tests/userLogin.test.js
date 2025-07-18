require('dotenv').config({ path: './.env.test' });
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

describe('User Login API', () => {
  let registeredUser;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Register a user for login tests
    const userData = {
      username: 'loginuser',
      name: 'Login Test User',
      email: 'loginuser@example.com',
      password: 'Testpass1!',
      role: 'user',
      address: { district: 'Bangalore', state: 'Karnataka' },
      phone: '+919999999999',
      idToken: 'mock-firebase-id-token-for-testing'
    };

    const registerRes = await request(app)
      .post('/api/users/register')
      .send(userData);

    if (registerRes.statusCode === 201) {
      registeredUser = registerRes.body.user;
    }
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
  });

  afterEach(async () => {
    // Clean up any test data if needed
  });

  describe('Successful Login', () => {
  it('should login with correct phone and password', async () => {
      const loginData = {
        phone: '+919999999999',
        password: 'Testpass1!'
      };

      const res = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('phone', '+919999999999');
      expect(res.body.user).toHaveProperty('username', 'loginuser');
      expect(res.body.user).toHaveProperty('name', 'Login Test User');
      expect(res.body.user).toHaveProperty('role', 'user');
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.token).toBeTruthy();
    });

    it('should login with email instead of phone', async () => {
      const loginData = {
        email: 'loginuser@example.com',
        password: 'Testpass1!'
      };

      const res = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('email', 'loginuser@example.com');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should handle phone number with different formats', async () => {
      const loginData = {
        phone: '919999999999', // Without + prefix
        password: 'Testpass1!'
      };

    const res = await request(app)
      .post('/api/users/login')
        .send(loginData);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('phone');
    });
  });

  describe('Authentication Failures', () => {
  it('should not login with wrong password', async () => {
      const loginData = {
        phone: '+919999999999',
        password: 'WrongPass1!'
      };

    const res = await request(app)
      .post('/api/users/login')
        .send(loginData);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Invalid credentials');
  });

  it('should not login with unregistered phone', async () => {
      const loginData = {
        phone: '+919999999998',
        password: 'Testpass1!'
      };

      const res = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Invalid credentials');
    });

    it('should not login with unregistered email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Testpass1!'
      };

      const res = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Invalid credentials');
    });

    it('should not login with case-sensitive email mismatch', async () => {
      const loginData = {
        email: 'LOGINUSER@EXAMPLE.COM', // Different case
        password: 'Testpass1!'
      };

    const res = await request(app)
      .post('/api/users/login')
        .send(loginData);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
    });
  });

  describe('Validation Errors', () => {
  it('should not login with missing password', async () => {
      const loginData = {
        phone: '+919999999999'
      };

      const res = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('password');
    });

    it('should not login with missing phone and email', async () => {
      const loginData = {
        password: 'Testpass1!'
      };

      const res = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('phone');
    });

    it('should not login with phone in wrong format', async () => {
      const loginData = {
        phone: '9999999999', // Invalid format
        password: 'Testpass1!'
      };

      const res = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('phone');
    });

    it('should not login with invalid email format', async () => {
      const loginData = {
        email: 'notanemail',
        password: 'Testpass1!'
      };

      const res = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('email');
    });

    it('should not login with password as only spaces', async () => {
      const loginData = {
        phone: '+919999999999',
        password: '       '
      };

      const res = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should not login with empty password', async () => {
      const loginData = {
        phone: '+919999999999',
        password: ''
      };

      const res = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should not login with null password', async () => {
      const loginData = {
        phone: '+919999999999',
        password: null
      };

    const res = await request(app)
      .post('/api/users/login')
        .send(loginData);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

    it('should not login with undefined password', async () => {
      const loginData = {
        phone: '+919999999999',
        password: undefined
      };

      const res = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('Edge Cases', () => {
    it('should handle login with extra whitespace in phone', async () => {
      const loginData = {
        phone: '  +919999999999  ',
        password: 'Testpass1!'
      };

      const res = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should handle login with extra whitespace in email', async () => {
      const loginData = {
        email: '  loginuser@example.com  ',
        password: 'Testpass1!'
      };

      const res = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should handle login with extra whitespace in password', async () => {
      const loginData = {
        phone: '+919999999999',
        password: '  Testpass1!  '
      };

      const res = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(401); // Should fail with extra spaces
      expect(res.body).toHaveProperty('message');
    });

    it('should not login with very long password', async () => {
      const loginData = {
        phone: '+919999999999',
        password: 'A'.repeat(1000) + '1!'
      };

      const res = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should not login with special characters in phone', async () => {
      const loginData = {
        phone: '+91-999-999-9999',
        password: 'Testpass1!'
      };

      const res = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('Security Tests', () => {
    it('should not return password in successful login response', async () => {
      const loginData = {
        phone: '+919999999999',
        password: 'Testpass1!'
      };

      const res = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(200);
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('password');
    });

    it('should not expose user existence through timing attacks', async () => {
      const startTime = Date.now();
      
      // Try with non-existent user
      const res1 = await request(app)
        .post('/api/users/login')
        .send({
          phone: '+919999999998',
          password: 'Testpass1!'
        });

      const time1 = Date.now() - startTime;

      const startTime2 = Date.now();
      
      // Try with existing user but wrong password
      const res2 = await request(app)
        .post('/api/users/login')
        .send({
          phone: '+919999999999',
          password: 'WrongPass1!'
        });

      const time2 = Date.now() - startTime2;

      // Both should fail
      expect(res1.statusCode).toBe(401);
      expect(res2.statusCode).toBe(401);

      // Timing should be similar (within 100ms)
      expect(Math.abs(time1 - time2)).toBeLessThan(100);
    });

    it('should handle SQL injection attempts', async () => {
      const loginData = {
        phone: "' OR '1'='1",
        password: 'Testpass1!'
      };

    const res = await request(app)
      .post('/api/users/login')
        .send(loginData);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

    it('should handle XSS attempts in login data', async () => {
      const loginData = {
        phone: '<script>alert("xss")</script>',
        password: 'Testpass1!'
      };

    const res = await request(app)
      .post('/api/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limiting on login endpoint', async () => {
      const loginData = {
        phone: '+919999999999',
        password: 'Testpass1!'
      };

      // Make multiple rapid requests
      const requests = Array(6).fill().map(() => 
        request(app).post('/api/users/login').send(loginData)
      );

      const responses = await Promise.all(requests);
      
      // At least one should be rate limited (429)
      const hasRateLimit = responses.some(res => res.statusCode === 429);
      expect(hasRateLimit).toBe(true);
    });

    it('should not count successful logins in rate limiting', async () => {
      const loginData = {
        phone: '+919999999999',
        password: 'Testpass1!'
      };

      // Make successful login requests
      const requests = Array(3).fill().map(() => 
        request(app).post('/api/users/login').send(loginData)
      );

      const responses = await Promise.all(requests);
      
      // All should succeed (rate limiting skips successful requests)
      const allSuccessful = responses.every(res => res.statusCode === 200);
      expect(allSuccessful).toBe(true);
    });
  });

  describe('Token Validation', () => {
    it('should return a valid JWT token', async () => {
      const loginData = {
        phone: '+919999999999',
        password: 'Testpass1!'
      };

      const res = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      
      // Token should be a string
      expect(typeof res.body.token).toBe('string');
      
      // Token should not be empty
      expect(res.body.token.length).toBeGreaterThan(0);
      
      // Token should have 3 parts (header.payload.signature)
      const tokenParts = res.body.token.split('.');
      expect(tokenParts.length).toBe(3);
    });

    it('should return user data without sensitive information', async () => {
      const loginData = {
        phone: '+919999999999',
        password: 'Testpass1!'
      };

    const res = await request(app)
      .post('/api/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('user');
      
      const user = res.body.user;
      
      // Should have required fields
      expect(user).toHaveProperty('_id');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('phone');
      expect(user).toHaveProperty('role');
      
      // Should not have sensitive fields
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('tokenVersion');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in request body', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .set('Content-Type', 'application/json')
        .send('{"phone": "invalid json');

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should handle empty request body', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should handle null request body', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send(null);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });
  });
});

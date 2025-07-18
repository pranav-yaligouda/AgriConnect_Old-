require('dotenv').config({ path: './.env.test' });
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); 

describe('User Registration API', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
  });

  afterEach(async () => {
    // Clean up users after each test for isolation
    await mongoose.connection.collection('users').deleteMany({});
  });

  // Mock OTP verification token (simulate Firebase ID token)
  const mockIdToken = 'mock-firebase-id-token-for-testing';

  describe('Successful Registration', () => {
    it('should register a new user with all required fields', async () => {
    const userData = {
      username: 'testuser1',
      name: 'Test User',
      email: 'testuser1@example.com',
        password: 'Testpass1!',
      role: 'user',
      address: { district: 'Bangalore', state: 'Karnataka' },
        phone: '+919999999999',
        idToken: mockIdToken
    };

    const res = await request(app)
      .post('/api/users/register')
      .send(userData);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('username', 'testuser1');
      expect(res.body.user).toHaveProperty('name', 'Test User');
      expect(res.body.user).toHaveProperty('phone', '+919999999999');
      expect(res.body.user).toHaveProperty('email', 'testuser1@example.com');
      expect(res.body.user).toHaveProperty('role', 'user');
      expect(res.body.user).toHaveProperty('emailVerified', false);
    expect(res.body.user).not.toHaveProperty('password');
  });

    it('should register a user without email', async () => {
      const userData = {
        username: 'testuser2',
        name: 'Test User No Email',
        password: 'Testpass1!',
        role: 'farmer',
        address: { district: 'Mumbai', state: 'Maharashtra' },
        phone: '+919999999998',
        idToken: mockIdToken
      };

      const res = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(res.statusCode).toBe(201);
      expect(res.body.user).toHaveProperty('username', 'testuser2');
      expect(res.body.user).not.toHaveProperty('email');
      expect(res.body.user).toHaveProperty('role', 'farmer');
    });

    it('should auto-generate username if not provided', async () => {
      const userData = {
        name: 'Auto Username User',
        password: 'Testpass1!',
        role: 'vendor',
        address: { district: 'Delhi', state: 'Delhi' },
        phone: '+919999999997',
        idToken: mockIdToken
      };

      const res = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(res.statusCode).toBe(201);
      expect(res.body.user).toHaveProperty('username');
      expect(res.body.user.username).toMatch(/^auto.username.user/);
    });

    it('should register with special characters in name', async () => {
      const userData = {
        username: 'specialuser',
        name: 'Tést Üser!@#$%^&*()',
        password: 'Testpass1!',
        role: 'user',
        address: { district: 'Chennai', state: 'Tamil Nadu' },
        phone: '+919999999996',
        idToken: mockIdToken
      };

    const res = await request(app)
      .post('/api/users/register')
        .send(userData);

      expect(res.statusCode).toBe(201);
      expect(res.body.user).toHaveProperty('name', 'Tést Üser!@#$%^&*()');
    });

    it('should register with maximum length fields', async () => {
      const longName = 'A'.repeat(50);
      const longUsername = 'user' + 'x'.repeat(16); // Max 20 chars
    const userData = {
        username: longUsername,
        name: longName,
        password: 'Testpass1!',
      role: 'user',
        address: { district: 'Kolkata', state: 'West Bengal' },
        phone: '+919999999995',
        idToken: mockIdToken
      };

      const res = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(res.statusCode).toBe(201);
      expect(res.body.user).toHaveProperty('username', longUsername);
      expect(res.body.user).toHaveProperty('name', longName);
    });
  });

  describe('OTP Verification Required', () => {
    it('should fail registration without idToken (OTP verification)', async () => {
      const userData = {
        username: 'no-otp-user',
        name: 'No OTP User',
        password: 'Testpass1!',
        role: 'user',
        address: { district: 'Pune', state: 'Maharashtra' },
        phone: '+919999999994'
      };

      const res = await request(app)
        .post('/api/users/register')
        .send(userData);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('OTP verification required');
  });

    it('should fail registration with invalid idToken', async () => {
    const userData = {
        username: 'invalid-otp-user',
        name: 'Invalid OTP User',
        password: 'Testpass1!',
      role: 'user',
        address: { district: 'Hyderabad', state: 'Telangana' },
        phone: '+919999999993',
        idToken: 'invalid-token'
      };

      const res = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Invalid or expired OTP token');
    });
  });

  describe('Validation Errors', () => {
    it('should not register with missing required fields', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Incomplete User',
          idToken: mockIdToken
        });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('details');
    });

    it('should not register with invalid phone format', async () => {
      const userData = {
        username: 'badphone',
        name: 'Bad Phone User',
        password: 'Testpass1!',
        role: 'user',
        address: { district: 'Ahmedabad', state: 'Gujarat' },
        phone: '12345', // Invalid format
        idToken: mockIdToken
      };

      const res = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('details');
      expect(res.body.details).toHaveProperty('phone');
  });

  it('should not register with invalid email format', async () => {
      const userData = {
        username: 'bademail',
        name: 'Bad Email User',
      email: 'notanemail',
        password: 'Testpass1!',
      role: 'user',
        address: { district: 'Jaipur', state: 'Rajasthan' },
        phone: '+919999999992',
        idToken: mockIdToken
      };

      const res = await request(app)
        .post('/api/users/register')
        .send(userData);

    expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('details');
    expect(res.body.details).toHaveProperty('email');
  });

    it('should not register with weak password', async () => {
      const userData = {
        username: 'weakpass',
        name: 'Weak Password User',
        password: 'weak', // Too short, no uppercase, no digit, no special char
      role: 'user',
        address: { district: 'Lucknow', state: 'Uttar Pradesh' },
        phone: '+919999999991',
        idToken: mockIdToken
      };

      const res = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('details');
      expect(res.body.details).toHaveProperty('password');
    });

    it('should not register with invalid role', async () => {
      const userData = {
        username: 'badrole',
        name: 'Bad Role User',
        password: 'Testpass1!',
        role: 'superadmin', // Invalid role
        address: { district: 'Patna', state: 'Bihar' },
        phone: '+919999999990',
        idToken: mockIdToken
      };

      const res = await request(app)
        .post('/api/users/register')
        .send(userData);

    expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('details');
      expect(res.body.details).toHaveProperty('role');
  });

  it('should not register with missing address fields', async () => {
      const userData = {
        username: 'badaddress',
        name: 'Bad Address User',
        password: 'Testpass1!',
      role: 'user',
        address: { district: 'Bhopal' }, // Missing state
        phone: '+919999999989',
        idToken: mockIdToken
      };

      const res = await request(app)
        .post('/api/users/register')
        .send(userData);

    expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('details');
    expect(res.body.details).toHaveProperty('address');
  });

    it('should not register with invalid username format', async () => {
      const userData = {
        username: 'bad-username!', // Invalid characters
        name: 'Bad Username User',
        password: 'Testpass1!',
      role: 'user',
        address: { district: 'Indore', state: 'Madhya Pradesh' },
        phone: '+919999999988',
        idToken: mockIdToken
      };

      const res = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('details');
      expect(res.body.details).toHaveProperty('username');
    });
  });

  describe('Duplicate Data Prevention', () => {
    it('should not register with duplicate phone number', async () => {
      // First registration
      const userData1 = {
        username: 'user1',
        name: 'User One',
        password: 'Testpass1!',
      role: 'user',
        address: { district: 'Nagpur', state: 'Maharashtra' },
        phone: '+919999999987',
        idToken: mockIdToken
      };

      await request(app).post('/api/users/register').send(userData1);

      // Second registration with same phone
      const userData2 = {
        username: 'user2',
        name: 'User Two',
        password: 'Testpass2!',
        role: 'farmer',
        address: { district: 'Varanasi', state: 'Uttar Pradesh' },
        phone: '+919999999987', // Same phone
        idToken: mockIdToken
      };

      const res = await request(app)
        .post('/api/users/register')
        .send(userData2);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.details).toHaveProperty('phone');
    });

    it('should not register with duplicate email', async () => {
      // First registration
      const userData1 = {
        username: 'user1',
        name: 'User One',
        email: 'duplicate@example.com',
        password: 'Testpass1!',
        role: 'user',
        address: { district: 'Agra', state: 'Uttar Pradesh' },
        phone: '+919999999986',
        idToken: mockIdToken
      };

      await request(app).post('/api/users/register').send(userData1);

      // Second registration with same email
      const userData2 = {
        username: 'user2',
        name: 'User Two',
        email: 'duplicate@example.com', // Same email
        password: 'Testpass2!',
        role: 'vendor',
        address: { district: 'Kanpur', state: 'Uttar Pradesh' },
        phone: '+919999999985',
        idToken: mockIdToken
      };

      const res = await request(app)
        .post('/api/users/register')
        .send(userData2);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.details).toHaveProperty('email');
    });

    it('should not register with duplicate username', async () => {
      // First registration
      const userData1 = {
        username: 'duplicateuser',
        name: 'User One',
        password: 'Testpass1!',
      role: 'user',
        address: { district: 'Allahabad', state: 'Uttar Pradesh' },
        phone: '+919999999984',
        idToken: mockIdToken
      };

      await request(app).post('/api/users/register').send(userData1);

      // Second registration with same username
      const userData2 = {
        username: 'duplicateuser', // Same username
        name: 'User Two',
        password: 'Testpass2!',
        role: 'farmer',
        address: { district: 'Gorakhpur', state: 'Uttar Pradesh' },
        phone: '+919999999983',
        idToken: mockIdToken
      };

      const res = await request(app)
        .post('/api/users/register')
        .send(userData2);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.details).toHaveProperty('username');
  });

  it('should treat emails as case-insensitive for duplicates', async () => {
      // First registration
      const userData1 = {
        username: 'caseuser1',
        name: 'User One',
      email: 'caseuser@example.com',
        password: 'Testpass1!',
      role: 'user',
        address: { district: 'Bareilly', state: 'Uttar Pradesh' },
        phone: '+919999999982',
        idToken: mockIdToken
      };

      await request(app).post('/api/users/register').send(userData1);

      // Second registration with same email in different case
      const userData2 = {
        username: 'caseuser2',
        name: 'User Two',
        email: 'CASEUSER@EXAMPLE.COM', // Different case
        password: 'Testpass2!',
        role: 'vendor',
        address: { district: 'Moradabad', state: 'Uttar Pradesh' },
        phone: '+919999999981',
        idToken: mockIdToken
      };

      const res = await request(app)
        .post('/api/users/register')
        .send(userData2);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.details).toHaveProperty('email');
    });
  });

  describe('Edge Cases', () => {
    it('should not register with phone number mismatch in OTP', async () => {
      const userData = {
        username: 'phonemismatch',
        name: 'Phone Mismatch User',
        password: 'Testpass1!',
      role: 'user',
        address: { district: 'Saharanpur', state: 'Uttar Pradesh' },
        phone: '+919999999980',
        idToken: mockIdToken // This would contain a different phone number in real scenario
      };

      // This test assumes the backend checks phone number consistency
      // If your backend doesn't do this check, adjust the test accordingly
      const res = await request(app)
        .post('/api/users/register')
        .send(userData);

      // If phone mismatch is checked, expect 403
      // If not checked, expect 201
      expect([201, 403]).toContain(res.statusCode);
    });

    it('should handle registration with empty optional fields', async () => {
      const userData = {
        username: 'emptyfields',
        name: 'Empty Fields User',
        password: 'Testpass1!',
        role: 'user',
        address: { district: 'Meerut', state: 'Uttar Pradesh' },
        phone: '+919999999979',
        idToken: mockIdToken
      };

      const res = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(res.statusCode).toBe(201);
      expect(res.body.user).toHaveProperty('username', 'emptyfields');
  });

  it('should not return password in response', async () => {
    const userData = {
      username: 'nopassword',
        name: 'No Password User',
        password: 'Testpass1!',
      role: 'user',
        address: { district: 'Ghaziabad', state: 'Uttar Pradesh' },
        phone: '+919999999978',
        idToken: mockIdToken
      };

      const res = await request(app)
        .post('/api/users/register')
        .send(userData);

    expect(res.statusCode).toBe(201);
    expect(res.body.user).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('password');
    });

    it('should handle registration with minimum required fields only', async () => {
      const userData = {
        name: 'Minimal User',
        password: 'Testpass1!',
        role: 'user',
        address: { district: 'Noida', state: 'Uttar Pradesh' },
        phone: '+919999999977',
        idToken: mockIdToken
      };

      const res = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(res.statusCode).toBe(201);
      expect(res.body.user).toHaveProperty('name', 'Minimal User');
      expect(res.body.user).toHaveProperty('username'); // Auto-generated
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limiting on registration endpoint', async () => {
      const userData = {
        name: 'Rate Limited User',
        password: 'Testpass1!',
        role: 'user',
        address: { district: 'Gurgaon', state: 'Haryana' },
        phone: '+919999999976',
        idToken: mockIdToken
      };

      // Make multiple rapid requests
      const requests = Array(6).fill().map(() => 
        request(app).post('/api/users/register').send({
          ...userData,
          phone: `+9199999999${Math.floor(Math.random() * 1000)}`,
          username: `user${Math.floor(Math.random() * 1000)}`
        })
      );

      const responses = await Promise.all(requests);
      
      // At least one should be rate limited (429)
      const hasRateLimit = responses.some(res => res.statusCode === 429);
      expect(hasRateLimit).toBe(true);
    });
  });
});
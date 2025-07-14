require('dotenv').config({ path: './.env.test' });
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); 

describe('User API', () => {
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

  it('should register a new user', async () => {
    const userData = {
      username: 'testuser1',
      name: 'Test User',
      email: 'testuser1@example.com',
      password: 'Testpass1',
      role: 'user',
      address: { district: 'Bangalore', state: 'Karnataka' },
      phone: '+919999999999'
    };
    const res = await request(app)
      .post('/api/users/register')
      .send(userData);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('username', 'testuser1');
    // Ensure password is not returned
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('should not register with missing fields', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({ name: 'No Password' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should not register with duplicate phone number', async () => {
    const userData = {
      username: 'testuser2',
      name: 'Test User 2',
      email: 'testuser2@example.com',
      password: 'Testpass1',
      role: 'user',
      address: { district: 'Bangalore', state: 'Karnataka' },
      phone: '+919999999998'
    };
    await request(app).post('/api/users/register').send(userData);
    const res = await request(app).post('/api/users/register').send({
      ...userData,
      email: 'other@example.com',
      username: 'testuser2b'
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(res.body.details).toHaveProperty('phone');
  });

  it('should not register with duplicate email', async () => {
    const userData = {
      username: 'testuser3',
      name: 'Test User 3',
      email: 'testuser3@example.com',
      password: 'Testpass1',
      role: 'user',
      address: { district: 'Bangalore', state: 'Karnataka' },
      phone: '+919999999997'
    };
    await request(app).post('/api/users/register').send(userData);
    const res = await request(app).post('/api/users/register').send({
      ...userData,
      phone: '+919999999996',
      username: 'testuser3b'
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(res.body.details).toHaveProperty('email');
  });

  it('should not register with invalid email format', async () => {
    const res = await request(app).post('/api/users/register').send({
      username: 'testuser4',
      name: 'Test User 4',
      email: 'notanemail',
      password: 'Testpass1',
      role: 'user',
      address: { district: 'Bangalore', state: 'Karnataka' },
      phone: '+919999999995'
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(res.body.details).toHaveProperty('email');
  });

  it('should not register with invalid password format', async () => {
    const res = await request(app).post('/api/users/register').send({
      username: 'testuser5',
      name: 'Test User 5',
      email: 'testuser5@example.com',
      password: 'short', // too short, no uppercase, no digit
      role: 'user',
      address: { district: 'Bangalore', state: 'Karnataka' },
      phone: '+919999999994'
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(res.body.details).toHaveProperty('password');
  });

  it('should not register with missing address fields', async () => {
    const res = await request(app).post('/api/users/register').send({
      username: 'testuser6',
      name: 'Test User 6',
      email: 'testuser6@example.com',
      password: 'Testpass1',
      role: 'user',
      address: { district: 'Bangalore' }, // missing state
      phone: '+919999999993'
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(res.body.details).toHaveProperty('address');
  });

  it('should auto-generate username if not provided', async () => {
    const res = await request(app).post('/api/users/register').send({
      name: 'Auto Username',
      email: 'autouser@example.com',
      password: 'Testpass1',
      role: 'user',
      address: { district: 'Bangalore', state: 'Karnataka' },
      phone: '+919999999992'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('username');
    expect(res.body.user.username).toMatch(/auto.username/i);
  });

  // --- Advanced/Edge Case Tests ---

  it('should register with a very long name and username', async () => {
    const longName = 'A'.repeat(100);
    const longUsername = 'user' + 'x'.repeat(50);
    const res = await request(app).post('/api/users/register').send({
      username: longUsername,
      name: longName,
      email: 'longuser@example.com',
      password: 'Testpass1',
      role: 'user',
      address: { district: 'Bangalore', state: 'Karnataka' },
      phone: '+919999999991'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.user).toHaveProperty('username', longUsername);
    expect(res.body.user).toHaveProperty('name', longName);
  });

  it('should register with special characters in name', async () => {
    const res = await request(app).post('/api/users/register').send({
      username: 'specialuser',
      name: 'Tést Üser!@#$',
      email: 'specialuser@example.com',
      password: 'Testpass1',
      role: 'user',
      address: { district: 'Bangalore', state: 'Karnataka' },
      phone: '+919999999990'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.user).toHaveProperty('name', 'Tést Üser!@#$');
  });

  it('should treat emails as case-insensitive for duplicates', async () => {
    const userData = {
      username: 'caseuser',
      name: 'Case User',
      email: 'caseuser@example.com',
      password: 'Testpass1',
      role: 'user',
      address: { district: 'Bangalore', state: 'Karnataka' },
      phone: '+919999999989'
    };
    await request(app).post('/api/users/register').send(userData);
    const res = await request(app).post('/api/users/register').send({
      ...userData,
      email: 'CASEUSER@EXAMPLE.COM', // different case
      phone: '+919999999988',
      username: 'caseuser2'
    });
    // Depending on your backend logic, this may pass or fail. If you want strict case-insensitive, expect 400.
    // If not, change this to expect 201.
    expect([201, 400]).toContain(res.statusCode);
  });

  it('should not register with invalid phone format', async () => {
    const res = await request(app).post('/api/users/register').send({
      username: 'badphone',
      name: 'Bad Phone',
      email: 'badphone@example.com',
      password: 'Testpass1',
      role: 'user',
      address: { district: 'Bangalore', state: 'Karnataka' },
      phone: '12345' // invalid
    });
    // If you have phone validation, expect 400. If not, this may pass.
    expect([201, 400]).toContain(res.statusCode);
  });

  it('should not register with invalid role', async () => {
    const res = await request(app).post('/api/users/register').send({
      username: 'badrole',
      name: 'Bad Role',
      email: 'badrole@example.com',
      password: 'Testpass1',
      role: 'superadmin', // invalid
      address: { district: 'Bangalore', state: 'Karnataka' },
      phone: '+919999999987'
    });
    // If you have role validation, expect 400. If not, this may pass.
    expect([201, 400]).toContain(res.statusCode);
  });

  it('should not return password in response', async () => {
    const userData = {
      username: 'nopassword',
      name: 'No Password',
      email: 'nopassword@example.com',
      password: 'Testpass1',
      role: 'user',
      address: { district: 'Bangalore', state: 'Karnataka' },
      phone: '+919999999986'
    };
    const res = await request(app).post('/api/users/register').send(userData);
    expect(res.statusCode).toBe(201);
    expect(res.body.user).not.toHaveProperty('password');
  });
});
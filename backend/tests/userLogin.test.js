require('dotenv').config({ path: './.env.test' });
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

describe('User Login API', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    // Register a user for login tests
    await request(app).post('/api/users/register').send({
      username: 'loginuser',
      name: 'Login User',
      email: 'loginuser@example.com',
      password: 'Testpass1',
      role: 'user',
      address: { district: 'Bangalore', state: 'Karnataka' },
      phone: '+919999999900'
    });
  });
  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
  });

  it('should login with correct phone and password', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ phone: '+919999999900', password: 'Testpass1' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('phone', '+919999999900');
  });

  it('should not login with wrong password', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ phone: '+919999999900', password: 'WrongPass1' });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('should not login with unregistered phone', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ phone: '+919999999901', password: 'Testpass1' });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('should not login with missing password', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ phone: '+919999999900' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should not login with missing phone', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ password: 'Testpass1' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should not login with phone in wrong format', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ phone: '9999999900', password: 'Testpass1' });
    expect([400, 401]).toContain(res.statusCode);
  });

  it('should not login with password as only spaces', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ phone: '+919999999900', password: '       ' });
    expect([400, 401]).toContain(res.statusCode);
  });

  it('should not login if user is blocked', async () => {
    // Block the user in the DB, then try to login
    // expect 403 or 401
  });
});

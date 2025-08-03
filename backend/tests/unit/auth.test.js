const request = require('supertest');
const app = require('../../server');
const { User } = require('../src/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Authentication API', () => {
  let testUser;

  beforeAll(async () => {
    // Clean up test data
    await User.destroy({ where: { email: 'test@example.com' } });
  });

  afterAll(async () => {
    // Clean up after tests
    await User.destroy({ where: { email: 'test@example.com' } });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123',
        full_name: 'Test User',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.username).toBe(userData.username);
      expect(response.body.data.user.full_name).toBe(userData.full_name);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).not.toHaveProperty('password');

      testUser = response.body.data.user;
    });

    it('should fail with invalid email format', async () => {
      const userData = {
        username: 'testuser2',
        email: 'invalid-email',
        password: 'TestPassword123',
        full_name: 'Test User 2'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });

    it('should fail with weak password', async () => {
      const userData = {
        username: 'testuser3',
        email: 'test3@example.com',
        password: '123',
        full_name: 'Test User 3'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });

    it('should fail with duplicate email', async () => {
      const userData = {
        username: 'testuser4',
        email: 'test@example.com', // Already exists
        password: 'TestPassword123',
        full_name: 'Test User 4'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email already exists');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(loginData.email);
    });

    it('should fail with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should fail with wrong password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let authToken;

    beforeAll(async () => {
      // Login to get token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123'
        });

      authToken = loginResponse.body.data.token;
    });

    it('should get current user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid token');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let authToken;

    beforeAll(async () => {
      // Login to get token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123'
        });

      authToken = loginResponse.body.data.token;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out successfully');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let authToken;

    beforeAll(async () => {
      // Login to get token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123'
        });

      authToken = loginResponse.body.data.token;
    });

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.token).not.toBe(authToken);
    });
  });
}); 
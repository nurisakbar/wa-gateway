const request = require('supertest');
const app = require('../../server');
const { User, Device } = require('../../src/models');

describe('Device Management API', () => {
  let authToken;
  let testUser;
  let testDevice;

  beforeAll(async () => {
    // Create test user and login
    const userData = {
      username: 'devicetest',
      email: 'devicetest@example.com',
      password: 'TestPassword123',
      full_name: 'Device Test User'
    };

    // Register user
    await request(app)
      .post('/api/v1/auth/register')
      .send(userData);

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      });

    authToken = loginResponse.body.data.token;
    testUser = loginResponse.body.data.user;
  });

  afterAll(async () => {
    // Clean up test data
    await Device.destroy({ where: { user_id: testUser.id } });
    await User.destroy({ where: { email: 'devicetest@example.com' } });
  });

  describe('POST /api/v1/devices', () => {
    it('should create a new device successfully', async () => {
      const deviceData = {
        name: 'Test Device',
        description: 'Test device description',
        phone_number: '+1234567890'
      };

      const response = await request(app)
        .post('/api/v1/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deviceData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.device).toHaveProperty('id');
      expect(response.body.data.device.name).toBe(deviceData.name);
      expect(response.body.data.device.description).toBe(deviceData.description);
      expect(response.body.data.device.phone_number).toBe(deviceData.phone_number);
      expect(response.body.data.device.user_id).toBe(testUser.id);
      expect(response.body.data.device.status).toBe('disconnected');

      testDevice = response.body.data.device;
    });

    it('should fail without authentication', async () => {
      const deviceData = {
        name: 'Unauthorized Device',
        description: 'This should fail'
      };

      const response = await request(app)
        .post('/api/v1/devices')
        .send(deviceData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    it('should fail with invalid device data', async () => {
      const deviceData = {
        name: '', // Empty name
        description: 'Invalid device'
      };

      const response = await request(app)
        .post('/api/v1/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deviceData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });
  });

  describe('GET /api/v1/devices', () => {
    it('should get all devices for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('devices');
      expect(Array.isArray(response.body.data.devices)).toBe(true);
      expect(response.body.data.devices.length).toBeGreaterThan(0);
      expect(response.body.data.devices[0]).toHaveProperty('id');
      expect(response.body.data.devices[0]).toHaveProperty('name');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/devices')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('GET /api/v1/devices/:id', () => {
    it('should get specific device by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/devices/${testDevice.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.device.id).toBe(testDevice.id);
      expect(response.body.data.device.name).toBe(testDevice.name);
    });

    it('should fail with non-existent device ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/devices/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Device not found');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/devices/${testDevice.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('PUT /api/v1/devices/:id', () => {
    it('should update device successfully', async () => {
      const updateData = {
        name: 'Updated Test Device',
        description: 'Updated description',
        phone_number: '+0987654321'
      };

      const response = await request(app)
        .put(`/api/v1/devices/${testDevice.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.device.name).toBe(updateData.name);
      expect(response.body.data.device.description).toBe(updateData.description);
      expect(response.body.data.device.phone_number).toBe(updateData.phone_number);
    });

    it('should fail updating device owned by another user', async () => {
      // Create another user and device
      const otherUserData = {
        username: 'otheruser',
        email: 'otheruser@example.com',
        password: 'TestPassword123',
        full_name: 'Other User'
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(otherUserData);

      const otherLoginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: otherUserData.email,
          password: otherUserData.password
        });

      const otherToken = otherLoginResponse.body.data.token;

      const updateData = {
        name: 'Unauthorized Update'
      };

      const response = await request(app)
        .put(`/api/v1/devices/${testDevice.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');

      // Clean up other user
      await User.destroy({ where: { email: 'otheruser@example.com' } });
    });
  });

  describe('POST /api/v1/devices/:id/connect', () => {
    it('should initiate device connection', async () => {
      const response = await request(app)
        .post(`/api/v1/devices/${testDevice.id}/connect`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('qr_code');
      expect(response.body.data.status).toBe('connecting');
    });

    it('should fail connecting non-existent device', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post(`/api/v1/devices/${fakeId}/connect`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Device not found');
    });
  });

  describe('POST /api/v1/devices/:id/disconnect', () => {
    it('should disconnect device successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/devices/${testDevice.id}/disconnect`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('disconnected');
    });
  });

  describe('GET /api/v1/devices/:id/status', () => {
    it('should get device status', async () => {
      const response = await request(app)
        .get(`/api/v1/devices/${testDevice.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('last_activity');
    });
  });

  describe('DELETE /api/v1/devices/:id', () => {
    it('should delete device successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/devices/${testDevice.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Device deleted successfully');
    });

    it('should fail deleting non-existent device', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .delete(`/api/v1/devices/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Device not found');
    });
  });
}); 
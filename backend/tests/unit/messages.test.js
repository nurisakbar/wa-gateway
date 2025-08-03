const request = require('supertest');
const app = require('../../server');
const { User, Device, Message } = require('../src/models');

describe('Message Management API', () => {
  let authToken;
  let testUser;
  let testDevice;
  let testMessage;

  beforeAll(async () => {
    // Create test user and login
    const userData = {
      username: 'messagetest',
      email: 'messagetest@example.com',
      password: 'TestPassword123',
      full_name: 'Message Test User'
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

    // Create test device
    const deviceData = {
      name: 'Message Test Device',
      description: 'Device for message testing',
      phone_number: '+1234567890'
    };

    const deviceResponse = await request(app)
      .post('/api/v1/devices')
      .set('Authorization', `Bearer ${authToken}`)
      .send(deviceData);

    testDevice = deviceResponse.body.data.device;
  });

  afterAll(async () => {
    // Clean up test data
    await Message.destroy({ where: { user_id: testUser.id } });
    await Device.destroy({ where: { user_id: testUser.id } });
    await User.destroy({ where: { email: 'messagetest@example.com' } });
  });

  describe('POST /api/v1/messages/send', () => {
    it('should send a text message successfully', async () => {
      const messageData = {
        device_id: testDevice.id,
        to_number: '+1234567890',
        message_type: 'text',
        content: 'Hello, this is a test message!'
      };

      const response = await request(app)
        .post('/api/v1/messages/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('message_id');
      expect(response.body.data).toHaveProperty('database_id');
      expect(response.body.data).toHaveProperty('timestamp');

      testMessage = response.body.data;
    });

    it('should fail sending message without authentication', async () => {
      const messageData = {
        device_id: testDevice.id,
        to_number: '+1234567890',
        message_type: 'text',
        content: 'Unauthorized message'
      };

      const response = await request(app)
        .post('/api/v1/messages/send')
        .send(messageData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    it('should fail with invalid phone number', async () => {
      const messageData = {
        device_id: testDevice.id,
        to_number: 'invalid-phone',
        message_type: 'text',
        content: 'Test message'
      };

      const response = await request(app)
        .post('/api/v1/messages/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid phone number');
    });

    it('should fail with non-existent device', async () => {
      const fakeDeviceId = '00000000-0000-0000-0000-000000000000';
      const messageData = {
        device_id: fakeDeviceId,
        to_number: '+1234567890',
        message_type: 'text',
        content: 'Test message'
      };

      const response = await request(app)
        .post('/api/v1/messages/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Device not found');
    });
  });

  describe('GET /api/v1/messages', () => {
    it('should get messages with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('messages');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.messages)).toBe(true);
      expect(response.body.data.pagination).toHaveProperty('total');
      expect(response.body.data.pagination).toHaveProperty('page');
      expect(response.body.data.pagination).toHaveProperty('limit');
    });

    it('should filter messages by device', async () => {
      const response = await request(app)
        .get(`/api/v1/messages?device_id=${testDevice.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.messages).toBeDefined();
    });

    it('should filter messages by status', async () => {
      const response = await request(app)
        .get('/api/v1/messages?status=sent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.messages).toBeDefined();
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/messages')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('GET /api/v1/messages/:id', () => {
    it('should get specific message by ID', async () => {
      // First create a message
      const messageData = {
        device_id: testDevice.id,
        to_number: '+1234567890',
        message_type: 'text',
        content: 'Test message for retrieval'
      };

      const sendResponse = await request(app)
        .post('/api/v1/messages/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData);

      const messageId = sendResponse.body.data.database_id;

      const response = await request(app)
        .get(`/api/v1/messages/${messageId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message.id).toBe(messageId);
      expect(response.body.data.message.content).toBe(messageData.content);
    });

    it('should fail with non-existent message ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/messages/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Message not found');
    });
  });

  describe('POST /api/v1/messages/bulk-send', () => {
    it('should send bulk messages successfully', async () => {
      const bulkData = {
        device_id: testDevice.id,
        messages: [
          {
            to_number: '+1234567890',
            message_type: 'text',
            content: 'Bulk message 1'
          },
          {
            to_number: '+0987654321',
            message_type: 'text',
            content: 'Bulk message 2'
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/messages/bulk-send')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('results');
      expect(Array.isArray(response.body.data.results)).toBe(true);
      expect(response.body.data.results.length).toBe(2);
    });

    it('should fail with invalid bulk data', async () => {
      const bulkData = {
        device_id: testDevice.id,
        messages: [
          {
            to_number: 'invalid-phone',
            message_type: 'text',
            content: 'Invalid message'
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/messages/bulk-send')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/messages/statistics', () => {
    it('should get message statistics', async () => {
      const response = await request(app)
        .get('/api/v1/messages/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_messages');
      expect(response.body.data).toHaveProperty('sent_messages');
      expect(response.body.data).toHaveProperty('failed_messages');
      expect(response.body.data).toHaveProperty('by_type');
      expect(response.body.data).toHaveProperty('by_status');
    });

    it('should filter statistics by date range', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(`/api/v1/messages/statistics?start_date=${startDate}&end_date=${endDate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_messages');
    });
  });

  describe('DELETE /api/v1/messages/:id', () => {
    it('should delete message successfully', async () => {
      // First create a message
      const messageData = {
        device_id: testDevice.id,
        to_number: '+1234567890',
        message_type: 'text',
        content: 'Message to be deleted'
      };

      const sendResponse = await request(app)
        .post('/api/v1/messages/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData);

      const messageId = sendResponse.body.data.database_id;

      const response = await request(app)
        .delete(`/api/v1/messages/${messageId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Message deleted successfully');
    });

    it('should fail deleting non-existent message', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .delete(`/api/v1/messages/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Message not found');
    });
  });
}); 
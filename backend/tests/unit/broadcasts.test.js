const request = require('supertest');
const app = require('../../server');
const { User, Device, Contact, Message } = require('../../src/models');

describe('Broadcast Management API', () => {
  let authToken;
  let testUser;
  let testDevice;
  let testContacts;

  beforeAll(async () => {
    // Create test user and login
    const userData = {
      username: 'broadcasttest',
      email: 'broadcasttest@example.com',
      password: 'TestPassword123',
      full_name: 'Broadcast Test User'
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
      name: 'Broadcast Test Device',
      description: 'Device for broadcast testing',
      phone_number: '+1234567890'
    };

    const deviceResponse = await request(app)
      .post('/api/v1/devices')
      .set('Authorization', `Bearer ${authToken}`)
      .send(deviceData);

    testDevice = deviceResponse.body.data.device;

    // Create test contacts
    const contactsData = [
      {
        name: 'Broadcast Contact 1',
        phone_number: '+1111111111',
        email: 'broadcast1@example.com',
        tags: ['broadcast']
      },
      {
        name: 'Broadcast Contact 2',
        phone_number: '+2222222222',
        email: 'broadcast2@example.com',
        tags: ['broadcast']
      }
    ];

    testContacts = [];
    for (const contactData of contactsData) {
      const contactResponse = await request(app)
        .post('/api/v1/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactData);
      
      testContacts.push(contactResponse.body.data.contact);
    }
  });

  afterAll(async () => {
    // Clean up test data
    await Message.destroy({ where: { user_id: testUser.id } });
    await Contact.destroy({ where: { user_id: testUser.id } });
    await Device.destroy({ where: { user_id: testUser.id } });
    await User.destroy({ where: { email: 'broadcasttest@example.com' } });
  });

  describe('POST /api/v1/broadcasts/send', () => {
    it('should send broadcast message successfully', async () => {
      const broadcastData = {
        device_id: testDevice.id,
        contacts: testContacts,
        message_data: {
          message_type: 'text',
          content: 'Test broadcast message'
        },
        options: {
          batch_size: 2,
          delay_between_messages: 1000
        }
      };

      const response = await request(app)
        .post('/api/v1/broadcasts/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send(broadcastData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('broadcast_id');
      expect(response.body.data).toHaveProperty('total_contacts');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data.total_contacts).toBe(2);
    });

    it('should fail without authentication', async () => {
      const broadcastData = {
        device_id: testDevice.id,
        contacts: testContacts,
        message_data: {
          message_type: 'text',
          content: 'Unauthorized broadcast'
        }
      };

      const response = await request(app)
        .post('/api/v1/broadcasts/send')
        .send(broadcastData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    it('should fail with invalid device ID', async () => {
      const fakeDeviceId = '00000000-0000-0000-0000-000000000000';
      const broadcastData = {
        device_id: fakeDeviceId,
        contacts: testContacts,
        message_data: {
          message_type: 'text',
          content: 'Test broadcast'
        }
      };

      const response = await request(app)
        .post('/api/v1/broadcasts/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send(broadcastData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Device not found');
    });

    it('should fail with empty contacts list', async () => {
      const broadcastData = {
        device_id: testDevice.id,
        contacts: [],
        message_data: {
          message_type: 'text',
          content: 'Test broadcast'
        }
      };

      const response = await request(app)
        .post('/api/v1/broadcasts/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send(broadcastData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Contacts list cannot be empty');
    });

    it('should fail with invalid message data', async () => {
      const broadcastData = {
        device_id: testDevice.id,
        contacts: testContacts,
        message_data: {
          message_type: 'text',
          content: '' // Empty content
        }
      };

      const response = await request(app)
        .post('/api/v1/broadcasts/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send(broadcastData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Message content is required');
    });
  });

  describe('POST /api/v1/broadcasts/schedule', () => {
    it('should schedule broadcast successfully', async () => {
      const scheduledTime = new Date(Date.now() + 60000); // 1 minute from now
      const broadcastData = {
        device_id: testDevice.id,
        contacts: testContacts,
        message_data: {
          message_type: 'text',
          content: 'Scheduled broadcast message'
        },
        scheduled_at: scheduledTime.toISOString(),
        options: {
          batch_size: 2,
          delay_between_messages: 1000
        }
      };

      const response = await request(app)
        .post('/api/v1/broadcasts/schedule')
        .set('Authorization', `Bearer ${authToken}`)
        .send(broadcastData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('broadcast_id');
      expect(response.body.data).toHaveProperty('scheduled_at');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data.status).toBe('scheduled');
    });

    it('should fail scheduling in the past', async () => {
      const pastTime = new Date(Date.now() - 60000); // 1 minute ago
      const broadcastData = {
        device_id: testDevice.id,
        contacts: testContacts,
        message_data: {
          message_type: 'text',
          content: 'Past broadcast'
        },
        scheduled_at: pastTime.toISOString()
      };

      const response = await request(app)
        .post('/api/v1/broadcasts/schedule')
        .set('Authorization', `Bearer ${authToken}`)
        .send(broadcastData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Scheduled time must be in the future');
    });
  });

  describe('GET /api/v1/broadcasts/:broadcast_id/status', () => {
    let testBroadcastId;

    beforeAll(async () => {
      // Create a test broadcast
      const broadcastData = {
        device_id: testDevice.id,
        contacts: testContacts,
        message_data: {
          message_type: 'text',
          content: 'Status test broadcast'
        }
      };

      const response = await request(app)
        .post('/api/v1/broadcasts/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send(broadcastData);

      testBroadcastId = response.body.data.broadcast_id;
    });

    it('should get broadcast status', async () => {
      const response = await request(app)
        .get(`/api/v1/broadcasts/${testBroadcastId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('broadcast_id');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('progress');
      expect(response.body.data).toHaveProperty('total_contacts');
      expect(response.body.data).toHaveProperty('sent_count');
      expect(response.body.data).toHaveProperty('failed_count');
    });

    it('should fail with non-existent broadcast ID', async () => {
      const fakeBroadcastId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/broadcasts/${fakeBroadcastId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Broadcast not found');
    });
  });

  describe('DELETE /api/v1/broadcasts/:broadcast_id/cancel', () => {
    let testScheduledBroadcastId;

    beforeAll(async () => {
      // Create a scheduled broadcast
      const scheduledTime = new Date(Date.now() + 300000); // 5 minutes from now
      const broadcastData = {
        device_id: testDevice.id,
        contacts: testContacts,
        message_data: {
          message_type: 'text',
          content: 'Cancel test broadcast'
        },
        scheduled_at: scheduledTime.toISOString()
      };

      const response = await request(app)
        .post('/api/v1/broadcasts/schedule')
        .set('Authorization', `Bearer ${authToken}`)
        .send(broadcastData);

      testScheduledBroadcastId = response.body.data.broadcast_id;
    });

    it('should cancel scheduled broadcast', async () => {
      const response = await request(app)
        .delete(`/api/v1/broadcasts/${testScheduledBroadcastId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Broadcast cancelled successfully');
    });

    it('should fail cancelling non-existent broadcast', async () => {
      const fakeBroadcastId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .delete(`/api/v1/broadcasts/${fakeBroadcastId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Broadcast not found');
    });
  });

  describe('GET /api/v1/broadcasts/scheduled', () => {
    it('should get scheduled broadcasts', async () => {
      const response = await request(app)
        .get('/api/v1/broadcasts/scheduled')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('broadcasts');
      expect(Array.isArray(response.body.data.broadcasts)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/broadcasts/scheduled')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('GET /api/v1/broadcasts/contacts', () => {
    it('should get contacts for broadcast', async () => {
      const response = await request(app)
        .get('/api/v1/broadcasts/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('contacts');
      expect(Array.isArray(response.body.data.contacts)).toBe(true);
    });

    it('should filter contacts by tags', async () => {
      const response = await request(app)
        .get('/api/v1/broadcasts/contacts?tags=broadcast')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.contacts).toBeDefined();
      expect(response.body.data.contacts.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/broadcasts/stats', () => {
    it('should get broadcast statistics', async () => {
      const response = await request(app)
        .get('/api/v1/broadcasts/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_broadcasts');
      expect(response.body.data).toHaveProperty('completed_broadcasts');
      expect(response.body.data).toHaveProperty('scheduled_broadcasts');
      expect(response.body.data).toHaveProperty('failed_broadcasts');
    });

    it('should filter statistics by date range', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(`/api/v1/broadcasts/stats?start_date=${startDate}&end_date=${endDate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_broadcasts');
    });
  });
}); 
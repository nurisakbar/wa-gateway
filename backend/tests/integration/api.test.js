const request = require('supertest');
const app = require('../../server');
const { User, Device, Message, Contact } = require('../../src/models');

describe('API Integration Tests', () => {
  let authToken;
  let testUser;
  let testDevice;
  let testContact;

  beforeAll(async () => {
    // Clean up any existing test data
    await Contact.destroy({ where: { email: 'testcontact@example.com' } });
    await Message.destroy({ where: { to_number: '+1234567890' } });
    await Device.destroy({ where: { name: 'Integration Test Device' } });
    await User.destroy({ where: { email: 'integration@example.com' } });
  });

  afterAll(async () => {
    // Clean up test data
    await Contact.destroy({ where: { email: 'testcontact@example.com' } });
    await Message.destroy({ where: { to_number: '+1234567890' } });
    await Device.destroy({ where: { name: 'Integration Test Device' } });
    await User.destroy({ where: { email: 'integration@example.com' } });
  });

  describe('Complete User Workflow', () => {
    it('should complete full user workflow: register -> login -> create device -> send message', async () => {
      // Step 1: Register user
      const userData = {
        username: 'integrationuser',
        email: 'integration@example.com',
        password: 'TestPassword123',
        full_name: 'Integration Test User',
        phone: '+1234567890'
      };

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.user.email).toBe(userData.email);
      expect(registerResponse.body.data).toHaveProperty('token');

      authToken = registerResponse.body.data.token;
      testUser = registerResponse.body.data.user;

      // Step 2: Login (verify token works)
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.user.id).toBe(testUser.id);

      // Step 3: Create device
      const deviceData = {
        name: 'Integration Test Device',
        description: 'Device for integration testing',
        phone_number: '+1234567890'
      };

      const deviceResponse = await request(app)
        .post('/api/v1/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deviceData)
        .expect(201);

      expect(deviceResponse.body.success).toBe(true);
      expect(deviceResponse.body.data.device.name).toBe(deviceData.name);
      expect(deviceResponse.body.data.device.user_id).toBe(testUser.id);

      testDevice = deviceResponse.body.data.device;

      // Step 4: Create contact
      const contactData = {
        name: 'Test Contact',
        phone_number: '+1234567890',
        email: 'testcontact@example.com',
        tags: ['test', 'integration']
      };

      const contactResponse = await request(app)
        .post('/api/v1/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactData)
        .expect(201);

      expect(contactResponse.body.success).toBe(true);
      expect(contactResponse.body.data.contact.name).toBe(contactData.name);

      testContact = contactResponse.body.data.contact;

      // Step 5: Send message
      const messageData = {
        device_id: testDevice.id,
        to_number: '+1234567890',
        message_type: 'text',
        content: 'Integration test message'
      };

      const messageResponse = await request(app)
        .post('/api/v1/messages/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(200);

      expect(messageResponse.body.success).toBe(true);
      expect(messageResponse.body.data).toHaveProperty('message_id');
      expect(messageResponse.body.data).toHaveProperty('database_id');

      // Step 6: Verify message in history
      const messagesResponse = await request(app)
        .get('/api/v1/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(messagesResponse.body.success).toBe(true);
      expect(messagesResponse.body.data.messages.length).toBeGreaterThan(0);

      // Step 7: Get user profile
      const profileResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.id).toBe(testUser.id);
    });
  });

  describe('Device Connection Workflow', () => {
    it('should handle device connection workflow', async () => {
      // Create a device for connection testing
      const deviceData = {
        name: 'Connection Test Device',
        description: 'Device for connection testing',
        phone_number: '+0987654321'
      };

      const deviceResponse = await request(app)
        .post('/api/v1/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deviceData)
        .expect(201);

      const device = deviceResponse.body.data.device;

      // Initiate connection
      const connectResponse = await request(app)
        .post(`/api/v1/devices/${device.id}/connect`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(connectResponse.body.success).toBe(true);
      expect(connectResponse.body.data).toHaveProperty('qr_code');
      expect(connectResponse.body.data.status).toBe('connecting');

      // Get device status
      const statusResponse = await request(app)
        .get(`/api/v1/devices/${device.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statusResponse.body.success).toBe(true);
      expect(statusResponse.body.data).toHaveProperty('status');

      // Disconnect device
      const disconnectResponse = await request(app)
        .post(`/api/v1/devices/${device.id}/disconnect`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(disconnectResponse.body.success).toBe(true);
      expect(disconnectResponse.body.data.status).toBe('disconnected');
    });
  });

  describe('Message Broadcasting Workflow', () => {
    it('should handle broadcast message workflow', async () => {
      // Create multiple contacts for broadcast
      const contacts = [
        {
          name: 'Broadcast Contact 1',
          phone_number: '+1111111111',
          email: 'broadcast1@example.com'
        },
        {
          name: 'Broadcast Contact 2',
          phone_number: '+2222222222',
          email: 'broadcast2@example.com'
        }
      ];

      const createdContacts = [];
      for (const contactData of contacts) {
        const response = await request(app)
          .post('/api/v1/contacts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(contactData)
          .expect(201);

        createdContacts.push(response.body.data.contact);
      }

      // Send broadcast message
      const broadcastData = {
        device_id: testDevice.id,
        contacts: createdContacts,
        message_data: {
          message_type: 'text',
          content: 'Broadcast test message'
        },
        options: {
          batch_size: 2,
          delay_between_messages: 1000
        }
      };

      const broadcastResponse = await request(app)
        .post('/api/v1/broadcasts/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send(broadcastData)
        .expect(200);

      expect(broadcastResponse.body.success).toBe(true);
      expect(broadcastResponse.body.data).toHaveProperty('broadcast_id');
      expect(broadcastResponse.body.data.total_contacts).toBe(2);

      // Clean up broadcast contacts
      for (const contact of createdContacts) {
        await Contact.destroy({ where: { id: contact.id } });
      }
    });
  });

  describe('Analytics and Statistics', () => {
    it('should provide analytics data', async () => {
      // Get message statistics
      const messageStatsResponse = await request(app)
        .get('/api/v1/analytics/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(messageStatsResponse.body.success).toBe(true);
      expect(messageStatsResponse.body.data).toHaveProperty('total_messages');

      // Get device statistics
      const deviceStatsResponse = await request(app)
        .get('/api/v1/analytics/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(deviceStatsResponse.body.success).toBe(true);
      expect(deviceStatsResponse.body.data).toHaveProperty('total_devices');

      // Get contact statistics
      const contactStatsResponse = await request(app)
        .get('/api/v1/analytics/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(contactStatsResponse.body.success).toBe(true);
      expect(contactStatsResponse.body.data).toHaveProperty('total_contacts');
    });
  });

  describe('Error Handling and Validation', () => {
    it('should handle invalid requests gracefully', async () => {
      // Test invalid authentication
      const invalidAuthResponse = await request(app)
        .get('/api/v1/devices')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(invalidAuthResponse.body.success).toBe(false);

      // Test invalid device ID
      const invalidDeviceResponse = await request(app)
        .get('/api/v1/devices/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(invalidDeviceResponse.body.success).toBe(false);

      // Test invalid message data
      const invalidMessageResponse = await request(app)
        .post('/api/v1/messages/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          device_id: testDevice.id,
          to_number: 'invalid-phone',
          message_type: 'text',
          content: ''
        })
        .expect(400);

      expect(invalidMessageResponse.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // Make multiple rapid requests to trigger rate limiting
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .get('/api/v1/devices')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited (429 status)
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across operations', async () => {
      // Create a device and verify it appears in device list
      const deviceData = {
        name: 'Consistency Test Device',
        description: 'Device for consistency testing'
      };

      const createResponse = await request(app)
        .post('/api/v1/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deviceData)
        .expect(201);

      const deviceId = createResponse.body.data.device.id;

      // Verify device appears in list
      const listResponse = await request(app)
        .get('/api/v1/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const deviceInList = listResponse.body.data.devices.find(d => d.id === deviceId);
      expect(deviceInList).toBeDefined();
      expect(deviceInList.name).toBe(deviceData.name);

      // Update device and verify changes
      const updateData = {
        name: 'Updated Consistency Test Device'
      };

      await request(app)
        .put(`/api/v1/devices/${deviceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // Verify update in list
      const updatedListResponse = await request(app)
        .get('/api/v1/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const updatedDeviceInList = updatedListResponse.body.data.devices.find(d => d.id === deviceId);
      expect(updatedDeviceInList.name).toBe(updateData.name);

      // Delete device and verify removal
      await request(app)
        .delete(`/api/v1/devices/${deviceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify device removed from list
      const finalListResponse = await request(app)
        .get('/api/v1/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const deletedDeviceInList = finalListResponse.body.data.devices.find(d => d.id === deviceId);
      expect(deletedDeviceInList).toBeUndefined();
    });
  });
}); 
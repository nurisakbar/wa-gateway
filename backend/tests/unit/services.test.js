const BroadcastService = require('../src/services/broadcastService');
const TemplateService = require('../src/services/templateService');
const AnalyticsService = require('../src/services/analyticsService');
const NotificationService = require('../src/services/notificationService');
const CacheService = require('../src/services/cacheService');
const QueueService = require('../src/services/queueService');
const { User, Device, Message, Contact, Template } = require('../src/models');

describe('Service Layer Tests', () => {
  let testUser;
  let testDevice;
  let testContact;
  let broadcastService;
  let templateService;
  let analyticsService;
  let notificationService;
  let cacheService;
  let queueService;

  beforeAll(async () => {
    // Initialize services
    broadcastService = new BroadcastService();
    templateService = new TemplateService();
    analyticsService = new AnalyticsService();
    notificationService = new NotificationService();
    cacheService = new CacheService();
    queueService = new QueueService();

    // Create test user
    testUser = await User.create({
      username: 'servicetest',
      email: 'servicetest@example.com',
      password: 'hashedpassword',
      full_name: 'Service Test User',
      role: 'admin'
    });

    // Create test device
    testDevice = await Device.create({
      user_id: testUser.id,
      name: 'Service Test Device',
      description: 'Device for service testing',
      phone_number: '+1234567890',
      status: 'connected',
      is_active: true
    });

    // Create test contact
    testContact = await Contact.create({
      user_id: testUser.id,
      name: 'Service Test Contact',
      phone_number: '+1234567890',
      email: 'contact@example.com',
      tags: ['test']
    });
  });

  afterAll(async () => {
    // Clean up test data
    await Contact.destroy({ where: { user_id: testUser.id } });
    await Device.destroy({ where: { user_id: testUser.id } });
    await User.destroy({ where: { id: testUser.id } });
  });

  describe('BroadcastService', () => {
    it('should create broadcast ID', () => {
      const broadcastId = broadcastService.generateBroadcastId();
      expect(broadcastId).toBeDefined();
      expect(typeof broadcastId).toBe('string');
      expect(broadcastId.length).toBeGreaterThan(0);
    });

    it('should validate broadcast request', () => {
      const validRequest = {
        device_id: testDevice.id,
        message_data: {
          message_type: 'text',
          content: 'Test broadcast message'
        },
        contacts: [testContact]
      };

      const isValid = broadcastService.validateBroadcastRequest(validRequest);
      expect(isValid).toBe(true);
    });

    it('should reject invalid broadcast request', () => {
      const invalidRequest = {
        device_id: 'invalid-id',
        message_data: {
          message_type: 'text',
          content: ''
        }
      };

      const isValid = broadcastService.validateBroadcastRequest(invalidRequest);
      expect(isValid).toBe(false);
    });

    it('should get contacts for broadcast', async () => {
      const contacts = await broadcastService.getContactsForBroadcast(testUser.id, {
        tags: ['test']
      });

      expect(Array.isArray(contacts)).toBe(true);
      expect(contacts.length).toBeGreaterThan(0);
      expect(contacts[0]).toHaveProperty('id');
      expect(contacts[0]).toHaveProperty('phone_number');
    });
  });

  describe('TemplateService', () => {
    let testTemplate;

    beforeAll(async () => {
      // Create test template
      testTemplate = await Template.create({
        user_id: testUser.id,
        name: 'Test Template',
        category: 'general',
        language: 'en',
        content: 'Hello {{name}}, this is a test message.',
        variables: ['name'],
        status: 'approved',
        description: 'Test template for service testing'
      });
    });

    afterAll(async () => {
      await Template.destroy({ where: { id: testTemplate.id } });
    });

    it('should create template', async () => {
      const templateData = {
        user_id: testUser.id,
        name: 'Service Test Template',
        category: 'notification',
        language: 'en',
        content: 'Hello {{name}}, welcome to our service!',
        variables: ['name'],
        description: 'Welcome template'
      };

      const template = await templateService.createTemplate(templateData);
      expect(template).toBeDefined();
      expect(template.name).toBe(templateData.name);
      expect(template.content).toBe(templateData.content);

      // Clean up
      await Template.destroy({ where: { id: template.id } });
    });

    it('should validate template data', () => {
      const validData = {
        name: 'Valid Template',
        content: 'Hello {{name}}',
        variables: ['name']
      };

      const isValid = templateService.validateTemplateData(validData);
      expect(isValid).toBe(true);
    });

    it('should reject invalid template data', () => {
      const invalidData = {
        name: '',
        content: 'No variables',
        variables: []
      };

      const isValid = templateService.validateTemplateData(invalidData);
      expect(isValid).toBe(false);
    });

    it('should format template with variables', () => {
      const variables = { name: 'John Doe' };
      const formatted = templateService.formatTemplate(testTemplate.content, variables);
      expect(formatted).toBe('Hello John Doe, this is a test message.');
    });

    it('should get user templates', async () => {
      const templates = await templateService.getUserTemplates(testUser.id);
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should approve template', async () => {
      const approvedTemplate = await templateService.approveTemplate(
        testTemplate.id,
        testUser.id
      );
      expect(approvedTemplate.status).toBe('approved');
      expect(approvedTemplate.approved_by).toBe(testUser.id);
    });
  });

  describe('AnalyticsService', () => {
    it('should get message statistics', async () => {
      const stats = await analyticsService.getMessageStats(testUser.id);
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('total_messages');
      expect(stats).toHaveProperty('sent_messages');
      expect(stats).toHaveProperty('failed_messages');
    });

    it('should get device statistics', async () => {
      const stats = await analyticsService.getDeviceStats(testUser.id);
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('total_devices');
      expect(stats).toHaveProperty('connected_devices');
      expect(stats).toHaveProperty('disconnected_devices');
    });

    it('should get contact statistics', async () => {
      const stats = await analyticsService.getContactStats(testUser.id);
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('total_contacts');
      expect(stats).toHaveProperty('active_contacts');
    });

    it('should get user activity report', async () => {
      const report = await analyticsService.getUserActivityReport(testUser.id);
      expect(report).toBeDefined();
      expect(report).toHaveProperty('total_messages');
      expect(report).toHaveProperty('total_devices');
      expect(report).toHaveProperty('total_contacts');
    });

    it('should get system metrics', async () => {
      const metrics = await analyticsService.getSystemMetrics();
      expect(metrics).toBeDefined();
      expect(metrics).toHaveProperty('total_users');
      expect(metrics).toHaveProperty('total_messages');
      expect(metrics).toHaveProperty('total_devices');
    });

    it('should get template statistics', async () => {
      const stats = await analyticsService.getTemplateStats(testUser.id);
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('total_templates');
      expect(stats).toHaveProperty('approved_templates');
      expect(stats).toHaveProperty('pending_templates');
    });
  });

  describe('NotificationService', () => {
    it('should send email notification', async () => {
      const notificationData = {
        type: 'email',
        to: 'test@example.com',
        subject: 'Test Notification',
        message: 'This is a test notification'
      };

      const result = await notificationService.sendNotification(notificationData);
      expect(result).toBeDefined();
    });

    it('should send system notification', async () => {
      const notificationData = {
        user_id: testUser.id,
        title: 'System Update',
        message: 'System has been updated',
        type: 'info'
      };

      const result = await notificationService.sendSystemNotification(notificationData);
      expect(result).toBeDefined();
    });

    it('should validate notification data', () => {
      const validData = {
        type: 'email',
        to: 'test@example.com',
        subject: 'Test',
        message: 'Test message'
      };

      const isValid = notificationService.validateNotificationData(validData);
      expect(isValid).toBe(true);
    });
  });

  describe('CacheService', () => {
    beforeAll(async () => {
      await cacheService.initializeRedis();
    });

    it('should set and get cache value', async () => {
      const key = 'test:key';
      const value = { test: 'data' };

      await cacheService.set(key, value, 60);
      const cached = await cacheService.get(key);

      expect(cached).toEqual(value);
    });

    it('should delete cache value', async () => {
      const key = 'test:delete';
      const value = 'test value';

      await cacheService.set(key, value, 60);
      await cacheService.delete(key);
      const cached = await cacheService.get(key);

      expect(cached).toBeNull();
    });

    it('should set hash values', async () => {
      const key = 'test:hash';
      const data = { field1: 'value1', field2: 'value2' };

      await cacheService.setHash(key, data);
      const cached = await cacheService.getHash(key);

      expect(cached).toEqual(data);
    });

    it('should increment counter', async () => {
      const key = 'test:counter';
      
      await cacheService.set(key, 0, 60);
      const result = await cacheService.increment(key);
      
      expect(result).toBe(1);
    });

    it('should get cache statistics', async () => {
      const stats = await cacheService.getStats();
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('keys');
      expect(stats).toHaveProperty('memory');
    });
  });

  describe('QueueService', () => {
    beforeAll(async () => {
      await queueService.initialize();
    });

    it('should create queue', () => {
      const queueName = 'test-queue';
      const queue = queueService.createQueue(queueName);
      
      expect(queue).toBeDefined();
      expect(queueService.getQueueStatus(queueName)).toBeDefined();
    });

    it('should add job to queue', async () => {
      const queueName = 'test-jobs';
      const jobData = { test: 'job data' };

      const job = await queueService.addJob(queueName, jobData);
      expect(job).toBeDefined();
      expect(job.data).toEqual(jobData);
    });

    it('should get job status', async () => {
      const queueName = 'test-status';
      const jobData = { test: 'status job' };

      const job = await queueService.addJob(queueName, jobData);
      const status = await queueService.getJobStatus(queueName, job.id);

      expect(status).toBeDefined();
      expect(status).toHaveProperty('id');
      expect(status).toHaveProperty('status');
    });

    it('should cancel job', async () => {
      const queueName = 'test-cancel';
      const jobData = { test: 'cancel job' };

      const job = await queueService.addJob(queueName, jobData);
      const result = await queueService.cancelJob(queueName, job.id);

      expect(result).toBe(true);
    });

    it('should clear queue', async () => {
      const queueName = 'test-clear';
      const jobData = { test: 'clear job' };

      await queueService.addJob(queueName, jobData);
      await queueService.clearQueue(queueName);

      const status = queueService.getQueueStatus(queueName);
      expect(status.jobs).toBe(0);
    });

    it('should get queue statistics', async () => {
      const stats = await queueService.getStats();
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('queues');
      expect(stats).toHaveProperty('jobs');
    });
  });
}); 
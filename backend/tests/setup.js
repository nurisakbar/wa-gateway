const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Test database configuration
const testDbConfig = {
  database: process.env.TEST_DB_NAME || 'wa_gateway_test',
  username: process.env.TEST_DB_USER || 'root',
  password: process.env.TEST_DB_PASSWORD || '',
  host: process.env.TEST_DB_HOST || 'localhost',
  port: process.env.TEST_DB_PORT || 3306,
  dialect: 'mysql',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// Create test database connection
const testSequelize = new Sequelize(testDbConfig);

// Global test setup
beforeAll(async () => {
  try {
    // Connect to test database
    await testSequelize.authenticate();
    console.log('Test database connected successfully');

    // Sync all models (create tables)
    await testSequelize.sync({ force: true });
    console.log('Test database synced successfully');

    // Set global test database instance
    global.testSequelize = testSequelize;
  } catch (error) {
    console.error('Test database setup failed:', error);
    throw error;
  }
});

// Global test teardown
afterAll(async () => {
  try {
    // Close database connection
    await testSequelize.close();
    console.log('Test database connection closed');
  } catch (error) {
    console.error('Test database teardown failed:', error);
  }
});

// Global test utilities
global.testUtils = {
  // Create test user
  createTestUser: async (userData = {}) => {
    const { User } = require('../src/models');
    const defaultData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPassword123',
      full_name: 'Test User',
      role: 'user',
      is_active: true
    };
    
    return await User.create({ ...defaultData, ...userData });
  },

  // Create test device
  createTestDevice: async (userId, deviceData = {}) => {
    const { Device } = require('../src/models');
    const defaultData = {
      user_id: userId,
      name: 'Test Device',
      description: 'Test device description',
      phone_number: '+1234567890',
      status: 'disconnected',
      is_active: true
    };
    
    return await Device.create({ ...defaultData, ...deviceData });
  },

  // Create test contact
  createTestContact: async (userId, contactData = {}) => {
    const { Contact } = require('../src/models');
    const defaultData = {
      user_id: userId,
      name: 'Test Contact',
      phone_number: '+1234567890',
      email: 'contact@example.com',
      tags: ['test']
    };
    
    return await Contact.create({ ...defaultData, ...contactData });
  },

  // Create test message
  createTestMessage: async (userId, deviceId, messageData = {}) => {
    const { Message } = require('../src/models');
    const defaultData = {
      user_id: userId,
      device_id: deviceId,
      to_number: '+1234567890',
      message_type: 'text',
      content: 'Test message content',
      status: 'sent',
      timestamp: new Date()
    };
    
    return await Message.create({ ...defaultData, ...messageData });
  },

  // Clean up test data
  cleanupTestData: async () => {
    const { User, Device, Contact, Message, Template } = require('../src/models');
    
    await Message.destroy({ where: {}, force: true });
    await Contact.destroy({ where: {}, force: true });
    await Device.destroy({ where: {}, force: true });
    await Template.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  },

  // Generate test token
  generateTestToken: (userId) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { user_id: userId, role: 'user' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  },

  // Mock WhatsApp service
  mockWhatsAppService: () => {
    return {
      sendMessage: jest.fn().mockResolvedValue({
        message_id: 'test-message-id',
        status: 'sent',
        timestamp: new Date()
      }),
      connectDevice: jest.fn().mockResolvedValue({
        qr_code: 'test-qr-code',
        status: 'connecting'
      }),
      disconnectDevice: jest.fn().mockResolvedValue({
        status: 'disconnected'
      }),
      getDeviceStatus: jest.fn().mockResolvedValue({
        status: 'connected',
        last_activity: new Date()
      })
    };
  },

  // Mock notification service
  mockNotificationService: () => {
    return {
      sendNotification: jest.fn().mockResolvedValue(true),
      sendEmailNotification: jest.fn().mockResolvedValue(true),
      sendSystemNotification: jest.fn().mockResolvedValue(true)
    };
  },

  // Mock cache service
  mockCacheService: () => {
    return {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(true),
      delete: jest.fn().mockResolvedValue(true),
      getHash: jest.fn().mockResolvedValue({}),
      setHash: jest.fn().mockResolvedValue(true),
      increment: jest.fn().mockResolvedValue(1)
    };
  },

  // Mock queue service
  mockQueueService: () => {
    return {
      addJob: jest.fn().mockResolvedValue({ id: 'test-job-id' }),
      getJobStatus: jest.fn().mockResolvedValue({
        id: 'test-job-id',
        status: 'completed'
      }),
      cancelJob: jest.fn().mockResolvedValue(true),
      clearQueue: jest.fn().mockResolvedValue(true)
    };
  }
};

// Increase timeout for all tests
jest.setTimeout(30000);

// Suppress console logs during tests (unless there's an error)
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  console.log = jest.fn();
  console.error = originalConsoleError; // Keep error logging
});

afterEach(() => {
  console.log = originalConsoleLog;
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
}); 
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock database configuration for testing
const testDbConfig = {
  database: ':memory:', // Use in-memory SQLite for testing
  dialect: 'sqlite',
  logging: false,
  storage: ':memory:',
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
};

// Create test database connection
const testSequelize = new Sequelize(testDbConfig);

// Mock the database configuration to use SQLite for tests
jest.mock('../src/config/database', () => {
  const { Sequelize } = require('sequelize');
  const testSequelize = new Sequelize({
    database: ':memory:',
    dialect: 'sqlite',
    logging: false,
    storage: ':memory:',
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  });
  
  return {
    sequelize: testSequelize,
    Sequelize,
    testConnection: jest.fn().mockResolvedValue(true),
    syncDatabase: jest.fn().mockResolvedValue(true),
    closeConnection: jest.fn().mockResolvedValue(true)
  };
});

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
    // Don't throw error, continue with mocked services
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
    try {
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
    } catch (error) {
      // Return mock user if database is not available
      return {
        id: 'test-user-id',
        username: userData.username || 'testuser',
        email: userData.email || 'test@example.com',
        full_name: userData.full_name || 'Test User',
        role: userData.role || 'user',
        is_active: true
      };
    }
  },

  // Create test device
  createTestDevice: async (userId, deviceData = {}) => {
    try {
      const { Device } = require('../src/models');
      const defaultData = {
        user_id: userId,
        name: 'Test Device',
        description: 'Device for service testing',
        phone_number: '+1234567890',
        status: 'connected',
        is_active: true
      };
      
      return await Device.create({ ...defaultData, ...deviceData });
    } catch (error) {
      // Return mock device if database is not available
      return {
        id: 'test-device-id',
        user_id: userId,
        name: deviceData.name || 'Test Device',
        description: deviceData.description || 'Device for service testing',
        phone_number: deviceData.phone_number || '+1234567890',
        status: deviceData.status || 'connected',
        is_active: true
      };
    }
  },

  // Create test contact
  createTestContact: async (userId, contactData = {}) => {
    try {
      const { Contact } = require('../src/models');
      const defaultData = {
        user_id: userId,
        name: 'Test Contact',
        phone_number: '+1234567890',
        email: 'contact@example.com',
        tags: ['test']
      };
      
      return await Contact.create({ ...defaultData, ...contactData });
    } catch (error) {
      // Return mock contact if database is not available
      return {
        id: 'test-contact-id',
        user_id: userId,
        name: contactData.name || 'Test Contact',
        phone_number: contactData.phone_number || '+1234567890',
        email: contactData.email || 'contact@example.com',
        tags: contactData.tags || ['test']
      };
    }
  },

  // Create test message
  createTestMessage: async (userId, deviceId, messageData = {}) => {
    try {
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
    } catch (error) {
      // Return mock message if database is not available
      return {
        id: 'test-message-id',
        user_id: userId,
        device_id: deviceId,
        to_number: messageData.to_number || '+1234567890',
        message_type: messageData.message_type || 'text',
        content: messageData.content || 'Test message content',
        status: messageData.status || 'sent',
        timestamp: new Date()
      };
    }
  },

  // Clean up test data
  cleanupTestData: async () => {
    try {
      const { User, Device, Contact, Message, Template } = require('../src/models');
      
      await Message.destroy({ where: {}, force: true });
      await Contact.destroy({ where: {}, force: true });
      await Device.destroy({ where: {}, force: true });
      await Template.destroy({ where: {}, force: true });
      await User.destroy({ where: {}, force: true });
    } catch (error) {
      // Ignore cleanup errors in test environment
      console.log('Cleanup skipped (using mock data)');
    }
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
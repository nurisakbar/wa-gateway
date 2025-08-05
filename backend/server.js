const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
require('dotenv').config();

// Import utilities
const { logInfo, logError, requestLogger, errorLogger } = require('./src/utils/logger');
const { testConnection, syncDatabase } = require('./src/config/database');

// Import models
const { User, Device, Message, Contact } = require('./src/models');

// Create Express app
const app = express();

// Environment variables
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: CORS_ORIGIN.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Speed limiting
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: 500 // begin adding 500ms of delay per request above 50
});

// Apply rate limiting to all routes
app.use(limiter);
app.use(speedLimiter);

// Logging middleware
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: { write: message => logInfo(message.trim()) } }));
}

// Custom request logger
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes prefix
const API_PREFIX = process.env.API_PREFIX || '/api';
const API_VERSION = process.env.API_VERSION || 'v1';

// Import routes
const authRoutes = require('./src/routes/auth');
const deviceRoutes = require('./src/routes/devices');
const messageRoutes = require('./src/routes/messages');
const contactRoutes = require('./src/routes/contacts');
const fileRoutes = require('./src/routes/files');
const webhookRoutes = require('./src/routes/webhooks');
const socketRoutes = require('./src/routes/sockets');
const broadcastRoutes = require('./src/routes/broadcasts');
const analyticsRoutes = require('./src/routes/analytics');
const apiKeyRoutes = require('./src/routes/apiKeys');
const whatsappRoutes = require('./src/routes/whatsapp');
const subscriptionRoutes = require('./src/routes/subscriptions');
const invoiceRoutes = require('./src/routes/invoices');

// Import middleware
const { trackApiUsage } = require('./src/middleware/usageTracker');

// API routes
app.use(`${API_PREFIX}/${API_VERSION}/auth`, authRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/devices`, deviceRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/messages`, messageRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/contacts`, contactRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/files`, fileRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/webhooks`, webhookRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/sockets`, socketRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/broadcasts`, broadcastRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/analytics`, trackApiUsage, analyticsRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/api-keys`, apiKeyRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/whatsapp`, trackApiUsage, whatsappRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/subscriptions`, subscriptionRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/invoices`, invoiceRoutes);

// Initialize services
const notificationService = require('./src/services/notificationService');
const cacheService = require('./src/services/cacheService');
const queueService = require('./src/services/queueService');

// Initialize queues
queueService.createQueue('email', { concurrency: 2, maxRetries: 3 });
queueService.createQueue('broadcast', { concurrency: 1, maxRetries: 2 });
queueService.createQueue('file-processing', { concurrency: 3, maxRetries: 2 });

// Register queue handlers
queueService.registerHandler('email', async (data) => {
  return await notificationService.sendNotification(data);
});

queueService.registerHandler('broadcast', async (data) => {
  const broadcastService = require('./src/services/broadcastService');
  return await broadcastService.executeBroadcast(
    data.broadcastId,
    data.deviceId,
    data.contacts,
    data.messageData,
    data.options
  );
});

queueService.registerHandler('file-processing', async (data) => {
  const fileUploadService = require('./src/services/fileUploadService');
  return await fileUploadService.processFile(data);
});

// Swagger documentation (if enabled)
if (process.env.ENABLE_SWAGGER === 'true') {
  const swaggerUi = require('swagger-ui-express');
  const specs = require('./src/config/swagger');

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'WA Gateway API Documentation'
  }));
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorLogger);

// Global error handler
app.use((error, req, res, next) => {
  logError(error, 'Global Error Handler');
  
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: true,
    message,
    ...(NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logInfo('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logInfo('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logError(new Error(`Unhandled Rejection at: ${promise}, reason: ${reason}`));
  process.exit(1);
});

// Uncaught exceptions
process.on('uncaughtException', (error) => {
  logError(error, 'Uncaught Exception');
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logError(new Error('Database connection failed'));
      process.exit(1);
    }

    // Sync database (create tables if they don't exist)
    if (NODE_ENV === 'development') {
      await syncDatabase(false); // false = don't force recreate tables
      logInfo('Database synchronized successfully');
    }

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logInfo(`🚀 Server is running on port ${PORT}`);
      logInfo(`📊 Environment: ${NODE_ENV}`);
      logInfo(`🔗 Health check: http://localhost:${PORT}/health`);
      if (process.env.ENABLE_SWAGGER === 'true') {
        logInfo(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      }
    });

    // Socket.io setup
    const socketService = require('./src/services/socketService');
    socketService.initialize(server);

    // Handle server errors
    server.on('error', (error) => {
      logError(error, 'Server Error');
      process.exit(1);
    });

  } catch (error) {
    logError(error, 'Server Startup Error');
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app; 
# WA Gateway - Backend API Development Guide

## 🎯 Pendekatan Pengembangan: API-First

Kami mengadopsi pendekatan **API-First Development** dimana backend API dikembangkan terlebih dahulu sebelum frontend. Ini memberikan beberapa keuntungan:

### ✅ Keuntungan API-First Development
1. **Clear Contract**: API specification yang jelas antara frontend dan backend
2. **Parallel Development**: Frontend dan backend bisa dikembangkan secara paralel
3. **Better Testing**: API bisa ditest secara independen
4. **Multiple Clients**: API bisa digunakan oleh berbagai client (web, mobile, third-party)
5. **Documentation**: API documentation yang lengkap sebelum implementasi

## 📋 Roadmap Pengembangan Backend

### Phase 1: Backend Foundation (Week 1-2)

#### 1.1 Project Setup
```bash
# Create backend directory structure
mkdir -p backend/src/{controllers,services,routes,middleware,models,config,utils}
mkdir -p backend/{uploads,sessions,logs}

# Initialize package.json
cd backend
npm init -y

# Install core dependencies
npm install express cors helmet morgan dotenv
npm install mysql2 sequelize
npm install jsonwebtoken bcryptjs
npm install socket.io
npm install multer
npm install @whiskeysockets/baileys
npm install qrcode
npm install winston

# Install development dependencies
npm install -D nodemon eslint prettier
```

#### 1.2 Database Schema Implementation
```sql
-- Implement database schema dari database/schema.sql
-- Setup database connection
-- Create database models dengan Sequelize
```

#### 1.3 Basic Express Server
```javascript
// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/auth', require('./src/routes/auth'));
app.use('/api/v1/health', require('./src/routes/health'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

#### 1.4 Authentication System
```javascript
// src/middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };
```

#### 1.5 WhatsApp Connection Setup
```javascript
// src/services/whatsappService.js
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');

class WhatsAppService {
  constructor() {
    this.sessions = new Map();
  }

  async createSession(deviceId) {
    const { state, saveCreds } = await useMultiFileAuthState(`sessions/${deviceId}`);
    
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        const qrCode = await qrcode.toDataURL(qr);
        // Emit QR code to client
      }
      
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          this.createSession(deviceId);
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);
    
    this.sessions.set(deviceId, sock);
    return sock;
  }
}

module.exports = new WhatsAppService();
```

### Phase 2: Core API Development (Week 3-4)

#### 2.1 Device Management API
```javascript
// src/controllers/deviceController.js
const Device = require('../models/Device');
const whatsappService = require('../services/whatsappService');

exports.createDevice = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    const device = await Device.create({
      userId,
      name,
      description,
      status: 'disconnected'
    });

    res.status(201).json({
      success: true,
      data: device
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getDevices = async (req, res) => {
  try {
    const userId = req.user.id;
    const devices = await Device.findAll({ where: { userId } });

    res.json({
      success: true,
      data: devices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.connectDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const device = await Device.findByPk(deviceId);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const sock = await whatsappService.createSession(deviceId);
    
    device.status = 'connecting';
    await device.save();

    res.json({
      success: true,
      message: 'Device connection initiated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

#### 2.2 Message Sending API
```javascript
// src/controllers/messageController.js
const Message = require('../models/Message');
const whatsappService = require('../services/whatsappService');

exports.sendMessage = async (req, res) => {
  try {
    const { deviceId, to, message, type = 'text' } = req.body;
    const userId = req.user.id;

    // Validate device
    const device = await Device.findByPk(deviceId);
    if (!device || device.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    // Get WhatsApp session
    const sock = whatsappService.sessions.get(deviceId);
    if (!sock) {
      return res.status(400).json({
        success: false,
        error: 'Device not connected'
      });
    }

    // Send message
    const messageData = {
      text: message
    };

    const result = await sock.sendMessage(`${to}@s.whatsapp.net`, messageData);

    // Save to database
    const savedMessage = await Message.create({
      deviceId,
      userId,
      messageId: result.key.id,
      fromNumber: device.phoneNumber,
      toNumber: to,
      messageType: type,
      content: message,
      direction: 'outgoing',
      status: 'sent',
      timestamp: new Date()
    });

    res.json({
      success: true,
      data: savedMessage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { deviceId, limit = 50, offset = 0 } = req.query;
    const userId = req.user.id;

    const where = { userId };
    if (deviceId) where.deviceId = deviceId;

    const messages = await Message.findAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['timestamp', 'DESC']]
    });

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

#### 2.3 File Upload API
```javascript
// src/controllers/fileController.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const File = require('../models/File');

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = `uploads/${req.user.id}`;
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 16 * 1024 * 1024 // 16MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|mp4|avi|mov|mp3|wav/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('File type not supported'));
    }
  }
});

exports.uploadFile = [
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const file = await File.create({
        userId: req.user.id,
        originalName: req.file.originalname,
        fileName: req.file.filename,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        fileType: getFileType(req.file.mimetype),
        extension: path.extname(req.file.originalname)
      });

      res.json({
        success: true,
        data: file
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
];

exports.getFiles = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const userId = req.user.id;

    const files = await File.findAll({
      where: { userId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

#### 2.4 WebSocket Setup
```javascript
// src/services/socketService.js
const socketIo = require('socket.io');

class SocketService {
  constructor(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Join user room
      socket.on('join', (userId) => {
        socket.join(`user_${userId}`);
      });

      // Handle device connection
      socket.on('device_connect', (deviceId) => {
        socket.join(`device_${deviceId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  // Emit events to specific users/devices
  emitToUser(userId, event, data) {
    this.io.to(`user_${userId}`).emit(event, data);
  }

  emitToDevice(deviceId, event, data) {
    this.io.to(`device_${deviceId}`).emit(event, data);
  }

  // Broadcast to all connected clients
  broadcast(event, data) {
    this.io.emit(event, data);
  }
}

module.exports = SocketService;
```

### Phase 3: Advanced API Features (Week 5-6)

#### 3.1 Auto-reply System API
```javascript
// src/controllers/autoReplyController.js
const AutoReply = require('../models/AutoReply');

exports.createAutoReply = async (req, res) => {
  try {
    const { keyword, response, isActive = true } = req.body;
    const userId = req.user.id;

    const autoReply = await AutoReply.create({
      userId,
      keyword,
      response,
      isActive
    });

    res.status(201).json({
      success: true,
      data: autoReply
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getAutoReplies = async (req, res) => {
  try {
    const userId = req.user.id;
    const autoReplies = await AutoReply.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: autoReplies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

#### 3.2 Broadcast Messages API
```javascript
// src/controllers/broadcastController.js
const Broadcast = require('../models/Broadcast');
const Contact = require('../models/Contact');
const whatsappService = require('../services/whatsappService');

exports.createBroadcast = async (req, res) => {
  try {
    const { deviceId, message, contactIds, scheduledAt } = req.body;
    const userId = req.user.id;

    const broadcast = await Broadcast.create({
      userId,
      deviceId,
      message,
      contactIds: JSON.stringify(contactIds),
      scheduledAt,
      status: 'pending'
    });

    // If immediate broadcast
    if (!scheduledAt) {
      await this.processBroadcast(broadcast);
    }

    res.status(201).json({
      success: true,
      data: broadcast
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.processBroadcast = async (broadcast) => {
  try {
    const contactIds = JSON.parse(broadcast.contactIds);
    const contacts = await Contact.findAll({
      where: { id: contactIds }
    });

    const sock = whatsappService.sessions.get(broadcast.deviceId);
    if (!sock) {
      throw new Error('Device not connected');
    }

    let successCount = 0;
    let failCount = 0;

    for (const contact of contacts) {
      try {
        await sock.sendMessage(`${contact.phoneNumber}@s.whatsapp.net`, {
          text: broadcast.message
        });
        successCount++;
      } catch (error) {
        failCount++;
        console.error(`Failed to send to ${contact.phoneNumber}:`, error);
      }
    }

    broadcast.status = 'completed';
    broadcast.successCount = successCount;
    broadcast.failCount = failCount;
    await broadcast.save();

  } catch (error) {
    broadcast.status = 'failed';
    broadcast.error = error.message;
    await broadcast.save();
  }
};
```

### Phase 4: API Integration & Testing (Week 7-8)

#### 4.1 API Documentation dengan Swagger
```javascript
// src/config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WA Gateway API',
      version: '1.0.0',
      description: 'WhatsApp Gateway API Documentation',
    },
    servers: [
      {
        url: 'http://localhost:3001/api/v1',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'], // Path to the API routes
};

const specs = swaggerJsdoc(options);
module.exports = specs;
```

#### 4.2 API Testing dengan Postman Collection
```json
{
  "info": {
    "name": "WA Gateway API",
    "description": "Complete API collection for WA Gateway",
    "version": "1.0.0"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/auth/login",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"admin@example.com\",\n  \"password\": \"password123\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            }
          }
        }
      ]
    },
    {
      "name": "Devices",
      "item": [
        {
          "name": "Get Devices",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/devices",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

#### 4.3 Error Handling & Logging
```javascript
// src/middleware/errorHandler.js
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'wa-gateway' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

const errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.message
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal Server Error'
  });
};

module.exports = { errorHandler, logger };
```

## 🧪 Testing Strategy

### Unit Testing
```javascript
// tests/controllers/messageController.test.js
const request = require('supertest');
const app = require('../../src/app');
const Message = require('../../src/models/Message');

describe('Message Controller', () => {
  beforeEach(async () => {
    await Message.destroy({ where: {} });
  });

  describe('POST /api/v1/messages/send', () => {
    it('should send a message successfully', async () => {
      const response = await request(app)
        .post('/api/v1/messages/send')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          deviceId: 'test-device',
          to: '6281234567890',
          message: 'Test message'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
```

### Integration Testing
```javascript
// tests/integration/whatsapp.test.js
const whatsappService = require('../../src/services/whatsappService');

describe('WhatsApp Service Integration', () => {
  it('should create a new session', async () => {
    const deviceId = 'test-device';
    const session = await whatsappService.createSession(deviceId);
    
    expect(session).toBeDefined();
    expect(whatsappService.sessions.has(deviceId)).toBe(true);
  });
});
```

## 📊 API Performance Monitoring

### Response Time Monitoring
```javascript
// src/middleware/performance.js
const performance = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });
  
  next();
};
```

### Rate Limiting
```javascript
// src/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP'
  }
});

module.exports = apiLimiter;
```

## 🚀 Deployment Preparation

### Environment Configuration
```bash
# .env.example
NODE_ENV=production
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wagateway
DB_USER=wagateway
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=16777216

# WhatsApp
WHATSAPP_SESSION_PATH=./sessions
WHATSAPP_QR_TIMEOUT=60000

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

### Health Check Endpoint
```javascript
// src/routes/health.js
const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');

router.get('/', async (req, res) => {
  try {
    // Test database connection
    await sequelize.authenticate();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router;
```

## 📝 Next Steps

Setelah backend API selesai dikembangkan dan ditest, langkah selanjutnya adalah:

1. **Frontend Development**: Setup Nuxt.js dan implementasi UI
2. **API Integration**: Integrasi frontend dengan backend API
3. **Real-time Features**: Implementasi WebSocket untuk real-time updates
4. **Testing**: End-to-end testing
5. **Deployment**: Deploy ke production environment

Dokumentasi ini memberikan foundation yang solid untuk pengembangan backend API yang robust dan scalable. 
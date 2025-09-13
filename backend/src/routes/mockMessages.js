// Mock message routes for testing without WhatsApp connection
const express = require('express');
const router = express.Router();
const mockMessageController = require('../controllers/mockMessageController');

const { authenticateToken } = require('../middleware/auth');
const { 
  validateMessageSending, 
  validateUUID
} = require('../middleware/validation');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Send text message (mock)
router.post('/device/:deviceId/text', validateUUID, validateMessageSending, mockMessageController.sendTextMessage);

// Send media message (mock)
router.post('/device/:deviceId/media', validateUUID, mockMessageController.sendMediaMessage);

module.exports = router;

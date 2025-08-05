const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken, requireOperator } = require('../middleware/auth');
const { 
  validateMessageSending, 
  validateUUID, 
  validateMessageUUID,
  validatePagination,
  validatePhoneNumber
} = require('../middleware/validation');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all user messages
router.get('/', validatePagination, messageController.getUserMessages);

// Get unread message count
router.get('/unread', messageController.getUnreadCount);

// Get message by ID
router.get('/:messageId', validateMessageUUID, messageController.getMessage);

// Delete message
router.delete('/:messageId', validateMessageUUID, messageController.deleteMessage);

// Mark message as read
router.patch('/:messageId/read', validateMessageUUID, messageController.markMessageAsRead);

// Device-specific message routes
router.get('/device/:deviceId', validateUUID, validatePagination, messageController.getDeviceMessages);

// Get conversation with a specific number
router.get('/device/:deviceId/conversation', validateUUID, validatePhoneNumber, messageController.getConversation);

// Get message statistics for a device
router.get('/device/:deviceId/stats', validateUUID, messageController.getMessageStats);

// Send text message from device
router.post('/device/:deviceId/text', validateUUID, validateMessageSending, messageController.sendTextMessage);

// Send media message from device
router.post('/device/:deviceId/media', validateUUID, messageController.sendMediaMessage);

// Send location message from device
router.post('/device/:deviceId/location', validateUUID, messageController.sendLocationMessage);

// Send contact message from device
router.post('/device/:deviceId/contact', validateUUID, messageController.sendContactMessage);

module.exports = router; 
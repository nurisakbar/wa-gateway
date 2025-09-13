const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

const { authenticateToken, requireOperator } = require('../middleware/auth');
const { requireSubscription } = require('../middleware/requireSubscription');
const { 
  validateMessageSending, 
  validateUUID, 
  validateMessageUUID,
  validatePagination,
  validatePhoneNumber
} = require('../middleware/validation');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Apply subscription requirement to all message routes
router.use(requireSubscription);

// Get sent messages only (must be before /:messageId)
router.get('/sent', validatePagination, messageController.getSentMessages);

// Get inbox messages only (must be before /:messageId)
router.get('/inbox', validatePagination, messageController.getInboxMessages);

// Get unread message count (must be before /:messageId)
router.get('/unread', messageController.getUnreadCount);

// Device-specific message routes (must be before /:messageId)
router.get('/device/:deviceId', validateUUID, validatePagination, messageController.getDeviceMessages);

// Get all user messages
router.get('/', validatePagination, messageController.getUserMessages);

// Get message by ID (must be after specific routes like /sent, /inbox, /unread, /device)
router.get('/:messageId', validateMessageUUID, messageController.getMessage);

// Delete message
router.delete('/:messageId', validateMessageUUID, messageController.deleteMessage);

// Mark message as read
router.patch('/:messageId/read', validateMessageUUID, messageController.markMessageAsRead);

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

// Generic send message endpoint (redirects to appropriate specific endpoint)
router.post('/send', messageController.sendMessage);

module.exports = router; 
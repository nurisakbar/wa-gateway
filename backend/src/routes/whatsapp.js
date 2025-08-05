const express = require('express');
const router = express.Router();
const { authenticateApiKey, requireWritePermission } = require('../middleware/apiAuth');
const { validateUUID } = require('../middleware/validation');
const whatsappController = require('../controllers/whatsappController');

// All routes require API key authentication
router.use(authenticateApiKey);

// Send message
router.post('/send-message', requireWritePermission, whatsappController.sendMessage);

// Send template message
router.post('/send-template', requireWritePermission, whatsappController.sendTemplate);

// Send bulk messages
router.post('/send-bulk', requireWritePermission, whatsappController.sendBulk);

// Get messages
router.get('/messages', whatsappController.getMessages);

// Get message status
router.get('/status/:messageId', validateUUID, whatsappController.getMessageStatus);

// Get balance/usage
router.get('/balance', whatsappController.getBalance);

// Get devices
router.get('/devices', whatsappController.getDevices);

// Webhook endpoint
router.post('/webhook', whatsappController.handleWebhook);

module.exports = router; 
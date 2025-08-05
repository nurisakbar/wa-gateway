const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validateIdUUID } = require('../middleware/validation');
const webhookController = require('../controllers/webhookController');

// All routes require authentication
router.use(authenticateToken);

// Get all webhooks for user
router.get('/', webhookController.getUserWebhooks);

// Create new webhook
router.post('/', webhookController.createWebhook);

// Get specific webhook
router.get('/:id', validateIdUUID, webhookController.getWebhookStats);

// Update webhook
router.put('/:id', validateIdUUID, webhookController.updateWebhook);

// Delete webhook
router.delete('/:id', validateIdUUID, webhookController.deleteWebhook);

// Test webhook
router.post('/:id/test', validateIdUUID, webhookController.testWebhook);

module.exports = router; 
const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const { validateWebhook } = require('../middleware/validation');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get available events
router.get('/events', webhookController.getAvailableEvents);

// Get webhook statistics
router.get('/stats', webhookController.getWebhookStats);

// Get all webhooks
router.get('/', webhookController.getAllWebhooks);

// Create webhook
router.post('/', validateWebhook, webhookController.createWebhook);

// Validate webhook configuration
router.post('/validate', webhookController.validateWebhookConfig);

// Get webhook by ID
router.get('/:webhookId', webhookController.getWebhook);

// Update webhook
router.put('/:webhookId', validateWebhook, webhookController.updateWebhook);

// Delete webhook
router.delete('/:webhookId', webhookController.deleteWebhook);

// Test webhook
router.post('/:webhookId/test', webhookController.testWebhook);

// Reactivate webhook
router.patch('/:webhookId/reactivate', webhookController.reactivateWebhook);

// Clean up inactive webhooks (super admin only)
router.post('/cleanup', requireSuperAdmin, webhookController.cleanupInactiveWebhooks);

module.exports = router; 
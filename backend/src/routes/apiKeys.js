const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validateIdUUID } = require('../middleware/validation');
const apiKeyController = require('../controllers/apiKeyController');

// All routes require authentication
router.use(authenticateToken);

// Get all API keys for user
router.get('/', apiKeyController.getUserApiKeys);

// Create new API key
router.post('/', apiKeyController.createApiKey);

// Get specific API key
router.get('/:id', validateIdUUID, apiKeyController.getApiKey);

// Update API key
router.put('/:id', validateIdUUID, apiKeyController.updateApiKey);

// Regenerate API key
router.post('/:id/regenerate', validateIdUUID, apiKeyController.regenerateApiKey);

// Delete API key
router.delete('/:id', validateIdUUID, apiKeyController.deleteApiKey);

module.exports = router; 
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validateIdUUID } = require('../middleware/validation');
const analyticsController = require('../controllers/analyticsController');

// All routes require authentication
router.use(authenticateToken);

// Get user analytics overview
router.get('/user', analyticsController.getUserAnalytics);

// Get real-time analytics
router.get('/realtime', analyticsController.getRealTimeAnalytics);

// Get API key specific analytics
router.get('/api-key/:apiKeyId', validateIdUUID, analyticsController.getApiKeyAnalytics);

module.exports = router; 
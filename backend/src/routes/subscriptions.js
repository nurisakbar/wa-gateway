const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const subscriptionController = require('../controllers/subscriptionController');

// All routes require authentication
router.use(authenticateToken);

// Get subscription plans
router.get('/plans', subscriptionController.getPlans);

// Get current user subscription
router.get('/my-subscription', subscriptionController.getCurrentSubscription);

// Subscribe to a plan
router.post('/subscribe', subscriptionController.subscribeToPlan);

// Upgrade subscription
router.post('/upgrade', subscriptionController.upgradePlan);

// Cancel subscription
router.post('/cancel', subscriptionController.cancelSubscription);

// Get usage data
router.get('/usage', subscriptionController.getUsage);

module.exports = router;
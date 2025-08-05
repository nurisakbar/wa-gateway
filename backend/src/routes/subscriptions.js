const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const { validateIdUUID } = require('../middleware/validation');
const subscriptionController = require('../controllers/subscriptionController');

// Public routes (no authentication required)
router.get('/plans', subscriptionController.getSubscriptionPlans);
router.get('/plans/:id', validateIdUUID, subscriptionController.getSubscriptionPlan);

// Protected routes (authentication required)
router.use(authenticateToken);

// User subscription routes
router.get('/my-subscription', subscriptionController.getUserSubscription);
router.post('/subscribe', subscriptionController.subscribeToPlan);
router.post('/cancel', subscriptionController.cancelSubscription);
router.get('/usage', subscriptionController.getSubscriptionUsage);

// Admin routes (admin role required)
router.post('/plans', authorize(['admin']), subscriptionController.createSubscriptionPlan);
router.put('/plans/:id', authorize(['admin']), validateIdUUID, subscriptionController.updateSubscriptionPlan);
router.delete('/plans/:id', authorize(['admin']), validateIdUUID, subscriptionController.deleteSubscriptionPlan);

module.exports = router; 
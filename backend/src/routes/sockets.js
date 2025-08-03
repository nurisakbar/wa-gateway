const express = require('express');
const router = express.Router();
const socketController = require('../controllers/socketController');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get connection statistics
router.get('/stats', socketController.getConnectionStats);

// Get socket connection info for current user
router.get('/info', socketController.getSocketInfo);

// Check if specific user is connected
router.get('/user/:userId/connected', socketController.checkUserConnection);

// Check if specific device is connected
router.get('/device/:deviceId/connected', socketController.checkDeviceConnection);

// Send system notification
router.post('/notify', socketController.sendSystemNotification);

// Broadcast message to all users
router.post('/broadcast', requireSuperAdmin, socketController.broadcastMessage);

// Send notification to specific users
router.post('/notify/users', socketController.sendNotification);

// Force disconnect user (super admin only)
router.delete('/user/:userId/disconnect', requireSuperAdmin, socketController.forceDisconnectUser);

// Force disconnect device (super admin only)
router.delete('/device/:deviceId/disconnect', requireSuperAdmin, socketController.forceDisconnectDevice);

// Get active connections (super admin only)
router.get('/connections', requireSuperAdmin, socketController.getActiveConnections);

module.exports = router; 
const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const { authenticateToken, requireOperator } = require('../middleware/auth');
const { 
  validateDeviceCreation, 
  validateDeviceUpdate, 
  validateUUID, 
  validatePagination 
} = require('../middleware/validation');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all devices for the authenticated user
router.get('/', validatePagination, deviceController.getUserDevices);

// Get device statistics
router.get('/stats', deviceController.getDeviceStats);

// Get all connected devices (admin only)
router.get('/connected', requireOperator, deviceController.getAllConnectedDevices);

// Create a new device
router.post('/', validateDeviceCreation, deviceController.createDevice);

// Get a specific device
router.get('/:deviceId', validateUUID, deviceController.getDevice);

// Update device
router.put('/:deviceId', validateUUID, validateDeviceUpdate, deviceController.updateDevice);

// Delete device
router.delete('/:deviceId', validateUUID, deviceController.deleteDevice);

// Connect device
router.post('/:deviceId/connect', validateUUID, deviceController.connectDevice);

// Disconnect device
router.post('/:deviceId/disconnect', validateUUID, deviceController.disconnectDevice);

// Reconnect device
router.post('/:deviceId/reconnect', validateUUID, deviceController.reconnectDevice);

// Get device QR code
router.get('/:deviceId/qr', validateUUID, deviceController.getDeviceQR);

// Get device connection status
router.get('/:deviceId/status', validateUUID, deviceController.getDeviceStatus);

module.exports = router; 
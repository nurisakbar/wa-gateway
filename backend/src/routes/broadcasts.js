const express = require('express');
const router = express.Router();
const broadcastController = require('../controllers/broadcastController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Send broadcast immediately
router.post('/send', 
  authorize(['admin', 'manager', 'operator']), 
  broadcastController.sendBroadcast
);

// Schedule broadcast for later
router.post('/schedule', 
  authorize(['admin', 'manager', 'operator']), 
  broadcastController.scheduleBroadcast
);

// Cancel scheduled broadcast
router.delete('/:broadcast_id/cancel', 
  authorize(['admin', 'manager', 'operator']), 
  broadcastController.cancelBroadcast
);

// Get broadcast status
router.get('/:broadcast_id/status', 
  authorize(['admin', 'manager', 'operator', 'viewer']), 
  broadcastController.getBroadcastStatus
);

// Get scheduled broadcasts
router.get('/scheduled', 
  authorize(['admin', 'manager', 'operator', 'viewer']), 
  broadcastController.getScheduledBroadcasts
);

// Get contacts for broadcast (with filters)
router.get('/contacts', 
  authorize(['admin', 'manager', 'operator', 'viewer']), 
  broadcastController.getContactsForBroadcast
);

// Get broadcast statistics
router.get('/stats', 
  authorize(['admin', 'manager', 'operator', 'viewer']), 
  broadcastController.getBroadcastStats
);

// Get broadcast history
router.get('/history', 
  authorize(['admin', 'manager', 'operator', 'viewer']), 
  broadcastController.getBroadcastHistory
);

// Create broadcast
router.post('/create', 
  authorize(['admin', 'manager', 'operator']), 
  broadcastController.createBroadcast
);

module.exports = router; 
const express = require('express');
const router = express.Router();
const broadcastController = require('../controllers/broadcastController');
const { authenticateToken, checkRole } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Send broadcast immediately
router.post('/send', 
  checkRole(['admin', 'manager', 'operator']), 
  broadcastController.sendBroadcast
);

// Schedule broadcast for later
router.post('/schedule', 
  checkRole(['admin', 'manager', 'operator']), 
  broadcastController.scheduleBroadcast
);

// Cancel scheduled broadcast
router.delete('/:broadcast_id/cancel', 
  checkRole(['admin', 'manager', 'operator']), 
  broadcastController.cancelBroadcast
);

// Get broadcast status
router.get('/:broadcast_id/status', 
  checkRole(['admin', 'manager', 'operator', 'viewer']), 
  broadcastController.getBroadcastStatus
);

// Get scheduled broadcasts
router.get('/scheduled', 
  checkRole(['admin', 'manager', 'operator', 'viewer']), 
  broadcastController.getScheduledBroadcasts
);

// Get contacts for broadcast (with filters)
router.get('/contacts', 
  checkRole(['admin', 'manager', 'operator', 'viewer']), 
  broadcastController.getContactsForBroadcast
);

// Get broadcast statistics
router.get('/stats', 
  checkRole(['admin', 'manager', 'operator', 'viewer']), 
  broadcastController.getBroadcastStats
);

module.exports = router; 
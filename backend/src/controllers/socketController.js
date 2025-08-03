const { logError, logInfo } = require('../utils/logger');
const socketService = require('../services/socketService');

class SocketController {
  // Get connection statistics
  async getConnectionStats(req, res) {
    try {
      const stats = socketService.getConnectionStats();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logError(error, 'Error getting connection statistics');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Check if user is connected
  async checkUserConnection(req, res) {
    try {
      const { userId } = req.params;
      const isConnected = socketService.isUserConnected(userId);

      res.json({
        success: true,
        data: {
          userId,
          isConnected,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logError(error, 'Error checking user connection');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Check if device is connected
  async checkDeviceConnection(req, res) {
    try {
      const { deviceId } = req.params;
      const isConnected = socketService.isDeviceConnected(deviceId);

      res.json({
        success: true,
        data: {
          deviceId,
          isConnected,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logError(error, 'Error checking device connection');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Send system notification
  async sendSystemNotification(req, res) {
    try {
      const { type, message, target, data } = req.body;

      if (!type || !message || !target) {
        return res.status(400).json({
          success: false,
          message: 'Type, message, and target are required'
        });
      }

      // Validate target
      const validTargets = ['user', 'role', 'device', 'all'];
      if (!validTargets.includes(target)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid target. Must be one of: user, role, device, all'
        });
      }

      // Validate data based on target
      if (target === 'user' && (!data || !data.userId)) {
        return res.status(400).json({
          success: false,
          message: 'userId is required when target is user'
        });
      }

      if (target === 'role' && (!data || !data.role)) {
        return res.status(400).json({
          success: false,
          message: 'role is required when target is role'
        });
      }

      if (target === 'device' && (!data || !data.deviceId)) {
        return res.status(400).json({
          success: false,
          message: 'deviceId is required when target is device'
        });
      }

      socketService.handleSystemNotification({
        type,
        message,
        target,
        data
      });

      logInfo(`System notification sent by user: ${req.user.id} - ${type}: ${message}`);

      res.json({
        success: true,
        message: 'System notification sent successfully'
      });

    } catch (error) {
      logError(error, 'Error sending system notification');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Broadcast message to all users
  async broadcastMessage(req, res) {
    try {
      const { message, data } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Message is required'
        });
      }

      socketService.broadcastMessage(message, data);

      logInfo(`Broadcast message sent by user: ${req.user.id} - ${message}`);

      res.json({
        success: true,
        message: 'Broadcast message sent successfully'
      });

    } catch (error) {
      logError(error, 'Error broadcasting message');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Send notification to specific users
  async sendNotification(req, res) {
    try {
      const { userIds, notification } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'userIds array is required and must not be empty'
        });
      }

      if (!notification || !notification.message) {
        return res.status(400).json({
          success: false,
          message: 'Notification message is required'
        });
      }

      socketService.sendNotification(userIds, notification);

      logInfo(`Notification sent to ${userIds.length} users by user: ${req.user.id}`);

      res.json({
        success: true,
        message: `Notification sent to ${userIds.length} users successfully`
      });

    } catch (error) {
      logError(error, 'Error sending notification');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get socket connection info
  async getSocketInfo(req, res) {
    try {
      const userId = req.user.id;
      const isConnected = socketService.isUserConnected(userId);
      const totalUsers = socketService.getConnectedUsersCount();
      const totalDevices = socketService.getConnectedDevicesCount();

      res.json({
        success: true,
        data: {
          userId,
          isConnected,
          totalConnectedUsers: totalUsers,
          totalConnectedDevices: totalDevices,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logError(error, 'Error getting socket info');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Force disconnect user
  async forceDisconnectUser(req, res) {
    try {
      const { userId } = req.params;

      // Only super admins can force disconnect users
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only super admins can force disconnect users.'
        });
      }

      const socket = socketService.connectedUsers.get(userId);
      if (socket) {
        socket.disconnect(true);
        logInfo(`User ${userId} force disconnected by super admin: ${req.user.id}`);
      }

      res.json({
        success: true,
        message: 'User disconnected successfully'
      });

    } catch (error) {
      logError(error, 'Error force disconnecting user');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Force disconnect device
  async forceDisconnectDevice(req, res) {
    try {
      const { deviceId } = req.params;

      // Only super admins can force disconnect devices
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only super admins can force disconnect devices.'
        });
      }

      const socket = socketService.deviceConnections.get(deviceId);
      if (socket) {
        socket.disconnect(true);
        logInfo(`Device ${deviceId} force disconnected by super admin: ${req.user.id}`);
      }

      res.json({
        success: true,
        message: 'Device disconnected successfully'
      });

    } catch (error) {
      logError(error, 'Error force disconnecting device');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get active connections
  async getActiveConnections(req, res) {
    try {
      // Only super admins can view all connections
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only super admins can view all connections.'
        });
      }

      const stats = socketService.getConnectionStats();
      const activeConnections = {
        users: stats.connectedUsers.map(userId => ({
          userId,
          connectedAt: new Date().toISOString() // In real implementation, you'd store connection time
        })),
        devices: stats.connectedDevices.map(deviceId => ({
          deviceId,
          connectedAt: new Date().toISOString() // In real implementation, you'd store connection time
        }))
      };

      res.json({
        success: true,
        data: activeConnections
      });

    } catch (error) {
      logError(error, 'Error getting active connections');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new SocketController(); 
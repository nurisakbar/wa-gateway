const { Device, User } = require('../models');
const whatsappService = require('../services/whatsappService');
const { logError, logInfo, logWarn } = require('../utils/logger');
const { generateUUID } = require('../utils/helpers');

class DeviceController {
  // Get all devices for a user
  async getUserDevices(req, res) {
    try {
      const { page = 1, limit = 10, status, search } = req.query;
      const userId = req.user.id;

      // Build where clause
      const whereClause = { user_id: userId };
      if (status) {
        whereClause.status = status;
      }
      if (search) {
        whereClause.name = { [require('sequelize').Op.like]: `%${search}%` };
      }

      // Get devices with pagination
      const offset = (page - 1) * limit;
      const devices = await Device.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'full_name', 'email']
          }
        ]
      });

      // Get connection status for each device
      const devicesWithStatus = await Promise.all(
        devices.rows.map(async (device) => {
          const connectionStatus = await whatsappService.getConnectionStatus(device.id);
          return {
            ...device.toJSON(),
            connection_status: connectionStatus
          };
        })
      );

      const totalPages = Math.ceil(devices.count / limit);

      res.json({
        success: true,
        data: devicesWithStatus,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: devices.count,
          items_per_page: parseInt(limit)
        }
      });

    } catch (error) {
      logError(error, 'Error getting user devices');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get a specific device
  async getDevice(req, res) {
    try {
      const { deviceId } = req.params;
      const userId = req.user.id;

      const device = await Device.findOne({
        where: { id: deviceId, user_id: userId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'full_name', 'email']
          }
        ]
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

      // Get connection status
      const connectionStatus = await whatsappService.getConnectionStatus(deviceId);

      res.json({
        success: true,
        data: {
          ...device.toJSON(),
          connection_status: connectionStatus
        }
      });

    } catch (error) {
      logError(error, 'Error getting device');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Create a new device
  async createDevice(req, res) {
    try {
      const userId = req.user.id;
      const { name, description, phone_number, settings } = req.body;

      // Check if user has permission to create devices
      if (!req.user.hasRole(['super_admin', 'admin', 'manager', 'operator'])) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to create devices'
        });
      }

      // Create device
      const device = await Device.create({
        user_id: userId,
        name,
        description,
        phone_number,
        settings: settings || {},
        status: 'disconnected'
      });

      logInfo(`Device created: ${device.id} by user: ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Device created successfully',
        data: device
      });

    } catch (error) {
      logError(error, 'Error creating device');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update device
  async updateDevice(req, res) {
    try {
      const { deviceId } = req.params;
      const userId = req.user.id;
      const { name, description, phone_number, settings } = req.body;

      // Find device
      const device = await Device.findOne({
        where: { id: deviceId, user_id: userId }
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

      // Check if device is connected
      const connectionStatus = await whatsappService.getConnectionStatus(deviceId);
      if (connectionStatus.connected) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update device while it is connected. Please disconnect first.'
        });
      }

      // Update device
      await device.update({
        name: name || device.name,
        description: description !== undefined ? description : device.description,
        phone_number: phone_number || device.phone_number,
        settings: settings ? { ...device.settings, ...settings } : device.settings
      });

      logInfo(`Device updated: ${deviceId} by user: ${userId}`);

      res.json({
        success: true,
        message: 'Device updated successfully',
        data: device
      });

    } catch (error) {
      logError(error, 'Error updating device');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Delete device
  async deleteDevice(req, res) {
    try {
      const { deviceId } = req.params;
      const userId = req.user.id;

      // Find device
      const device = await Device.findOne({
        where: { id: deviceId, user_id: userId }
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

      // Check if device is connected
      const connectionStatus = await whatsappService.getConnectionStatus(deviceId);
      if (connectionStatus.connected) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete device while it is connected. Please disconnect first.'
        });
      }

      // Delete device
      await device.destroy();

      logInfo(`Device deleted: ${deviceId} by user: ${userId}`);

      res.json({
        success: true,
        message: 'Device deleted successfully'
      });

    } catch (error) {
      logError(error, 'Error deleting device');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Connect device
  async connectDevice(req, res) {
    try {
      const { deviceId } = req.params;
      const userId = req.user.id;

      logInfo(`Connect device request: ${deviceId} by user: ${userId}`);

      // Find device
      const device = await Device.findOne({
        where: { id: deviceId, user_id: userId }
      });

      if (!device) {
        logWarn(`Device not found: ${deviceId}`);
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

      logInfo(`Device found: ${deviceId}, current status: ${device.status}`);

      // Check if device is already connected
      const connectionStatus = await whatsappService.getConnectionStatus(deviceId);
      logInfo(`Connection status for device ${deviceId}:`, connectionStatus);
      
      if (connectionStatus.connected) {
        logInfo(`Device ${deviceId} is already connected`);
        return res.status(400).json({
          success: false,
          message: 'Device is already connected'
        });
      }

      // Initialize WhatsApp connection
      logInfo(`Initializing WhatsApp connection for device: ${deviceId}`);
      const result = await whatsappService.initializeConnection(deviceId, userId);

      logInfo(`Device connection initiated successfully: ${deviceId} by user: ${userId}, session: ${result.sessionId}`);

      res.json({
        success: true,
        message: 'Device connection initiated successfully',
        data: {
          device_id: deviceId,
          session_id: result.sessionId,
          status: 'connecting'
        }
      });

    } catch (error) {
      logError(error, 'Error connecting device');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Disconnect device
  async disconnectDevice(req, res) {
    try {
      const { deviceId } = req.params;
      const userId = req.user.id;

      // Find device
      const device = await Device.findOne({
        where: { id: deviceId, user_id: userId }
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

      // Disconnect device
      const result = await whatsappService.disconnectDevice(deviceId);

      logInfo(`Device disconnected: ${deviceId} by user: ${userId}`);

      res.json({
        success: true,
        message: 'Device disconnected successfully',
        data: result
      });

    } catch (error) {
      logError(error, 'Error disconnecting device');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get device QR code
  async getDeviceQR(req, res) {
    try {
      const { deviceId } = req.params;
      const userId = req.user.id;

      logInfo(`Getting QR code for device: ${deviceId}, user: ${userId}`);

      // Find device
      const device = await Device.findOne({
        where: { id: deviceId, user_id: userId }
      });

      if (!device) {
        logWarn(`Device not found: ${deviceId}`);
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

      // Get connection status
      const connectionStatus = await whatsappService.getConnectionStatus(deviceId);
      logInfo(`Connection status for device ${deviceId}:`, connectionStatus);

      // Check if device is already connected
      if (connectionStatus.connected) {
        logInfo(`Device ${deviceId} is already connected`);
        return res.status(400).json({
          success: false,
          message: 'Device is already connected. No QR code needed.',
          data: {
            status: 'connected',
            connected: true
          }
        });
      }

      // Check if QR code is available in memory
      if (connectionStatus.qrCode) {
        logInfo(`QR code available in memory for device: ${deviceId}`);
        return res.json({
          success: true,
          data: {
            qr_code: connectionStatus.qrCode,
            status: connectionStatus.status || 'connecting'
          }
        });
      }

      // Check if QR code is stored in database
      if (device.qr_code) {
        logInfo(`QR code available in database for device: ${deviceId}`);
        return res.json({
          success: true,
          data: {
            qr_code: device.qr_code,
            status: device.status || 'connecting'
          }
        });
      }

      // If no QR code available, check if device is in connecting state
      if (device.status === 'connecting' || connectionStatus.status === 'connecting') {
        logInfo(`Device ${deviceId} is connecting but QR code not ready yet`);
        return res.status(202).json({
          success: false,
          message: 'QR code is being generated. Please wait a moment and try again.',
          data: {
            status: 'connecting',
            retry_after: 3 // seconds
          }
        });
      }

      // Device is not connecting and no QR code available
      logWarn(`No QR code available for device: ${deviceId}, status: ${device.status}`);
      return res.status(400).json({
        success: false,
        message: 'QR code not available. Please try connecting the device first.',
        data: {
          status: device.status || 'disconnected',
          needs_connection_init: true
        }
      });

    } catch (error) {
      logError(error, 'Error getting device QR code');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get device connection status
  async getDeviceStatus(req, res) {
    try {
      const { deviceId } = req.params;
      const userId = req.user.id;

      // Find device
      const device = await Device.findOne({
        where: { id: deviceId, user_id: userId }
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

      // Get connection status
      const connectionStatus = await whatsappService.getConnectionStatus(deviceId);

      res.json({
        success: true,
        data: {
          device: device.toJSON(),
          connection_status: connectionStatus
        }
      });

    } catch (error) {
      logError(error, 'Error getting device status');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get device statistics
  async getDeviceStats(req, res) {
    try {
      const userId = req.user.id;

      // Get device statistics
      const stats = await Device.getDeviceStats();

      // Get user's devices
      const userDevices = await Device.findAll({
        where: { user_id: userId },
        attributes: ['status']
      });

      const userStats = {
        total: userDevices.length,
        connected: userDevices.filter(d => d.status === 'connected').length,
        disconnected: userDevices.filter(d => d.status === 'disconnected').length,
        connecting: userDevices.filter(d => d.status === 'connecting').length,
        error: userDevices.filter(d => d.status === 'error').length
      };

      res.json({
        success: true,
        data: {
          global: stats,
          user: userStats
        }
      });

    } catch (error) {
      logError(error, 'Error getting device statistics');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Reconnect device
  async reconnectDevice(req, res) {
    try {
      const { deviceId } = req.params;
      const userId = req.user.id;

      // Find device
      const device = await Device.findOne({
        where: { id: deviceId, user_id: userId }
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

      // Reconnect device
      const result = await whatsappService.reconnectDevice(deviceId);

      logInfo(`Device reconnected: ${deviceId} by user: ${userId}`);

      res.json({
        success: true,
        message: 'Device reconnected successfully',
        data: result
      });

    } catch (error) {
      logError(error, 'Error reconnecting device');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get all connected devices (for admin)
  async getAllConnectedDevices(req, res) {
    try {
      // Check if user has admin permissions
      if (!req.user.hasRole(['super_admin', 'admin'])) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      const connectedDevices = whatsappService.getConnectedDevices();

      res.json({
        success: true,
        data: connectedDevices
      });

    } catch (error) {
      logError(error, 'Error getting all connected devices');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new DeviceController(); 
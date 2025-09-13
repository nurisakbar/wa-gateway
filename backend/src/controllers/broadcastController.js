const broadcastService = require('../services/broadcastService');
const { Contact, Device, Broadcast } = require('../models');
const { logInfo, logError } = require('../utils/logger');
const { validateBroadcastRequest } = require('../middleware/validation');

class BroadcastController {
  // Send broadcast to contacts
  async sendBroadcast(req, res) {
    try {
      const { device_id, contacts, message_data, options } = req.body;
      const userId = req.user.id;

      // Validate request
      const validation = validateBroadcastRequest(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request data',
          errors: validation.errors
        });
      }

      // Check device ownership
      const device = await Device.findOne({
        where: { id: device_id, user_id: userId }
      });

      if (!device || !device.is_active) {
        return res.status(400).json({
          success: false,
          message: 'Device not found or inactive'
        });
      }

      // Get contacts if not provided directly
      let contactList = contacts;
      if (!contactList && req.body.contact_filters) {
        contactList = await broadcastService.getContactsForBroadcast(req.body.contact_filters);
      }

      if (!contactList || contactList.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No contacts found for broadcast'
        });
      }

      // Send broadcast
      const result = await broadcastService.sendBroadcast(
        device_id,
        contactList,
        message_data,
        options
      );

      logInfo(`Broadcast sent by user: ${userId}`, {
        device_id,
        total_contacts: result.total_contacts,
        broadcast_id: result.broadcast_id
      });

      res.json({
        success: true,
        message: 'Broadcast sent successfully',
        data: result
      });

    } catch (error) {
      logError(error, 'Error sending broadcast');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Schedule broadcast
  async scheduleBroadcast(req, res) {
    try {
      const { device_id, contacts, message_data, scheduled_at, options } = req.body;
      const userId = req.user.id;

      // Validate scheduled time
      if (!scheduled_at || new Date(scheduled_at) <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Scheduled time must be in the future'
        });
      }

      // Check device ownership
      const device = await Device.findOne({
        where: { id: device_id, user_id: userId }
      });

      if (!device || !device.is_active) {
        return res.status(400).json({
          success: false,
          message: 'Device not found or inactive'
        });
      }

      // Get contacts if not provided directly
      let contactList = contacts;
      if (!contactList && req.body.contact_filters) {
        contactList = await broadcastService.getContactsForBroadcast(req.body.contact_filters);
      }

      if (!contactList || contactList.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No contacts found for broadcast'
        });
      }

      // Schedule broadcast
      const result = await broadcastService.sendBroadcast(
        device_id,
        contactList,
        message_data,
        { ...options, scheduled_at }
      );

      logInfo(`Broadcast scheduled by user: ${userId}`, {
        device_id,
        scheduled_at,
        total_contacts: result.total_contacts,
        broadcast_id: result.broadcast_id
      });

      res.json({
        success: true,
        message: 'Broadcast scheduled successfully',
        data: result
      });

    } catch (error) {
      logError(error, 'Error scheduling broadcast');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Cancel scheduled broadcast
  async cancelBroadcast(req, res) {
    try {
      const { broadcast_id } = req.params;
      const userId = req.user.id;

      // Cancel broadcast
      const result = await broadcastService.cancelScheduledBroadcast(broadcast_id);

      logInfo(`Broadcast cancelled by user: ${userId}`, { broadcast_id });

      res.json({
        success: true,
        message: 'Broadcast cancelled successfully',
        data: result
      });

    } catch (error) {
      logError(error, 'Error cancelling broadcast');
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to cancel broadcast'
      });
    }
  }

  // Get broadcast status
  async getBroadcastStatus(req, res) {
    try {
      const { broadcast_id } = req.params;
      const userId = req.user.id;

      // Get broadcast status
      const status = await broadcastService.getBroadcastStatus(broadcast_id);

      res.json({
        success: true,
        data: status
      });

    } catch (error) {
      logError(error, 'Error getting broadcast status');
      res.status(404).json({
        success: false,
        message: 'Broadcast not found'
      });
    }
  }

  // Get scheduled broadcasts
  async getScheduledBroadcasts(req, res) {
    try {
      const userId = req.user.id;
      const { device_id } = req.query;

      // Get user's devices
      const userDevices = await Device.findAll({
        where: { user_id: userId },
        attributes: ['id']
      });

      const deviceIds = userDevices.map(device => device.id);

      // Get scheduled broadcasts
      const scheduledBroadcasts = broadcastService.getScheduledBroadcasts();

      // Filter by device if specified
      let filteredBroadcasts = scheduledBroadcasts;
      if (device_id) {
        filteredBroadcasts = scheduledBroadcasts.filter(
          broadcast => broadcast.device_id === device_id
        );
      }

      // Only show broadcasts for user's devices
      filteredBroadcasts = filteredBroadcasts.filter(
        broadcast => deviceIds.includes(broadcast.device_id)
      );

      res.json({
        success: true,
        data: {
          total: filteredBroadcasts.length,
          broadcasts: filteredBroadcasts
        }
      });

    } catch (error) {
      logError(error, 'Error getting scheduled broadcasts');
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get contacts for broadcast
  async getContactsForBroadcast(req, res) {
    try {
      const userId = req.user.id;
      const filters = req.query;

      // Get contacts based on filters
      const contacts = await broadcastService.getContactsForBroadcast(filters);

      res.json({
        success: true,
        data: {
          total: contacts.length,
          contacts: contacts
        }
      });

    } catch (error) {
      logError(error, 'Error getting contacts for broadcast');
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get broadcast statistics
  async getBroadcastStats(req, res) {
    try {
      const userId = req.user.id;
      const { device_id, date_from, date_to } = req.query;

      // Get user's devices
      const userDevices = await Device.findAll({
        where: { user_id: userId },
        attributes: ['id']
      });

      const deviceIds = userDevices.map(device => device.id);

      // Filter by device if specified
      const targetDevices = device_id ? [device_id] : deviceIds;

      // Get scheduled broadcasts
      const scheduledBroadcasts = broadcastService.getScheduledBroadcasts();
      
      const userScheduledBroadcasts = scheduledBroadcasts.filter(
        broadcast => targetDevices.includes(broadcast.device_id)
      );

      // Calculate statistics
      const stats = {
        total_scheduled: userScheduledBroadcasts.length,
        total_contacts: userScheduledBroadcasts.reduce((sum, broadcast) => sum + broadcast.total_contacts, 0),
        devices_used: [...new Set(userScheduledBroadcasts.map(b => b.device_id))].length
      };

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logError(error, 'Error getting broadcast statistics');
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get broadcast history
  async getBroadcastHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, status, device_id } = req.query;
      
      const offset = (page - 1) * limit;
      
      const result = await Broadcast.findByUserId(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        status,
        device_id
      });

      res.json({
        success: true,
        data: {
          broadcasts: result.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: result.count,
            pages: Math.ceil(result.count / limit)
          }
        }
      });

    } catch (error) {
      logError(error, 'Error getting broadcast history');
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Create broadcast
  async createBroadcast(req, res) {
    try {
      const userId = req.user.id;
      const { title, device_id, message, message_type = 'text', scheduled_at } = req.body;

      console.log('=== BROADCAST CREATE REQUEST ===');
      console.log('User ID:', userId);
      console.log('Request body:', req.body);
      console.log('Device ID:', device_id);

      // Validate required fields
      if (!title || !device_id || !message) {
        console.log('Validation failed - missing required fields');
        return res.status(400).json({
          success: false,
          message: 'Title, device_id, and message are required'
        });
      }

      // Check device ownership
      const device = await Device.findOne({
        where: { id: device_id, user_id: userId }
      });

      console.log('Device lookup for broadcast:', {
        device_id,
        userId,
        device: device ? {
          id: device.id,
          name: device.name,
          is_active: device.is_active,
          status: device.status
        } : null
      });

      if (!device || device.status !== 'connected') {
        return res.status(400).json({
          success: false,
          message: 'Device not found or not connected'
        });
      }

      // Create broadcast
      const broadcast = await Broadcast.create({
        user_id: userId,
        device_id,
        name: title,
        message,
        message_type,
        scheduled_at: scheduled_at ? new Date(scheduled_at) : null,
        status: scheduled_at ? 'draft' : 'draft'
      });

      res.json({
        success: true,
        message: 'Broadcast created successfully',
        data: broadcast
      });

    } catch (error) {
      logError(error, 'Error creating broadcast');
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new BroadcastController(); 
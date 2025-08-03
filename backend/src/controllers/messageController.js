const { Message, Device, Contact } = require('../models');
const messageService = require('../services/messageService');
const { logError, logInfo } = require('../utils/logger');

class MessageController {
  // Send text message
  async sendTextMessage(req, res) {
    try {
      const { deviceId } = req.params;
      const userId = req.user.id;
      const { to_number, message, options = {} } = req.body;

      // Validate device ownership
      const device = await Device.findOne({
        where: { id: deviceId, user_id: userId }
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found or access denied'
        });
      }

      // Send message
      const result = await messageService.sendTextMessage(deviceId, to_number, message, options);

      logInfo(`Text message sent: ${result.message_id} by user: ${userId}`);

      res.json({
        success: true,
        message: 'Message sent successfully',
        data: result
      });

    } catch (error) {
      logError(error, 'Error sending text message');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Send media message
  async sendMediaMessage(req, res) {
    try {
      const { deviceId } = req.params;
      const userId = req.user.id;
      const { to_number, media_path, caption = '', options = {} } = req.body;

      // Validate device ownership
      const device = await Device.findOne({
        where: { id: deviceId, user_id: userId }
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found or access denied'
        });
      }

      // Send media message
      const result = await messageService.sendMediaMessage(deviceId, to_number, media_path, caption, options);

      logInfo(`Media message sent: ${result.message_id} by user: ${userId}`);

      res.json({
        success: true,
        message: 'Media message sent successfully',
        data: result
      });

    } catch (error) {
      logError(error, 'Error sending media message');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Send location message
  async sendLocationMessage(req, res) {
    try {
      const { deviceId } = req.params;
      const userId = req.user.id;
      const { to_number, latitude, longitude, name = '', address = '', options = {} } = req.body;

      // Validate device ownership
      const device = await Device.findOne({
        where: { id: deviceId, user_id: userId }
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found or access denied'
        });
      }

      // Send location message
      const result = await messageService.sendLocationMessage(deviceId, to_number, latitude, longitude, name, address, options);

      logInfo(`Location message sent: ${result.message_id} by user: ${userId}`);

      res.json({
        success: true,
        message: 'Location message sent successfully',
        data: result
      });

    } catch (error) {
      logError(error, 'Error sending location message');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Send contact message
  async sendContactMessage(req, res) {
    try {
      const { deviceId } = req.params;
      const userId = req.user.id;
      const { to_number, contact_data, options = {} } = req.body;

      // Validate device ownership
      const device = await Device.findOne({
        where: { id: deviceId, user_id: userId }
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found or access denied'
        });
      }

      // Send contact message
      const result = await messageService.sendContactMessage(deviceId, to_number, contact_data, options);

      logInfo(`Contact message sent: ${result.message_id} by user: ${userId}`);

      res.json({
        success: true,
        message: 'Contact message sent successfully',
        data: result
      });

    } catch (error) {
      logError(error, 'Error sending contact message');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get device messages
  async getDeviceMessages(req, res) {
    try {
      const { deviceId } = req.params;
      const userId = req.user.id;
      const { page = 1, limit = 20, type, status, search, from_date, to_date } = req.query;

      // Validate device ownership
      const device = await Device.findOne({
        where: { id: deviceId, user_id: userId }
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found or access denied'
        });
      }

      // Get messages
      const result = await messageService.getDeviceMessages(deviceId, userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        type,
        status,
        search,
        fromDate: from_date,
        toDate: to_date
      });

      res.json({
        success: true,
        data: result.messages,
        pagination: result.pagination
      });

    } catch (error) {
      logError(error, 'Error getting device messages');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get message by ID
  async getMessage(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;

      const message = await messageService.getMessage(messageId, userId);

      res.json({
        success: true,
        data: message
      });

    } catch (error) {
      logError(error, 'Error getting message');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Delete message
  async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;

      const result = await messageService.deleteMessage(messageId, userId);

      logInfo(`Message deleted: ${messageId} by user: ${userId}`);

      res.json({
        success: true,
        message: 'Message deleted successfully',
        data: result
      });

    } catch (error) {
      logError(error, 'Error deleting message');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get message statistics
  async getMessageStats(req, res) {
    try {
      const { deviceId } = req.params;
      const userId = req.user.id;
      const { period = '30d' } = req.query;

      // Validate device ownership
      const device = await Device.findOne({
        where: { id: deviceId, user_id: userId }
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found or access denied'
        });
      }

      // Get message statistics
      const stats = await messageService.getMessageStats(deviceId, userId, period);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logError(error, 'Error getting message statistics');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get all user messages
  async getUserMessages(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, type, status, search, from_date, to_date } = req.query;

      // Build where clause
      const whereClause = { user_id: userId };
      if (type) whereClause.message_type = type;
      if (status) whereClause.status = status;
      if (from_date) whereClause.created_at = { [require('sequelize').Op.gte]: new Date(from_date) };
      if (to_date) {
        if (whereClause.created_at) {
          whereClause.created_at[require('sequelize').Op.lte] = new Date(to_date);
        } else {
          whereClause.created_at = { [require('sequelize').Op.lte]: new Date(to_date) };
        }
      }

      // Get messages with pagination
      const offset = (page - 1) * limit;
      const messages = await Message.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']],
        include: [
          {
            model: Device,
            as: 'device',
            attributes: ['id', 'name', 'phone_number']
          }
        ]
      });

      const totalPages = Math.ceil(messages.count / limit);

      res.json({
        success: true,
        data: messages.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: messages.count,
          items_per_page: parseInt(limit)
        }
      });

    } catch (error) {
      logError(error, 'Error getting user messages');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get conversation with a specific number
  async getConversation(req, res) {
    try {
      const { deviceId } = req.params;
      const userId = req.user.id;
      const { phone_number, page = 1, limit = 50 } = req.query;

      // Validate device ownership
      const device = await Device.findOne({
        where: { id: deviceId, user_id: userId }
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found or access denied'
        });
      }

      // Get conversation messages
      const offset = (page - 1) * limit;
      const messages = await Message.findAndCountAll({
        where: {
          device_id: deviceId,
          [require('sequelize').Op.or]: [
            { from_number: phone_number },
            { to_number: phone_number }
          ]
        },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'ASC']]
      });

      const totalPages = Math.ceil(messages.count / limit);

      res.json({
        success: true,
        data: messages.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: messages.count,
          items_per_page: parseInt(limit)
        }
      });

    } catch (error) {
      logError(error, 'Error getting conversation');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Mark message as read
  async markMessageAsRead(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;

      const message = await messageService.getMessage(messageId, userId);
      await message.markAsRead();

      logInfo(`Message marked as read: ${messageId} by user: ${userId}`);

      res.json({
        success: true,
        message: 'Message marked as read successfully'
      });

    } catch (error) {
      logError(error, 'Error marking message as read');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get unread message count
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const { deviceId } = req.query;

      // Build where clause
      const whereClause = { 
        user_id: userId, 
        direction: 'incoming',
        status: 'received'
      };
      
      if (deviceId) {
        whereClause.device_id = deviceId;
      }

      const count = await Message.count({ where: whereClause });

      res.json({
        success: true,
        data: { unread_count: count }
      });

    } catch (error) {
      logError(error, 'Error getting unread count');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new MessageController(); 
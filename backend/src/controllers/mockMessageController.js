// Mock message controller for testing without WhatsApp connection
const { Message, Device, User } = require('../models');
const { logError, logInfo } = require('../utils/logger');
const { generateUUID } = require('../utils/helpers');

class MockMessageController {
  // Send text message (mock)
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

      // Determine message type and prepare metadata
      const messageType = options.message_type || 'text'
      const metadata = { ...options }
      
      // Add media URL to metadata if provided
      if (options.media_url) {
        metadata.media_url = options.media_url
        metadata.media_path = options.media_url
      }

      // Create message directly in database (mock)
      const messageData = {
        id: generateUUID(),
        device_id: deviceId,
        user_id: userId,
        to_number: to_number,
        from_number: device.phone_number,
        content: message,
        message_type: messageType,
        direction: 'outgoing',
        status: 'sent',
        sent_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        metadata: metadata
      };

      const createdMessage = await Message.create(messageData);

      logInfo(`Mock text message created: ${createdMessage.id} by user: ${userId}`);

      res.json({
        success: true,
        message: 'Message sent successfully (mock)',
        data: {
          message_id: createdMessage.id,
          status: 'sent',
          timestamp: createdMessage.sent_at
        }
      });

    } catch (error) {
      logError(error, 'Error sending mock text message');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Send media message (mock)
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

      // Create message directly in database (mock)
      const messageData = {
        device_id: deviceId,
        user_id: userId,
        to_number: to_number,
        from_number: device.phone_number,
        content: caption || 'Media message',
        message_type: 'image', // Default to image for media
        direction: 'outgoing',
        status: 'sent',
        sent_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        metadata: {
          media_path: media_path,
          ...options
        }
      };

      const createdMessage = await Message.create(messageData);

      logInfo(`Mock media message created: ${createdMessage.id} by user: ${userId}`);

      res.json({
        success: true,
        message: 'Media message sent successfully (mock)',
        data: {
          message_id: createdMessage.id,
          status: 'sent',
          timestamp: createdMessage.sent_at
        }
      });

    } catch (error) {
      logError(error, 'Error sending mock media message');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new MockMessageController();

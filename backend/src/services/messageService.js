const path = require('path');
const { Message, Contact, Device, User } = require('../models');
const whatsappService = require('./whatsappService');
const socketService = require('./socketService');
const { logError, logInfo, logWarn } = require('../utils/logger');
const { generateUUID, formatPhoneNumber } = require('../utils/helpers');

class MessageService {
  constructor() {
    this.messageTypes = {
      TEXT: 'text',
      IMAGE: 'image',
      VIDEO: 'video',
      AUDIO: 'audio',
      DOCUMENT: 'document',
      LOCATION: 'location',
      CONTACT: 'contact',
      STICKER: 'sticker'
    };
  }

  // Send text message
  async sendTextMessage(deviceId, toNumber, text, options = {}) {
    try {
      logInfo(`Sending text message from device: ${deviceId} to: ${toNumber}`);

      // Validate device and permissions
      const device = await this.validateDevice(deviceId);
      
      // Format phone number
      const formattedNumber = formatPhoneNumber(toNumber);

      // Check if this is a media message with URL
      if (options.media_url && (options.message_type === 'document' || options.message_type === 'image' || options.message_type === 'video' || options.message_type === 'audio')) {
        logInfo(`Media URL detected in text message, redirecting to media message: ${options.media_url}`);
        return await this.sendMediaMessage(deviceId, toNumber, options.media_url, text, options);
      }

      // Send message via WhatsApp service
      const result = await whatsappService.sendMessage(deviceId, formattedNumber, { text }, options);

      // Store message in database
      const message = await this.storeOutgoingMessage({
        device_id: deviceId,
        user_id: device.user_id,
        to_number: formattedNumber,
        message_type: this.messageTypes.TEXT,
        content: text,
        message_id: result.messageId,
        status: 'sent',
        metadata: {
          timestamp: result.timestamp,
          ...options
        }
      });

      logInfo(`Text message sent successfully: ${message.id}`);
      
      // Notify via socket
      await socketService.handleMessageSent({
        userId: device.user_id,
        deviceId,
        message
      });
      
      return {
        success: true,
        message_id: result.messageId,
        database_id: message.id,
        timestamp: result.timestamp
      };

    } catch (error) {
      logError(error, `Error sending text message from device: ${deviceId}`);
      throw error;
    }
  }

  // Send media message
  async sendMediaMessage(deviceId, toNumber, mediaPath, caption = '', options = {}) {
    try {
      logInfo(`Sending media message from device: ${deviceId} to: ${toNumber}`);
      logInfo(`Media path: ${mediaPath}`);

      // Validate device and permissions
      const device = await this.validateDevice(deviceId);
      
      // Format phone number
      const formattedNumber = formatPhoneNumber(toNumber);

      let result;
      let messageType = this.messageTypes.IMAGE; // Default to image

      // Handle external URLs
      if (typeof mediaPath === 'string' && (mediaPath.startsWith('http://') || mediaPath.startsWith('https://'))) {
        logInfo(`External URL detected: ${mediaPath}`);
        
        // Download the media from URL
        const axios = require('axios');
        const response = await axios.get(mediaPath, {
          responseType: 'arraybuffer',
          headers: {
            // Allow public content fetches that may require UA
            'User-Agent': 'WA-Gateway/1.0 (+https://github.com)',
            'Accept': '*/*'
          },
          maxRedirects: 5
        });
        const mediaBuffer = Buffer.from(response.data);
        
        // Determine media type from content type or URL
        const contentType = response.headers['content-type'] || 'image/jpeg';
        messageType = this.getMediaTypeFromMimeType(contentType);
        
        // Extract filename from URL
        const urlPath = new URL(mediaPath).pathname;
        const fileName = urlPath.split('/').pop() || 'document';
        
        // Send media message via WhatsApp service
        result = await whatsappService.sendMediaMessage(deviceId, formattedNumber, mediaBuffer, caption, {
          ...options,
          mimeType: contentType,
          fileName: fileName
        });
      } else {
        // Handle local file path
        logInfo(`Local file detected: ${mediaPath}`);
        
        // Determine media type from file extension
        messageType = this.getMediaTypeFromPath(mediaPath);
        
        // Send media message via WhatsApp service
        result = await whatsappService.sendMediaMessage(deviceId, formattedNumber, mediaPath, caption, options);
      }

      // Store message in database
      const message = await this.storeOutgoingMessage({
        device_id: deviceId,
        user_id: device.user_id,
        to_number: formattedNumber,
        message_type: messageType,
        content: caption || `Media message (${messageType})`,
        message_id: result.messageId,
        status: 'sent',
        metadata: {
          media_path: mediaPath,
          caption: caption,
          timestamp: result.timestamp,
          ...options
        }
      });

      logInfo(`Media message sent successfully: ${message.id}`);
      
      // Notify via socket
      await socketService.handleMessageSent({
        userId: device.user_id,
        deviceId,
        message
      });
      
      return {
        success: true,
        message_id: result.messageId,
        database_id: message.id,
        timestamp: result.timestamp
      };

    } catch (error) {
      logError(error, `Error sending media message from device: ${deviceId}`);
      throw error;
    }
  }

  // Send location message
  async sendLocationMessage(deviceId, toNumber, latitude, longitude, name = '', address = '', options = {}) {
    try {
      logInfo(`Sending location message from device: ${deviceId} to: ${toNumber}`);

      // Validate device and permissions
      const device = await this.validateDevice(deviceId);
      
      // Format phone number
      const formattedNumber = formatPhoneNumber(toNumber);

      // Prepare location data
      const locationData = {
        location: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          name: name || 'Location',
          address: address || ''
        }
      };

      // Send location message via WhatsApp service
      const result = await whatsappService.sendMessage(deviceId, formattedNumber, locationData, options);

      // Store message in database
      const message = await this.storeOutgoingMessage({
        device_id: deviceId,
        user_id: device.user_id,
        to_number: formattedNumber,
        message_type: this.messageTypes.LOCATION,
        content: `Location: ${latitude}, ${longitude}`,
        message_id: result.messageId,
        status: 'sent',
        metadata: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          name,
          address,
          timestamp: result.timestamp,
          ...options
        }
      });

      logInfo(`Location message sent successfully: ${message.id}`);
      return {
        success: true,
        message_id: result.messageId,
        database_id: message.id,
        timestamp: result.timestamp
      };

    } catch (error) {
      logError(error, `Error sending location message from device: ${deviceId}`);
      throw error;
    }
  }

  // Send contact message
  async sendContactMessage(deviceId, toNumber, contactData, options = {}) {
    try {
      logInfo(`Sending contact message from device: ${deviceId} to: ${toNumber}`);

      // Validate device and permissions
      const device = await this.validateDevice(deviceId);
      
      // Format phone number
      const formattedNumber = formatPhoneNumber(toNumber);

      // Prepare contact data
      const contactMessage = {
        contacts: [{
          name: contactData.name,
          number: contactData.phone,
          ...(contactData.email && { email: contactData.email }),
          ...(contactData.organization && { organization: contactData.organization })
        }]
      };

      // Send contact message via WhatsApp service
      const result = await whatsappService.sendMessage(deviceId, formattedNumber, contactMessage, options);

      // Store message in database
      const message = await this.storeOutgoingMessage({
        device_id: deviceId,
        user_id: device.user_id,
        to_number: formattedNumber,
        message_type: this.messageTypes.CONTACT,
        content: `Contact: ${contactData.name} (${contactData.phone})`,
        message_id: result.messageId,
        status: 'sent',
        metadata: {
          contact: contactData,
          timestamp: result.timestamp,
          ...options
        }
      });

      logInfo(`Contact message sent successfully: ${message.id}`);
      return {
        success: true,
        message_id: result.messageId,
        database_id: message.id,
        timestamp: result.timestamp
      };

    } catch (error) {
      logError(error, `Error sending contact message from device: ${deviceId}`);
      throw error;
    }
  }

  // Handle incoming message
  async handleIncomingMessage(deviceId, whatsappMessage) {
    try {
      logInfo(`Processing incoming message on device: ${deviceId}`);

      // Get device info
      const device = await Device.findByPk(deviceId);
      if (!device) {
        logError(new Error(`Device not found: ${deviceId}`));
        return;
      }

      // Extract message data
      const messageData = this.extractMessageData(whatsappMessage);
      
      // Store incoming message
      const message = await this.storeIncomingMessage({
        device_id: deviceId,
        user_id: device.user_id,
        from_number: messageData.fromNumber,
        message_type: messageData.type,
        content: messageData.content,
        message_id: messageData.messageId,
        status: 'received',
        metadata: messageData.metadata
      });

      // Update or create contact
      await this.updateContact(messageData.fromNumber, messageData.contactInfo);

      // Trigger webhooks if configured
      await this.triggerWebhooks(deviceId, message);

      logInfo(`Incoming message processed: ${message.id}`);
      return message;

    } catch (error) {
      logError(error, `Error handling incoming message on device: ${deviceId}`);
      throw error;
    }
  }

  // Get messages for a device
  async getDeviceMessages(deviceId, userId, options = {}) {
    try {
      const { page = 1, limit = 20, type, status, search, fromDate, toDate } = options;

      // Validate device ownership
      const device = await Device.findOne({
        where: { id: deviceId, user_id: userId }
      });

      if (!device) {
        throw new Error('Device not found or access denied');
      }

      // Build where clause
      const whereClause = { device_id: deviceId };
      if (type) whereClause.message_type = type;
      if (status) whereClause.status = status;
      if (fromDate) whereClause.created_at = { [require('sequelize').Op.gte]: new Date(fromDate) };
      if (toDate) {
        if (whereClause.created_at) {
          whereClause.created_at[require('sequelize').Op.lte] = new Date(toDate);
        } else {
          whereClause.created_at = { [require('sequelize').Op.lte]: new Date(toDate) };
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

      return {
        messages: messages.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: messages.count,
          items_per_page: parseInt(limit)
        }
      };

    } catch (error) {
      logError(error, `Error getting device messages: ${deviceId}`);
      throw error;
    }
  }

  // Get message by ID
  async getMessage(messageId, userId) {
    try {
      const message = await Message.findOne({
        where: { id: messageId },
        include: [
          {
            model: Device,
            as: 'device',
            where: { user_id: userId },
            attributes: ['id', 'name', 'phone_number']
          }
        ]
      });

      if (!message) {
        throw new Error('Message not found or access denied');
      }

      return message;

    } catch (error) {
      logError(error, `Error getting message: ${messageId}`);
      throw error;
    }
  }

  // Delete message
  async deleteMessage(messageId, userId) {
    try {
      const message = await this.getMessage(messageId, userId);
      
      // Only allow deletion of outgoing messages
      if (message.direction === 'incoming') {
        throw new Error('Cannot delete incoming messages');
      }

      await message.destroy();

      logInfo(`Message deleted: ${messageId} by user: ${userId}`);
      return { success: true, message: 'Message deleted successfully' };

    } catch (error) {
      logError(error, `Error deleting message: ${messageId}`);
      throw error;
    }
  }

  // Get message statistics
  async getMessageStats(deviceId, userId, period = '30d') {
    try {
      // Validate device ownership
      const device = await Device.findOne({
        where: { id: deviceId, user_id: userId }
      });

      if (!device) {
        throw new Error('Device not found or access denied');
      }

      const startDate = this.getStartDate(period);
      
      // Get message counts by type
      const messageStats = await Message.findAll({
        where: {
          device_id: deviceId,
          created_at: { [require('sequelize').Op.gte]: startDate }
        },
        attributes: [
          'message_type',
          'direction',
          'status',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: ['message_type', 'direction', 'status']
      });

      // Get daily message counts
      const dailyStats = await Message.findAll({
        where: {
          device_id: deviceId,
          created_at: { [require('sequelize').Op.gte]: startDate }
        },
        attributes: [
          [require('sequelize').fn('DATE', require('sequelize').col('created_at')), 'date'],
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: [require('sequelize').fn('DATE', require('sequelize').col('created_at'))],
        order: [[require('sequelize').fn('DATE', require('sequelize').col('created_at')), 'ASC']]
      });

      return {
        period,
        start_date: startDate,
        message_stats: messageStats,
        daily_stats: dailyStats
      };

    } catch (error) {
      logError(error, `Error getting message stats: ${deviceId}`);
      throw error;
    }
  }

  // Utility methods
  async validateDevice(deviceId) {
    const device = await Device.findByPk(deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    // For now, only check database status since WhatsApp service connections are not persistent
    if (device.status !== 'connected') {
      throw new Error('Device is not connected');
    }

    return device;
  }

  async storeOutgoingMessage(data) {
    // Get device info to get the phone number
    const device = await Device.findByPk(data.device_id);
    
    return await Message.create({
      ...data,
      direction: 'outgoing',
      from_number: device?.phone_number || device?.connection_info?.phone_number || null,
      timestamp: new Date(),
      sent_at: new Date(),
      created_at: new Date()
    });
  }

  async storeIncomingMessage(data) {
    return await Message.create({
      ...data,
      direction: 'incoming',
      timestamp: new Date(),
      created_at: new Date()
    });
  }

  extractMessageData(whatsappMessage) {
    const messageId = whatsappMessage.key.id;
    const fromNumber = whatsappMessage.key.remoteJid.replace('@s.whatsapp.net', '');
    const timestamp = new Date(whatsappMessage.messageTimestamp * 1000);
    
    let type = this.messageTypes.TEXT;
    let content = '';
    let metadata = {};

    // Extract message content based on type
    if (whatsappMessage.message?.conversation) {
      content = whatsappMessage.message.conversation;
    } else if (whatsappMessage.message?.extendedTextMessage) {
      content = whatsappMessage.message.extendedTextMessage.text;
    } else if (whatsappMessage.message?.imageMessage) {
      type = this.messageTypes.IMAGE;
      content = 'Image message';
      metadata = {
        mimetype: whatsappMessage.message.imageMessage.mimetype,
        caption: whatsappMessage.message.imageMessage.caption
      };
    } else if (whatsappMessage.message?.videoMessage) {
      type = this.messageTypes.VIDEO;
      content = 'Video message';
      metadata = {
        mimetype: whatsappMessage.message.videoMessage.mimetype,
        caption: whatsappMessage.message.videoMessage.caption
      };
    } else if (whatsappMessage.message?.audioMessage) {
      type = this.messageTypes.AUDIO;
      content = 'Audio message';
      metadata = {
        mimetype: whatsappMessage.message.audioMessage.mimetype
      };
    } else if (whatsappMessage.message?.documentMessage) {
      type = this.messageTypes.DOCUMENT;
      content = 'Document message';
      metadata = {
        filename: whatsappMessage.message.documentMessage.fileName,
        mimetype: whatsappMessage.message.documentMessage.mimetype
      };
    } else if (whatsappMessage.message?.locationMessage) {
      type = this.messageTypes.LOCATION;
      content = 'Location message';
      metadata = {
        latitude: whatsappMessage.message.locationMessage.degreesLatitude,
        longitude: whatsappMessage.message.locationMessage.degreesLongitude,
        name: whatsappMessage.message.locationMessage.name,
        address: whatsappMessage.message.locationMessage.address
      };
    } else if (whatsappMessage.message?.contactMessage) {
      type = this.messageTypes.CONTACT;
      content = 'Contact message';
      metadata = {
        contact: whatsappMessage.message.contactMessage
      };
    }

    return {
      messageId,
      fromNumber,
      type,
      content,
      timestamp,
      metadata
    };
  }

  async updateContact(phoneNumber, contactInfo = {}) {
    try {
      const formattedNumber = formatPhoneNumber(phoneNumber);
      
      const [contact] = await Contact.findOrCreate({
        where: { phone: formattedNumber },
        defaults: {
          name: contactInfo.name || 'Unknown',
          phone: formattedNumber,
          email: contactInfo.email || null,
          organization: contactInfo.organization || null
        }
      });

      // Update contact info if provided
      if (contactInfo.name || contactInfo.email || contactInfo.organization) {
        await contact.update({
          name: contactInfo.name || contact.name,
          email: contactInfo.email || contact.email,
          organization: contactInfo.organization || contact.organization
        });
      }

      return contact;
    } catch (error) {
      logError(error, `Error updating contact: ${phoneNumber}`);
    }
  }

  async triggerWebhooks(deviceId, message) {
    // TODO: Implement webhook triggering
    // This will be implemented when we create the webhook service
  }

  getMediaTypeFromPath(filePath) {
    const ext = require('path').extname(filePath).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) return this.messageTypes.IMAGE;
    if (['.mp4', '.avi', '.mov', '.mkv'].includes(ext)) return this.messageTypes.VIDEO;
    if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) return this.messageTypes.AUDIO;
    return this.messageTypes.DOCUMENT;
  }

  getMediaTypeFromMimeType(mimeType) {
    if (mimeType.startsWith('image/')) return this.messageTypes.IMAGE;
    if (mimeType.startsWith('video/')) return this.messageTypes.VIDEO;
    if (mimeType.startsWith('audio/')) return this.messageTypes.AUDIO;
    return this.messageTypes.DOCUMENT;
  }

  getStartDate(period) {
    const now = new Date();
    switch (period) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}

module.exports = new MessageService(); 
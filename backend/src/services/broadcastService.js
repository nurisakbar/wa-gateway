const { Op } = require('sequelize');
const { Contact, Message, Device } = require('../models');
const messageService = require('./messageService');
const whatsappService = require('./whatsappService');
const socketService = require('./socketService');
const { logInfo, logError } = require('../utils/logger');
const { formatPhoneNumber } = require('../utils/helpers');

class BroadcastService {
  constructor() {
    this.broadcastQueue = new Map();
    this.scheduledBroadcasts = new Map();
  }

  // Send broadcast to multiple contacts
  async sendBroadcast(deviceId, contacts, messageData, options = {}) {
    try {
      const {
        template_id,
        scheduled_at,
        batch_size = 10,
        delay_between_messages = 1000,
        priority = 'normal'
      } = options;

      logInfo(`Starting broadcast from device: ${deviceId} to ${contacts.length} contacts`);

      // Validate device
      const device = await Device.findByPk(deviceId);
      if (!device || !device.is_active) {
        throw new Error('Device not found or inactive');
      }

      // Create broadcast record
      const broadcastId = this.generateBroadcastId();
      
      // If scheduled, add to scheduled queue
      if (scheduled_at && new Date(scheduled_at) > new Date()) {
        return await this.scheduleBroadcast(broadcastId, deviceId, contacts, messageData, options);
      }

      // Send immediately
      return await this.executeBroadcast(broadcastId, deviceId, contacts, messageData, {
        batch_size,
        delay_between_messages,
        priority
      });

    } catch (error) {
      logError(error, 'Error in sendBroadcast');
      throw error;
    }
  }

  // Execute broadcast immediately
  async executeBroadcast(broadcastId, deviceId, contacts, messageData, options = {}) {
    const {
      batch_size = 10,
      delay_between_messages = 1000,
      priority = 'normal'
    } = options;

    const results = {
      broadcast_id: broadcastId,
      total_contacts: contacts.length,
      sent: 0,
      failed: 0,
      pending: contacts.length,
      results: []
    };

    // Process in batches
    for (let i = 0; i < contacts.length; i += batch_size) {
      const batch = contacts.slice(i, i + batch_size);
      
      // Process batch
      const batchPromises = batch.map(async (contact, index) => {
        try {
          // Add delay between messages to avoid rate limiting
          if (index > 0) {
            await this.delay(delay_between_messages);
          }

          const result = await this.sendToContact(deviceId, contact, messageData);
          
          results.results.push({
            contact_id: contact.id,
            phone_number: contact.phone_number,
            status: 'sent',
            message_id: result.message_id,
            timestamp: new Date()
          });
          
          results.sent++;
          results.pending--;

          // Update progress via socket
          socketService.emitToUser(device.user_id, 'broadcast_progress', {
            broadcast_id: broadcastId,
            progress: {
              sent: results.sent,
              failed: results.failed,
              pending: results.pending,
              total: results.total_contacts
            }
          });

        } catch (error) {
          logError(error, `Failed to send broadcast to contact: ${contact.phone_number}`);
          
          results.results.push({
            contact_id: contact.id,
            phone_number: contact.phone_number,
            status: 'failed',
            error: error.message,
            timestamp: new Date()
          });
          
          results.failed++;
          results.pending--;
        }
      });

      await Promise.all(batchPromises);
    }

    // Store broadcast results
    await this.storeBroadcastResults(broadcastId, results);

    logInfo(`Broadcast completed: ${broadcastId}`, {
      sent: results.sent,
      failed: results.failed,
      total: results.total_contacts
    });

    return results;
  }

  // Send message to single contact
  async sendToContact(deviceId, contact, messageData) {
    const { message_type, content, media_url, caption, template_data } = messageData;

    switch (message_type) {
      case 'text':
        return await messageService.sendTextMessage(deviceId, contact.phone_number, content);
      
      case 'media':
        return await messageService.sendMediaMessage(deviceId, contact.phone_number, media_url, caption);
      
      case 'template':
        return await messageService.sendTemplateMessage(deviceId, contact.phone_number, template_data);
      
      default:
        throw new Error(`Unsupported message type: ${message_type}`);
    }
  }

  // Schedule broadcast for later
  async scheduleBroadcast(broadcastId, deviceId, contacts, messageData, options) {
    const { scheduled_at } = options;
    
    const scheduledTime = new Date(scheduled_at);
    const now = new Date();
    const delay = scheduledTime.getTime() - now.getTime();

    if (delay <= 0) {
      throw new Error('Scheduled time must be in the future');
    }

    // Store scheduled broadcast
    this.scheduledBroadcasts.set(broadcastId, {
      deviceId,
      contacts,
      messageData,
      options,
      scheduled_at: scheduledTime
    });

    // Set timeout to execute broadcast
    setTimeout(async () => {
      try {
        await this.executeBroadcast(broadcastId, deviceId, contacts, messageData, options);
        this.scheduledBroadcasts.delete(broadcastId);
      } catch (error) {
        logError(error, `Error executing scheduled broadcast: ${broadcastId}`);
      }
    }, delay);

    logInfo(`Broadcast scheduled: ${broadcastId} for ${scheduled_at}`);

    return {
      broadcast_id: broadcastId,
      status: 'scheduled',
      scheduled_at: scheduledTime,
      total_contacts: contacts.length
    };
  }

  // Cancel scheduled broadcast
  async cancelScheduledBroadcast(broadcastId) {
    if (this.scheduledBroadcasts.has(broadcastId)) {
      this.scheduledBroadcasts.delete(broadcastId);
      logInfo(`Scheduled broadcast cancelled: ${broadcastId}`);
      return { success: true, message: 'Broadcast cancelled successfully' };
    }
    
    throw new Error('Broadcast not found or already executed');
  }

  // Get broadcast status
  async getBroadcastStatus(broadcastId) {
    // Check if it's a scheduled broadcast
    if (this.scheduledBroadcasts.has(broadcastId)) {
      const broadcast = this.scheduledBroadcasts.get(broadcastId);
      return {
        broadcast_id: broadcastId,
        status: 'scheduled',
        scheduled_at: broadcast.scheduled_at,
        total_contacts: broadcast.contacts.length
      };
    }

    // Check completed broadcasts (you might want to store this in database)
    // For now, return not found
    throw new Error('Broadcast not found');
  }

  // Get contacts by filters
  async getContactsForBroadcast(filters = {}) {
    const {
      tags = [],
      groups = [],
      exclude_tags = [],
      phone_numbers = [],
      limit = 1000
    } = filters;

    let whereClause = {};

    // Filter by tags
    if (tags.length > 0) {
      whereClause.tags = {
        [Op.overlap]: tags
      };
    }

    // Exclude by tags
    if (exclude_tags.length > 0) {
      whereClause.tags = {
        [Op.not]: {
          [Op.overlap]: exclude_tags
        }
      };
    }

    // Filter by phone numbers
    if (phone_numbers.length > 0) {
      whereClause.phone_number = {
        [Op.in]: phone_numbers
      };
    }

    const contacts = await Contact.findAll({
      where: whereClause,
      limit,
      order: [['created_at', 'DESC']]
    });

    return contacts;
  }

  // Store broadcast results
  async storeBroadcastResults(broadcastId, results) {
    // You might want to create a Broadcast model to store this data
    // For now, we'll just log it
    logInfo(`Broadcast results stored: ${broadcastId}`, results);
  }

  // Generate unique broadcast ID
  generateBroadcastId() {
    return `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Utility function for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get scheduled broadcasts
  getScheduledBroadcasts() {
    return Array.from(this.scheduledBroadcasts.entries()).map(([id, broadcast]) => ({
      broadcast_id: id,
      device_id: broadcast.deviceId,
      scheduled_at: broadcast.scheduled_at,
      total_contacts: broadcast.contacts.length
    }));
  }

  // Clean up old scheduled broadcasts
  cleanupScheduledBroadcasts() {
    const now = new Date();
    for (const [id, broadcast] of this.scheduledBroadcasts.entries()) {
      if (broadcast.scheduled_at < now) {
        this.scheduledBroadcasts.delete(id);
        logInfo(`Cleaned up expired scheduled broadcast: ${id}`);
      }
    }
  }
}

module.exports = new BroadcastService(); 
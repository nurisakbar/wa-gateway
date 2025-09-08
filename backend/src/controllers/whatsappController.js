const { Device, Message, Contact } = require('../models');
const { logError, logInfo } = require('../utils/logger');

// Send message
const sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { to, message, device_id, type = 'text' } = req.body;

    // Validate input
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and message are required'
      });
    }

    // Find active device
    let device;
    if (device_id) {
      device = await Device.findOne({
        where: { id: device_id, user_id: userId, status: 'connected' }
      });
    } else {
      device = await Device.findOne({
        where: { user_id: userId, status: 'connected' }
      });
    }

    if (!device) {
      return res.status(400).json({
        success: false,
        message: 'No connected device available'
      });
    }

    // Send message via appropriate service
    let result;
    if (type === 'media' && req.body.media_url) {
      // Send media message
      const messageService = require('../services/messageService');
      result = await messageService.sendMediaMessage(device.id, to, req.body.media_url, message);
    } else {
      // Send text message
      const messageService = require('../services/messageService');
      result = await messageService.sendTextMessage(device.id, to, message);
    }

    logInfo(`Message sent via API: ${result.database_id} to ${to}`, 'WHATSAPP_API');

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message_id: result.message_id,
        database_id: result.database_id,
        status: 'sent',
        sent_at: result.timestamp
      }
    });

  } catch (error) {
    logError(error, 'Send Message API Error');
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Send template message
const sendTemplate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { to, template_name, variables = {}, device_id } = req.body;

    // Validate input
    if (!to || !template_name) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and template name are required'
      });
    }

    // Find active device
    let device;
    if (device_id) {
      device = await Device.findOne({
        where: { id: device_id, user_id: userId, status: 'connected' }
      });
    } else {
      device = await Device.findOne({
        where: { user_id: userId, status: 'connected' }
      });
    }

    if (!device) {
      return res.status(400).json({
        success: false,
        message: 'No connected device available'
      });
    }

    // TODO: Validate template exists and is approved
    // TODO: Replace variables in template

    // Create message record
    const messageRecord = await Message.create({
      user_id: userId,
      device_id: device.id,
      to_number: to,
      content: `Template: ${template_name}`,
      message_type: 'text',
      status: 'pending',
      direction: 'outgoing',
      metadata: { template_name, variables }
    });

    // TODO: Integrate with WhatsApp service to actually send template
    await messageRecord.update({ status: 'sent', sent_at: new Date() });

    logInfo(`Template sent via API: ${messageRecord.id} to ${to}`, 'WHATSAPP_API');

    res.json({
      success: true,
      message: 'Template sent successfully',
      data: {
        message_id: messageRecord.id,
        status: messageRecord.status,
        sent_at: messageRecord.sent_at
      }
    });

  } catch (error) {
    logError(error, 'Send Template API Error');
    res.status(500).json({
      success: false,
      message: 'Failed to send template',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Send bulk messages
const sendBulk = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipients, message, device_id, type = 'text' } = req.body;

    // Validate input
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipients array is required'
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Find active device
    let device;
    if (device_id) {
      device = await Device.findOne({
        where: { id: device_id, user_id: userId, status: 'connected' }
      });
    } else {
      device = await Device.findOne({
        where: { user_id: userId, status: 'connected' }
      });
    }

    if (!device) {
      return res.status(400).json({
        success: false,
        message: 'No connected device available'
      });
    }

    // Create message records for all recipients
    const messageRecords = [];
    for (const recipient of recipients) {
      const messageRecord = await Message.create({
        user_id: userId,
        device_id: device.id,
        to_number: recipient,
        content: message,
        message_type: type,
        status: 'pending',
        direction: 'outgoing'
      });
      messageRecords.push(messageRecord);
    }

    // TODO: Integrate with WhatsApp service to actually send messages
    // For now, simulate successful sending
    for (const messageRecord of messageRecords) {
      await messageRecord.update({ status: 'sent', sent_at: new Date() });
    }

    logInfo(`Bulk messages sent via API: ${messageRecords.length} messages`, 'WHATSAPP_API');

    res.json({
      success: true,
      message: 'Bulk messages sent successfully',
      data: {
        total_sent: messageRecords.length,
        message_ids: messageRecords.map(m => m.id)
      }
    });

  } catch (error) {
    logError(error, 'Send Bulk API Error');
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get messages
const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status, type } = req.query;

    const where = { user_id: userId };
    if (status) where.status = status;
    if (type) where.message_type = type;

    const messages = await Message.findAndCountAll({
      where,
      include: [
        { model: Device, as: 'device', attributes: ['id', 'name'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        messages: messages.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: messages.count,
          pages: Math.ceil(messages.count / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logError(error, 'Get Messages API Error');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get message status
const getMessageStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    const message = await Message.findOne({
      where: { id: messageId, user_id: userId },
      include: [
        { model: Device, as: 'device', attributes: ['id', 'name'] }
      ]
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({
      success: true,
      data: {
        message_id: message.id,
        status: message.status,
        sent_at: message.sent_at,
        delivered_at: message.delivered_at,
        read_at: message.read_at,
        error: message.error
      }
    });

  } catch (error) {
    logError(error, 'Get Message Status API Error');
    res.status(500).json({
      success: false,
      message: 'Failed to get message status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get balance/usage
const getBalance = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get message counts
    const totalMessages = await Message.count({
      where: { user_id: userId, direction: 'outgoing' }
    });

    const sentMessages = await Message.count({
      where: { user_id: userId, direction: 'outgoing', status: 'sent' }
    });

    const failedMessages = await Message.count({
      where: { user_id: userId, direction: 'outgoing', status: 'failed' }
    });

    // TODO: Get actual balance from subscription/plan
    const balance = {
      total_messages: totalMessages,
      sent_messages: sentMessages,
      failed_messages: failedMessages,
      success_rate: totalMessages > 0 ? (sentMessages / totalMessages * 100).toFixed(2) : 0,
      // These would come from subscription system
      plan_limit: 1000,
      messages_used: totalMessages,
      messages_remaining: 1000 - totalMessages
    };

    res.json({
      success: true,
      data: balance
    });

  } catch (error) {
    logError(error, 'Get Balance API Error');
    res.status(500).json({
      success: false,
      message: 'Failed to get balance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get devices
const getDevices = async (req, res) => {
  try {
    const userId = req.user.id;

    const devices = await Device.findAll({
      where: { user_id: userId },
      attributes: ['id', 'name', 'phone_number', 'status', 'last_activity'],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: devices
    });

  } catch (error) {
    logError(error, 'Get Devices API Error');
    res.status(500).json({
      success: false,
      message: 'Failed to get devices',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Handle webhook
const handleWebhook = async (req, res) => {
  try {
    const { event, data } = req.body;

    // TODO: Implement webhook handling
    // This would handle incoming messages, delivery reports, etc.

    logInfo(`Webhook received: ${event}`, 'WHATSAPP_WEBHOOK');

    res.json({
      success: true,
      message: 'Webhook processed'
    });

  } catch (error) {
    logError(error, 'Webhook Error');
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
};

module.exports = {
  sendMessage,
  sendTemplate,
  sendBulk,
  getMessages,
  getMessageStatus,
  getBalance,
  getDevices,
  handleWebhook
}; 
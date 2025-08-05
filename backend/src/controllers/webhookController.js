const { Webhook } = require('../models');
const webhookService = require('../services/webhookService');
const { logError, logInfo } = require('../utils/logger');

// Get all webhooks for user
const getUserWebhooks = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const webhooks = await Webhook.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });

    logInfo(`Retrieved ${webhooks.length} webhooks for user: ${userId}`, 'WEBHOOK');

    res.json({
      success: true,
      data: webhooks
    });

  } catch (error) {
    logError(error, 'Get Webhooks Error');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve webhooks',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new webhook
const createWebhook = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, url, events, secret, retry_count, timeout } = req.body;

    // Validate input
    if (!name || !url || !events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Name, URL, and events array are required'
      });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format'
      });
    }

    // Validate events
    const validEvents = [
      'message.received',
      'message.sent',
      'message.delivered',
      'message.read',
      'device.connected',
      'device.disconnected',
      'device.qr_generated',
      'contact.created',
      'contact.updated',
      'contact.deleted',
      'api_key.created',
      'api_key.updated',
      'api_key.deleted'
    ];

    const invalidEvents = events.filter(event => !validEvents.includes(event));
    if (invalidEvents.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid events: ${invalidEvents.join(', ')}`
      });
    }

    // Check if name already exists for this user
    const existingWebhook = await Webhook.findOne({
      where: { user_id: userId, name: name.trim() }
    });

    if (existingWebhook) {
      return res.status(400).json({
        success: false,
        message: 'Webhook with this name already exists'
      });
    }

    // Create webhook
    const webhook = await Webhook.create({
      user_id: userId,
      name: name.trim(),
      url: url.trim(),
      events: events,
      secret: secret || null,
      retry_count: retry_count || 3,
      timeout: timeout || 10000
    });

    logInfo(`Created new webhook: ${webhook.name} for user: ${userId}`, 'WEBHOOK');

    res.status(201).json({
      success: true,
      message: 'Webhook created successfully',
      data: webhook
    });

  } catch (error) {
    logError(error, 'Create Webhook Error');
    res.status(500).json({
      success: false,
      message: 'Failed to create webhook',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update webhook
const updateWebhook = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, url, events, secret, retry_count, timeout, is_active } = req.body;

    // Find webhook
    const webhook = await Webhook.findOne({
      where: { id, user_id: userId }
    });

    if (!webhook) {
      return res.status(404).json({
        success: false,
        message: 'Webhook not found'
      });
    }

    // Update fields
    const updateData = {};
    
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Webhook name cannot be empty'
        });
      }
      
      // Check if name already exists (excluding current webhook)
      const existingWebhook = await Webhook.findOne({
        where: { 
          user_id: userId, 
          name: name.trim(),
          id: { [require('sequelize').Op.ne]: id }
        }
      });

      if (existingWebhook) {
        return res.status(400).json({
          success: false,
          message: 'Webhook with this name already exists'
        });
      }
      
      updateData.name = name.trim();
    }

    if (url !== undefined) {
      try {
        new URL(url);
        updateData.url = url.trim();
      } catch {
        return res.status(400).json({
          success: false,
          message: 'Invalid URL format'
        });
      }
    }

    if (events !== undefined) {
      if (!Array.isArray(events) || events.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Events must be a non-empty array'
        });
      }

      const validEvents = [
        'message.received',
        'message.sent',
        'message.delivered',
        'message.read',
        'device.connected',
        'device.disconnected',
        'device.qr_generated',
        'contact.created',
        'contact.updated',
        'contact.deleted',
        'api_key.created',
        'api_key.updated',
        'api_key.deleted'
      ];

      const invalidEvents = events.filter(event => !validEvents.includes(event));
      if (invalidEvents.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid events: ${invalidEvents.join(', ')}`
        });
      }

      updateData.events = events;
    }

    if (secret !== undefined) updateData.secret = secret || null;
    if (retry_count !== undefined) updateData.retry_count = retry_count;
    if (timeout !== undefined) updateData.timeout = timeout;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Update webhook
    await webhook.update(updateData);

    logInfo(`Updated webhook: ${webhook.name} for user: ${userId}`, 'WEBHOOK');

    res.json({
      success: true,
      message: 'Webhook updated successfully',
      data: webhook
    });

  } catch (error) {
    logError(error, 'Update Webhook Error');
    res.status(500).json({
      success: false,
      message: 'Failed to update webhook',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete webhook
const deleteWebhook = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Find webhook
    const webhook = await Webhook.findOne({
      where: { id, user_id: userId }
    });

    if (!webhook) {
      return res.status(404).json({
        success: false,
        message: 'Webhook not found'
      });
    }

    // Delete webhook
    await webhook.destroy();

    logInfo(`Deleted webhook: ${webhook.name} for user: ${userId}`, 'WEBHOOK');

    res.json({
      success: true,
      message: 'Webhook deleted successfully'
    });

  } catch (error) {
    logError(error, 'Delete Webhook Error');
    res.status(500).json({
      success: false,
      message: 'Failed to delete webhook',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Test webhook
const testWebhook = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Find webhook
    const webhook = await Webhook.findOne({
      where: { id, user_id: userId }
    });

    if (!webhook) {
      return res.status(404).json({
        success: false,
        message: 'Webhook not found'
      });
    }

    // Test webhook
    const testResult = await webhookService.testWebhook(webhook);

    logInfo(`Tested webhook: ${webhook.name} for user: ${userId}`, 'WEBHOOK');

    res.json({
      success: true,
      message: 'Webhook test completed',
      data: testResult
    });

  } catch (error) {
    logError(error, 'Test Webhook Error');
    res.status(500).json({
      success: false,
      message: 'Failed to test webhook',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get webhook statistics
const getWebhookStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const stats = await webhookService.getWebhookStats(userId, id);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logError(error, 'Get Webhook Stats Error');
    res.status(500).json({
      success: false,
      message: 'Failed to get webhook statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getUserWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  getWebhookStats
}; 
const { v4: uuidv4 } = require('uuid');
const { logError, logInfo } = require('../utils/logger');
const webhookService = require('../services/webhookService');

class WebhookController {
  // Get all webhooks
  async getAllWebhooks(req, res) {
    try {
      const webhooks = webhookService.getAllWebhooks();

      res.json({
        success: true,
        data: webhooks
      });

    } catch (error) {
      logError(error, 'Error getting all webhooks');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get webhook by ID
  async getWebhook(req, res) {
    try {
      const { webhookId } = req.params;
      const webhook = webhookService.getWebhook(webhookId);

      if (!webhook) {
        return res.status(404).json({
          success: false,
          message: 'Webhook not found'
        });
      }

      res.json({
        success: true,
        data: webhook
      });

    } catch (error) {
      logError(error, 'Error getting webhook');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Create webhook
  async createWebhook(req, res) {
    try {
      const { name, url, events, secret } = req.body;

      // Validate webhook configuration
      const validation = webhookService.validateWebhookConfig({
        name,
        url,
        events,
        secret
      });

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid webhook configuration',
          errors: validation.errors
        });
      }

      const webhookId = uuidv4();
      const config = {
        name,
        url,
        events,
        secret: secret || null,
        userId: req.user.id
      };

      webhookService.registerWebhook(webhookId, config);

      const webhook = webhookService.getWebhook(webhookId);

      logInfo(`Webhook created: ${webhookId} by user: ${req.user.id}`);

      res.status(201).json({
        success: true,
        message: 'Webhook created successfully',
        data: webhook
      });

    } catch (error) {
      logError(error, 'Error creating webhook');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update webhook
  async updateWebhook(req, res) {
    try {
      const { webhookId } = req.params;
      const updates = req.body;

      const webhook = webhookService.getWebhook(webhookId);
      if (!webhook) {
        return res.status(404).json({
          success: false,
          message: 'Webhook not found'
        });
      }

      // Validate updates if URL or events are being changed
      if (updates.url || updates.events) {
        const validation = webhookService.validateWebhookConfig({
          ...webhook,
          ...updates
        });

        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            message: 'Invalid webhook configuration',
            errors: validation.errors
          });
        }
      }

      const updated = webhookService.updateWebhook(webhookId, updates);

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'Failed to update webhook'
        });
      }

      const updatedWebhook = webhookService.getWebhook(webhookId);

      logInfo(`Webhook updated: ${webhookId} by user: ${req.user.id}`);

      res.json({
        success: true,
        message: 'Webhook updated successfully',
        data: updatedWebhook
      });

    } catch (error) {
      logError(error, 'Error updating webhook');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Delete webhook
  async deleteWebhook(req, res) {
    try {
      const { webhookId } = req.params;
      const deleted = webhookService.unregisterWebhook(webhookId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Webhook not found'
        });
      }

      logInfo(`Webhook deleted: ${webhookId} by user: ${req.user.id}`);

      res.json({
        success: true,
        message: 'Webhook deleted successfully'
      });

    } catch (error) {
      logError(error, 'Error deleting webhook');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Test webhook
  async testWebhook(req, res) {
    try {
      const { webhookId } = req.params;
      const result = await webhookService.testWebhook(webhookId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Webhook test failed',
          error: result.error
        });
      }

      logInfo(`Webhook tested: ${webhookId} by user: ${req.user.id}`);

      res.json({
        success: true,
        message: 'Webhook test completed successfully',
        data: result
      });

    } catch (error) {
      logError(error, 'Error testing webhook');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get webhook statistics
  async getWebhookStats(req, res) {
    try {
      const stats = webhookService.getWebhookStats();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logError(error, 'Error getting webhook statistics');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Reactivate webhook
  async reactivateWebhook(req, res) {
    try {
      const { webhookId } = req.params;
      const reactivated = webhookService.reactivateWebhook(webhookId);

      if (!reactivated) {
        return res.status(404).json({
          success: false,
          message: 'Webhook not found'
        });
      }

      logInfo(`Webhook reactivated: ${webhookId} by user: ${req.user.id}`);

      res.json({
        success: true,
        message: 'Webhook reactivated successfully'
      });

    } catch (error) {
      logError(error, 'Error reactivating webhook');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Clean up inactive webhooks
  async cleanupInactiveWebhooks(req, res) {
    try {
      const { maxFailures = 10 } = req.query;
      const cleanedCount = webhookService.cleanupInactiveWebhooks(parseInt(maxFailures));

      logInfo(`Webhook cleanup completed: ${cleanedCount} webhooks deactivated by user: ${req.user.id}`);

      res.json({
        success: true,
        message: `Cleanup completed. ${cleanedCount} webhooks were deactivated.`,
        data: { deactivatedCount: cleanedCount }
      });

    } catch (error) {
      logError(error, 'Error during webhook cleanup');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get available events
  async getAvailableEvents(req, res) {
    try {
      const events = [
        {
          name: 'message.received',
          description: 'Triggered when a new message is received',
          category: 'message'
        },
        {
          name: 'message.sent',
          description: 'Triggered when a message is sent successfully',
          category: 'message'
        },
        {
          name: 'message.delivered',
          description: 'Triggered when a message is delivered to recipient',
          category: 'message'
        },
        {
          name: 'message.read',
          description: 'Triggered when a message is read by recipient',
          category: 'message'
        },
        {
          name: 'device.connected',
          description: 'Triggered when a WhatsApp device connects',
          category: 'device'
        },
        {
          name: 'device.disconnected',
          description: 'Triggered when a WhatsApp device disconnects',
          category: 'device'
        },
        {
          name: 'device.qr_generated',
          description: 'Triggered when a new QR code is generated',
          category: 'device'
        },
        {
          name: 'contact.created',
          description: 'Triggered when a new contact is created',
          category: 'contact'
        },
        {
          name: 'contact.updated',
          description: 'Triggered when a contact is updated',
          category: 'contact'
        },
        {
          name: 'contact.deleted',
          description: 'Triggered when a contact is deleted',
          category: 'contact'
        },
        {
          name: 'test',
          description: 'Test event for webhook validation',
          category: 'system'
        }
      ];

      res.json({
        success: true,
        data: events
      });

    } catch (error) {
      logError(error, 'Error getting available events');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Validate webhook configuration
  async validateWebhookConfig(req, res) {
    try {
      const config = req.body;
      const validation = webhookService.validateWebhookConfig(config);

      res.json({
        success: true,
        data: validation
      });

    } catch (error) {
      logError(error, 'Error validating webhook configuration');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new WebhookController(); 
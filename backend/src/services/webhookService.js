const axios = require('axios');
const crypto = require('crypto');
const { Webhook } = require('../models');
const { logError, logInfo } = require('../utils/logger');

class WebhookService {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  // Add webhook to queue
  async queueWebhook(userId, event, data) {
    try {
      // Get active webhooks for this user and event
      const webhooks = await Webhook.getActiveWebhooks(userId, [event]);
      
      if (webhooks.length === 0) {
        return;
      }

      // Add to queue for each webhook
      for (const webhook of webhooks) {
        this.queue.push({
          webhook,
          event,
          data,
          attempts: 0,
          maxAttempts: webhook.retry_count
        });
      }

      // Start processing if not already running
      if (!this.isProcessing) {
        this.processQueue();
      }

      logInfo(`Queued webhook for event: ${event}`, 'WEBHOOK_SERVICE');

    } catch (error) {
      logError(error, 'Webhook Queue Error');
    }
  }

  // Process webhook queue
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const webhookItem = this.queue.shift();
      
      try {
        await this.deliverWebhook(webhookItem);
      } catch (error) {
        logError(error, 'Webhook Processing Error');
        
        // Re-queue if we haven't exceeded max attempts
        if (webhookItem.attempts < webhookItem.maxAttempts) {
          webhookItem.attempts++;
          this.queue.push(webhookItem);
        } else {
          // Mark webhook as failed
          await this.markWebhookFailed(webhookItem.webhook, error.message);
        }
      }

      // Small delay between deliveries
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessing = false;
  }

  // Deliver webhook to endpoint
  async deliverWebhook(webhookItem) {
    const { webhook, event, data, attempts } = webhookItem;

    try {
      // Prepare payload
      const payload = {
        event: event,
        timestamp: new Date().toISOString(),
        data: data,
        webhook_id: webhook.id
      };

      // Add signature if secret is configured
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'WA-Gateway-Webhook/1.0'
      };

      if (webhook.secret) {
        const signature = this.generateSignature(payload, webhook.secret);
        headers['X-Webhook-Signature'] = signature;
      }

      // Send webhook
      const response = await axios.post(webhook.url, payload, {
        headers,
        timeout: webhook.timeout,
        validateStatus: () => true // Don't throw on any status code
      });

      // Check if delivery was successful
      if (response.status >= 200 && response.status < 300) {
        await this.markWebhookSuccess(webhook);
        logInfo(`Webhook delivered successfully: ${webhook.url}`, 'WEBHOOK_SERVICE');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      logError(`Webhook delivery failed (attempt ${attempts + 1}): ${error.message}`, 'WEBHOOK_SERVICE');
      throw error;
    }
  }

  // Generate webhook signature
  generateSignature(payload, secret) {
    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
  }

  // Mark webhook as successful
  async markWebhookSuccess(webhook) {
    try {
      await webhook.update({
        last_delivery_at: new Date(),
        last_error_at: null,
        last_error_message: null
      });
    } catch (error) {
      logError(error, 'Mark Webhook Success Error');
    }
  }

  // Mark webhook as failed
  async markWebhookFailed(webhook, errorMessage) {
    try {
      await webhook.update({
        last_error_at: new Date(),
        last_error_message: errorMessage
      });
    } catch (error) {
      logError(error, 'Mark Webhook Failed Error');
    }
  }

  // Test webhook endpoint
  async testWebhook(webhook) {
    try {
      const testPayload = {
        event: 'webhook.test',
        timestamp: new Date().toISOString(),
        data: {
          message: 'This is a test webhook from KlikWhatsApp',
          webhook_id: webhook.id
        }
      };

      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'WA-Gateway-Webhook/1.0'
      };

      if (webhook.secret) {
        const signature = this.generateSignature(testPayload, webhook.secret);
        headers['X-Webhook-Signature'] = signature;
      }

      const response = await axios.post(webhook.url, testPayload, {
        headers,
        timeout: webhook.timeout,
        validateStatus: () => true
      });

      return {
        success: response.status >= 200 && response.status < 300,
        status: response.status,
        statusText: response.statusText,
        responseTime: response.headers['x-response-time'] || 'unknown'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.response?.status || 'unknown',
        statusText: error.response?.statusText || 'unknown'
      };
    }
  }

  // Get webhook delivery statistics
  async getWebhookStats(userId, webhookId = null) {
    try {
      const where = { user_id: userId };
      if (webhookId) {
        where.id = webhookId;
      }

      const webhooks = await Webhook.findAll({ where });

      const stats = {
        total_webhooks: webhooks.length,
        active_webhooks: webhooks.filter(w => w.is_active).length,
        failed_webhooks: webhooks.filter(w => w.last_error_at && (!w.last_delivery_at || w.last_error_at > w.last_delivery_at)).length,
        last_24h_deliveries: 0, // Would need additional tracking table for this
        average_response_time: 0 // Would need additional tracking table for this
      };

      return stats;

    } catch (error) {
      logError(error, 'Get Webhook Stats Error');
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new WebhookService(); 
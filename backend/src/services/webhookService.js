const axios = require('axios');
const crypto = require('crypto');
const { logError, logInfo } = require('../utils/logger');

class WebhookService {
  constructor() {
    this.webhooks = new Map();
    this.retryAttempts = parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS) || 3;
    this.retryDelay = parseInt(process.env.WEBHOOK_RETRY_DELAY) || 5000; // 5 seconds
    this.timeout = parseInt(process.env.WEBHOOK_TIMEOUT) || 10000; // 10 seconds
  }

  // Register a webhook
  registerWebhook(webhookId, config) {
    this.webhooks.set(webhookId, {
      ...config,
      id: webhookId,
      isActive: true,
      lastTriggered: null,
      failureCount: 0,
      createdAt: new Date()
    });

    logInfo(`Webhook registered: ${webhookId} for events: ${config.events.join(', ')}`);
  }

  // Unregister a webhook
  unregisterWebhook(webhookId) {
    const webhook = this.webhooks.get(webhookId);
    if (webhook) {
      this.webhooks.delete(webhookId);
      logInfo(`Webhook unregistered: ${webhookId}`);
      return true;
    }
    return false;
  }

  // Get webhook by ID
  getWebhook(webhookId) {
    return this.webhooks.get(webhookId);
  }

  // Get all webhooks
  getAllWebhooks() {
    return Array.from(this.webhooks.values());
  }

  // Get webhooks for specific event
  getWebhooksForEvent(event) {
    return Array.from(this.webhooks.values()).filter(webhook => 
      webhook.isActive && webhook.events.includes(event)
    );
  }

  // Trigger webhook
  async triggerWebhook(webhookId, event, data) {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook || !webhook.isActive) {
      return { success: false, error: 'Webhook not found or inactive' };
    }

    if (!webhook.events.includes(event)) {
      return { success: false, error: 'Event not subscribed to this webhook' };
    }

    const payload = this.buildPayload(event, data);
    const signature = this.generateSignature(payload, webhook.secret);

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'WA-Gateway-Webhook/1.0',
      'X-Webhook-Event': event,
      'X-Webhook-Signature': signature,
      'X-Webhook-Timestamp': Date.now().toString()
    };

    try {
      const response = await this.sendWebhookRequest(webhook.url, payload, headers);
      
      // Update webhook stats
      webhook.lastTriggered = new Date();
      webhook.failureCount = 0;

      logInfo(`Webhook triggered successfully: ${webhookId} for event: ${event}`);
      return { success: true, response };

    } catch (error) {
      // Update failure count
      webhook.failureCount++;
      
      logError(error, `Webhook trigger failed: ${webhookId} for event: ${event}`);
      return { success: false, error: error.message };
    }
  }

  // Trigger webhooks for an event
  async triggerWebhooksForEvent(event, data) {
    const webhooks = this.getWebhooksForEvent(event);
    const results = [];

    for (const webhook of webhooks) {
      const result = await this.triggerWebhook(webhook.id, event, data);
      results.push({
        webhookId: webhook.id,
        url: webhook.url,
        ...result
      });
    }

    logInfo(`Triggered ${webhooks.length} webhooks for event: ${event}`);
    return results;
  }

  // Send webhook request with retry logic
  async sendWebhookRequest(url, payload, headers, attempt = 1) {
    try {
      const response = await axios.post(url, payload, {
        headers,
        timeout: this.timeout,
        validateStatus: () => true // Don't throw on HTTP error status
      });

      // Check if response is successful (2xx status)
      if (response.status >= 200 && response.status < 300) {
        return response;
      }

      // If not successful and we have retry attempts left
      if (attempt < this.retryAttempts) {
        logInfo(`Webhook request failed (attempt ${attempt}/${this.retryAttempts}), retrying in ${this.retryDelay}ms`);
        await this.delay(this.retryDelay);
        return this.sendWebhookRequest(url, payload, headers, attempt + 1);
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    } catch (error) {
      // If it's a network error and we have retry attempts left
      if (attempt < this.retryAttempts && this.isRetryableError(error)) {
        logInfo(`Webhook request failed (attempt ${attempt}/${this.retryAttempts}), retrying in ${this.retryDelay}ms`);
        await this.delay(this.retryDelay);
        return this.sendWebhookRequest(url, payload, headers, attempt + 1);
      }

      throw error;
    }
  }

  // Check if error is retryable
  isRetryableError(error) {
    return (
      error.code === 'ECONNRESET' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNABORTED' ||
      (error.response && error.response.status >= 500)
    );
  }

  // Build webhook payload
  buildPayload(event, data) {
    return {
      event,
      timestamp: new Date().toISOString(),
      data,
      webhook_id: data.webhookId || null
    };
  }

  // Generate webhook signature
  generateSignature(payload, secret) {
    if (!secret) return null;
    
    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
  }

  // Verify webhook signature
  verifySignature(payload, signature, secret) {
    if (!secret || !signature) return false;
    
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  // Delay function for retry logic
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Test webhook
  async testWebhook(webhookId) {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      return { success: false, error: 'Webhook not found' };
    }

    const testData = {
      test: true,
      message: 'This is a test webhook from WA Gateway',
      timestamp: new Date().toISOString()
    };

    return await this.triggerWebhook(webhookId, 'test', testData);
  }

  // Get webhook statistics
  getWebhookStats() {
    const webhooks = Array.from(this.webhooks.values());
    
    return {
      total: webhooks.length,
      active: webhooks.filter(w => w.isActive).length,
      inactive: webhooks.filter(w => !w.isActive).length,
      byEvent: this.getEventStats(webhooks),
      recentFailures: webhooks.filter(w => w.failureCount > 0).length
    };
  }

  // Get event statistics
  getEventStats(webhooks) {
    const eventStats = {};
    
    webhooks.forEach(webhook => {
      webhook.events.forEach(event => {
        if (!eventStats[event]) {
          eventStats[event] = 0;
        }
        eventStats[event]++;
      });
    });

    return eventStats;
  }

  // Clean up inactive webhooks
  cleanupInactiveWebhooks(maxFailures = 10) {
    const inactiveWebhooks = Array.from(this.webhooks.values())
      .filter(webhook => webhook.failureCount >= maxFailures);

    inactiveWebhooks.forEach(webhook => {
      webhook.isActive = false;
      logInfo(`Webhook deactivated due to failures: ${webhook.id}`);
    });

    return inactiveWebhooks.length;
  }

  // Reactivate webhook
  reactivateWebhook(webhookId) {
    const webhook = this.webhooks.get(webhookId);
    if (webhook) {
      webhook.isActive = true;
      webhook.failureCount = 0;
      logInfo(`Webhook reactivated: ${webhookId}`);
      return true;
    }
    return false;
  }

  // Update webhook configuration
  updateWebhook(webhookId, updates) {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      return false;
    }

    // Update allowed fields
    const allowedFields = ['url', 'events', 'secret', 'isActive'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        webhook[field] = updates[field];
      }
    });

    webhook.updatedAt = new Date();
    logInfo(`Webhook updated: ${webhookId}`);
    return true;
  }

  // Validate webhook configuration
  validateWebhookConfig(config) {
    const errors = [];

    if (!config.url) {
      errors.push('URL is required');
    } else if (!this.isValidUrl(config.url)) {
      errors.push('Invalid URL format');
    }

    if (!config.events || !Array.isArray(config.events) || config.events.length === 0) {
      errors.push('At least one event must be specified');
    } else {
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
        'test'
      ];

      const invalidEvents = config.events.filter(event => !validEvents.includes(event));
      if (invalidEvents.length > 0) {
        errors.push(`Invalid events: ${invalidEvents.join(', ')}`);
      }
    }

    if (config.secret && config.secret.length < 10) {
      errors.push('Secret must be at least 10 characters long');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Validate URL format
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
}

module.exports = new WebhookService(); 
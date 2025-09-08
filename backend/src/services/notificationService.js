const nodemailer = require('nodemailer');
const { logInfo, logError } = require('../utils/logger');

class NotificationService {
  constructor() {
    this.emailTransporter = null;
    this.notificationQueue = [];
    this.isProcessing = false;
    this.initializeEmailTransporter();
  }

  // Initialize email transporter
  async initializeEmailTransporter() {
    try {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      // Verify connection
      await this.emailTransporter.verify();
      logInfo('Email transporter initialized successfully');
    } catch (error) {
      logError(error, 'Failed to initialize email transporter');
      this.emailTransporter = null;
    }
  }

  // Send notification
  async sendNotification(notificationData) {
    try {
      const {
        type,
        recipient,
        subject,
        message,
        data = {},
        channels = ['email'],
        priority = 'normal'
      } = notificationData;

      // Validate notification data
      this.validateNotificationData(notificationData);

      // Add to queue for processing
      const notification = {
        id: this.generateNotificationId(),
        type,
        recipient,
        subject,
        message,
        data,
        channels,
        priority,
        status: 'pending',
        created_at: new Date()
      };

      this.notificationQueue.push(notification);

      // Process queue if not already processing
      if (!this.isProcessing) {
        this.processQueue();
      }

      logInfo(`Notification queued: ${notification.id}`, {
        type,
        recipient,
        channels
      });

      return {
        success: true,
        notification_id: notification.id,
        status: 'queued'
      };

    } catch (error) {
      logError(error, 'Error sending notification');
      throw error;
    }
  }

  // Process notification queue
  async processQueue() {
    if (this.isProcessing || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.notificationQueue.length > 0) {
        const notification = this.notificationQueue.shift();
        
        try {
          await this.processNotification(notification);
        } catch (error) {
          logError(error, `Error processing notification: ${notification.id}`);
          notification.status = 'failed';
          notification.error = error.message;
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  // Process single notification
  async processNotification(notification) {
    const { channels, type, recipient, subject, message, data } = notification;

    notification.status = 'processing';

    // Process each channel
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmailNotification(notification);
            break;
          case 'push':
            await this.sendPushNotification(notification);
            break;
          case 'sms':
            await this.sendSMSNotification(notification);
            break;
          case 'webhook':
            await this.sendWebhookNotification(notification);
            break;
          default:
            logError(new Error(`Unknown notification channel: ${channel}`));
        }
      } catch (error) {
        logError(error, `Failed to send ${channel} notification`);
        notification.channel_errors = notification.channel_errors || {};
        notification.channel_errors[channel] = error.message;
      }
    }

    // Update status
    notification.status = 'sent';
    notification.sent_at = new Date();

    logInfo(`Notification processed: ${notification.id}`, {
      type,
      recipient,
      channels,
      status: notification.status
    });
  }

  // Send email notification
  async sendEmailNotification(notification) {
    if (!this.emailTransporter) {
      throw new Error('Email transporter not available');
    }

    const { recipient, subject, message, data } = notification;

    // Prepare email content
    const emailContent = this.formatEmailContent(message, data);
    const emailSubject = this.formatEmailSubject(subject, data);

    // Send email
    const result = await this.emailTransporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipient,
      subject: emailSubject,
      html: emailContent.html,
      text: emailContent.text
    });

    logInfo(`Email sent: ${result.messageId}`, {
      to: recipient,
      subject: emailSubject
    });

    return result;
  }

  // Send push notification
  async sendPushNotification(notification) {
    const { recipient, subject, message, data } = notification;

    // This would integrate with push notification services like FCM, APNS, etc.
    // For now, we'll just log the notification
    logInfo('Push notification would be sent', {
      recipient,
      subject,
      message,
      data
    });

    // TODO: Implement actual push notification logic
    // Example with Firebase Cloud Messaging:
    // const fcm = require('firebase-admin/messaging');
    // await fcm.send({
    //   token: recipient,
    //   notification: {
    //     title: subject,
    //     body: message
    //   },
    //   data: data
    // });

    return { success: true, channel: 'push' };
  }

  // Send SMS notification
  async sendSMSNotification(notification) {
    const { recipient, message, data } = notification;

    // This would integrate with SMS services like Twilio, etc.
    // For now, we'll just log the notification
    logInfo('SMS notification would be sent', {
      recipient,
      message,
      data
    });

    // TODO: Implement actual SMS logic
    // Example with Twilio:
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await client.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: recipient
    // });

    return { success: true, channel: 'sms' };
  }

  // Send webhook notification
  async sendWebhookNotification(notification) {
    const { recipient, data } = notification;

    // This would send HTTP POST to webhook URL
    // For now, we'll just log the notification
    logInfo('Webhook notification would be sent', {
      recipient,
      data
    });

    // TODO: Implement actual webhook logic
    // const axios = require('axios');
    // await axios.post(recipient, {
    //   timestamp: new Date().toISOString(),
    //   data: data
    // });

    return { success: true, channel: 'webhook' };
  }

  // Send system notifications
  async sendSystemNotification(type, data) {
    const notifications = {
      'device_connected': {
        subject: 'Device Connected',
        message: 'Your WhatsApp device has been successfully connected.',
        channels: ['email']
      },
      'device_disconnected': {
        subject: 'Device Disconnected',
        message: 'Your WhatsApp device has been disconnected.',
        channels: ['email']
      },
      'message_failed': {
        subject: 'Message Failed',
        message: 'A message failed to send. Please check your device connection.',
        channels: ['email']
      },
      'broadcast_completed': {
        subject: 'Broadcast Completed',
        message: 'Your broadcast has been completed successfully.',
        channels: ['email']
      },
      'template_approved': {
        subject: 'Template Approved',
        message: 'Your message template has been approved.',
        channels: ['email']
      },
      'template_rejected': {
        subject: 'Template Rejected',
        message: 'Your message template has been rejected.',
        channels: ['email']
      }
    };

    const notification = notifications[type];
    if (!notification) {
      throw new Error(`Unknown notification type: ${type}`);
    }

    return await this.sendNotification({
      type,
      recipient: data.user_email,
      subject: notification.subject,
      message: notification.message,
      data,
      channels: notification.channels
    });
  }

  // Format email content
  formatEmailContent(message, data) {
    // Replace variables in message
    let formattedMessage = message;
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      formattedMessage = formattedMessage.replace(regex, data[key]);
    });

    // Create HTML version
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #25D366; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>WA Gateway</h1>
            </div>
            <div class="content">
              <p>${formattedMessage.replace(/\n/g, '<br>')}</p>
            </div>
            <div class="footer">
              <p>This is an automated message from WA Gateway</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return {
      html: htmlContent,
      text: formattedMessage
    };
  }

  // Format email subject
  formatEmailSubject(subject, data) {
    let formattedSubject = subject;
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      formattedSubject = formattedSubject.replace(regex, data[key]);
    });
    return formattedSubject;
  }

  // Validate notification data
  validateNotificationData(data) {
    const { type, recipient, subject, message, channels } = data;

    if (!type) {
      throw new Error('Notification type is required');
    }

    if (!recipient) {
      throw new Error('Recipient is required');
    }

    if (!subject) {
      throw new Error('Subject is required');
    }

    if (!message) {
      throw new Error('Message is required');
    }

    if (channels && !Array.isArray(channels)) {
      throw new Error('Channels must be an array');
    }

    // Validate email format if email channel is used
    if (channels.includes('email')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipient)) {
        throw new Error('Invalid email format');
      }
    }
  }

  // Generate notification ID
  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get notification queue status
  getQueueStatus() {
    return {
      queue_length: this.notificationQueue.length,
      is_processing: this.isProcessing,
      pending: this.notificationQueue.filter(n => n.status === 'pending').length,
      processing: this.notificationQueue.filter(n => n.status === 'processing').length
    };
  }

  // Clear notification queue
  clearQueue() {
    this.notificationQueue = [];
    logInfo('Notification queue cleared');
  }
}

module.exports = new NotificationService(); 
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { logError, logInfo, logWarn } = require('../utils/logger');
const { Device } = require('../models');
const { generateUUID } = require('../utils/helpers');
const messageService = require('./messageService');
const socketService = require('./socketService');

class WhatsAppService {
  constructor() {
    this.connections = new Map(); // Store active connections
    this.sessionsPath = process.env.WHATSAPP_SESSION_PATH || './sessions';
    this.ensureSessionsDirectory();
  }

  // Ensure sessions directory exists
  ensureSessionsDirectory() {
    if (!fs.existsSync(this.sessionsPath)) {
      fs.mkdirSync(this.sessionsPath, { recursive: true });
    }
  }

  // Initialize WhatsApp connection for a device
  async initializeConnection(deviceId, userId) {
    try {
      logInfo(`Initializing WhatsApp connection for device: ${deviceId}`);

      // Check if device exists in database
      const device = await Device.findByPk(deviceId);
      if (!device) {
        logError(`Device not found in database: ${deviceId}`);
        throw new Error('Device not found');
      }

      logInfo(`Device found in database: ${deviceId}, current status: ${device.status}`);

      // Check if device belongs to user
      if (device.user_id !== userId) {
        logError(`Device ${deviceId} does not belong to user ${userId}`);
        throw new Error('Device does not belong to user');
      }

      // Update device status to connecting
      logInfo(`Updating device status to 'connecting': ${deviceId}`);
      await device.updateStatus('connecting');
      logInfo(`Device status updated successfully: ${deviceId}`);

      const sessionId = device.session_id || generateUUID();
      const sessionPath = path.join(this.sessionsPath, sessionId);
      
      logInfo(`Using session ID: ${sessionId}, session path: ${sessionPath}`);

      // Create session directory if it doesn't exist
      if (!fs.existsSync(sessionPath)) {
        logInfo(`Creating session directory: ${sessionPath}`);
        fs.mkdirSync(sessionPath, { recursive: true });
      }

      // Load or create auth state
      logInfo(`Loading auth state for session: ${sessionId}`);
      const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
      logInfo(`Auth state loaded successfully for session: ${sessionId}`);

      // Create WhatsApp socket
      logInfo(`Creating WhatsApp socket for device: ${deviceId}`);
      const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: {
          level: 'silent', // Suppress Baileys logs
          child: () => ({
            level: 'silent',
            trace: () => {},
            debug: () => {},
            info: () => {},
            warn: () => {},
            error: () => {},
            fatal: () => {}
          }),
          trace: () => {},
          debug: () => {},
          info: () => {},
          warn: () => {},
          error: () => {},
          fatal: () => {}
        }
      });
      logInfo(`WhatsApp socket created successfully for device: ${deviceId}`);

      // Store connection info
      const connectionInfo = {
        sock,
        deviceId,
        userId,
        sessionId,
        sessionPath,
        saveCreds,
        qrCode: null,
        isConnected: false,
        lastActivity: new Date()
      };

      this.connections.set(deviceId, connectionInfo);
      logInfo(`Connection info stored for device: ${deviceId}`);

      // Set up event handlers
      logInfo(`Setting up event handlers for device: ${deviceId}`);
      this.setupEventHandlers(connectionInfo);
      logInfo(`Event handlers set up successfully for device: ${deviceId}`);

      // Update device with session ID if not set
      if (!device.session_id) {
        logInfo(`Updating device with session ID: ${sessionId}`);
        await device.update({ session_id: sessionId });
        logInfo(`Device updated with session ID successfully: ${deviceId}`);
      }

      logInfo(`WhatsApp connection initialized successfully for device: ${deviceId}`);
      return { success: true, sessionId };

    } catch (error) {
      logError(error, `Error initializing WhatsApp connection for device: ${deviceId}`);
      await this.updateDeviceStatus(deviceId, 'error');
      throw error;
    }
  }

  // Set up event handlers for WhatsApp connection
  setupEventHandlers(connectionInfo) {
    const { sock, deviceId } = connectionInfo;

    // Connection update handler
    sock.ev.on('connection.update', async (update) => {
      try {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            // Generate QR code
            const qrCode = await qrcode.toDataURL(qr);
            connectionInfo.qrCode = qrCode;
            await this.updateDeviceQR(deviceId, qrCode);
            
            // Get device info for socket notification
            const device = await Device.findByPk(deviceId);
            if (device) {
              await socketService.handleDeviceConnection({
                userId: device.user_id,
                deviceId,
                status: 'qr_ready',
                qrCode
              });
            }
            
            logInfo(`QR code generated for device: ${deviceId}`);
          } catch (qrError) {
            logError(qrError, `Error generating QR code for device: ${deviceId}`);
          }
        }

        if (connection === 'close') {
          try {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom) && 
              lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut;

            if (shouldReconnect) {
              logWarn(`Connection closed for device: ${deviceId}, attempting to reconnect...`);
              await this.reconnectDevice(deviceId);
            } else {
              logInfo(`Connection closed for device: ${deviceId}, not reconnecting`);
              await this.updateDeviceStatus(deviceId, 'disconnected');
              
              // Get device info for socket notification
              const device = await Device.findByPk(deviceId);
              if (device) {
                await socketService.handleDeviceConnection({
                  userId: device.user_id,
                  deviceId,
                  status: 'disconnected'
                });
              }
              
              this.connections.delete(deviceId);
            }
          } catch (closeError) {
            logError(closeError, `Error handling connection close for device: ${deviceId}`);
          }
        }

        if (connection === 'open') {
          try {
            connectionInfo.isConnected = true;
            connectionInfo.qrCode = null;
            await this.updateDeviceStatus(deviceId, 'connected');
            
            // Get device info for socket notification
            const device = await Device.findByPk(deviceId);
            if (device) {
              await socketService.handleDeviceConnection({
                userId: device.user_id,
                deviceId,
                status: 'connected'
              });
            }
            
            logInfo(`WhatsApp connected for device: ${deviceId}`);
          } catch (openError) {
            logError(openError, `Error handling connection open for device: ${deviceId}`);
          }
        }

      } catch (error) {
        logError(error, `Error in connection update for device: ${deviceId}`);
      }
    });

    // Credentials update handler
    sock.ev.on('creds.update', async () => {
      try {
        await connectionInfo.saveCreds();
        logInfo(`Credentials saved for device: ${deviceId}`);
      } catch (error) {
        logError(error, `Error saving credentials for device: ${deviceId}`);
      }
    });

    // Messages handler
    sock.ev.on('messages.upsert', async (m) => {
      try {
        const messages = m.messages;
        for (const message of messages) {
          if (!message.key.fromMe) {
            await this.handleIncomingMessage(deviceId, message);
          }
        }
      } catch (error) {
        logError(error, `Error handling incoming message for device: ${deviceId}`);
      }
    });
  }

  // Handle incoming messages
  async handleIncomingMessage(deviceId, message) {
    try {
      logInfo(`Incoming message on device: ${deviceId}`, {
        from: message.key.remoteJid,
        type: message.message?.conversation || Object.keys(message.message || {})[0]
      });

      // Process message through message service
      const processedMessage = await messageService.handleIncomingMessage(deviceId, message);

      // Get device info for socket notification
      const device = await Device.findByPk(deviceId);
      if (device && processedMessage) {
        await socketService.handleNewMessage({
          userId: device.user_id,
          deviceId,
          message: processedMessage
        });
      }

    } catch (error) {
      logError(error, `Error handling incoming message for device: ${deviceId}`);
    }
  }

  // Send message
  async sendMessage(deviceId, to, message, options = {}) {
    try {
      const connection = this.connections.get(deviceId);
      if (!connection || !connection.isConnected) {
        throw new Error('Device not connected');
      }

      const { sock } = connection;

      // Format phone number
      const formattedNumber = this.formatPhoneNumber(to);

      // Prepare message data
      const messageData = {
        text: message.text || message,
        ...options
      };

      // Send message
      const result = await sock.sendMessage(`${formattedNumber}@s.whatsapp.net`, messageData);

      // Update last activity
      connection.lastActivity = new Date();

      logInfo(`Message sent successfully from device: ${deviceId}`, {
        to: formattedNumber,
        messageId: result.key.id
      });

      return {
        success: true,
        messageId: result.key.id,
        timestamp: new Date()
      };

    } catch (error) {
      logError(error, `Error sending message from device: ${deviceId}`);
      throw error;
    }
  }

  // Send media message
  async sendMediaMessage(deviceId, to, mediaPath, caption = '', options = {}) {
    try {
      const connection = this.connections.get(deviceId);
      if (!connection || !connection.isConnected) {
        throw new Error('Device not connected');
      }

      const { sock } = connection;

      // Check if file exists
      if (!fs.existsSync(mediaPath)) {
        throw new Error('Media file not found');
      }

      // Read file
      const mediaBuffer = fs.readFileSync(mediaPath);
      const mimeType = this.getMimeType(mediaPath);

      // Prepare media message
      const mediaMessage = {
        [this.getMediaType(mimeType)]: mediaBuffer,
        caption: caption,
        ...options
      };

      // Format phone number
      const formattedNumber = this.formatPhoneNumber(to);

      // Send media message
      const result = await sock.sendMessage(`${formattedNumber}@s.whatsapp.net`, mediaMessage);

      // Update last activity
      connection.lastActivity = new Date();

      logInfo(`Media message sent successfully from device: ${deviceId}`, {
        to: formattedNumber,
        messageId: result.key.id,
        mediaType: this.getMediaType(mimeType)
      });

      return {
        success: true,
        messageId: result.key.id,
        timestamp: new Date()
      };

    } catch (error) {
      logError(error, `Error sending media message from device: ${deviceId}`);
      throw error;
    }
  }

  // Get connection status
  async getConnectionStatus(deviceId) {
    const connection = this.connections.get(deviceId);
    if (!connection) {
      return { connected: false, status: 'disconnected' };
    }

    return {
      connected: connection.isConnected,
      status: connection.isConnected ? 'connected' : 'connecting',
      lastActivity: connection.lastActivity,
      qrCode: connection.qrCode
    };
  }

  // Disconnect device
  async disconnectDevice(deviceId) {
    try {
      const connection = this.connections.get(deviceId);
      if (!connection) {
        return { success: true, message: 'Device not connected' };
      }

      const { sock } = connection;

      // Close connection
      await sock.logout();
      sock.end();

      // Remove from connections map
      this.connections.delete(deviceId);

      // Update device status
      await this.updateDeviceStatus(deviceId, 'disconnected');

      logInfo(`Device disconnected: ${deviceId}`);
      return { success: true, message: 'Device disconnected successfully' };

    } catch (error) {
      logError(error, `Error disconnecting device: ${deviceId}`);
      throw error;
    }
  }

  // Reconnect device
  async reconnectDevice(deviceId) {
    try {
      const connection = this.connections.get(deviceId);
      if (!connection) {
        throw new Error('Device connection not found');
      }

      // Disconnect first
      await this.disconnectDevice(deviceId);

      // Reinitialize connection
      await this.initializeConnection(deviceId, connection.userId);

      logInfo(`Device reconnected: ${deviceId}`);
      return { success: true, message: 'Device reconnected successfully' };

    } catch (error) {
      logError(error, `Error reconnecting device: ${deviceId}`);
      throw error;
    }
  }

  // Get all connected devices
  getConnectedDevices() {
    const devices = [];
    for (const [deviceId, connection] of this.connections) {
      if (connection.isConnected) {
        devices.push({
          deviceId,
          userId: connection.userId,
          sessionId: connection.sessionId,
          lastActivity: connection.lastActivity
        });
      }
    }
    return devices;
  }

  // Update device status in database
  async updateDeviceStatus(deviceId, status) {
    try {
      const device = await Device.findByPk(deviceId);
      if (device) {
        await device.updateStatus(status);
      }
    } catch (error) {
      logError(error, `Error updating device status: ${deviceId}`);
    }
  }

  // Update device QR code in database
  async updateDeviceQR(deviceId, qrCode) {
    try {
      const device = await Device.findByPk(deviceId);
      if (device) {
        await device.setQRCode(qrCode);
      }
    } catch (error) {
      logError(error, `Error updating device QR code: ${deviceId}`);
    }
  }

  // Utility methods
  formatPhoneNumber(phone) {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle Indonesian numbers
    if (cleaned.startsWith('62')) {
      return cleaned;
    } else if (cleaned.startsWith('0')) {
      return '62' + cleaned.substring(1);
    } else if (cleaned.startsWith('8')) {
      return '62' + cleaned;
    }
    
    return cleaned;
  }

  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.avi': 'video/avi',
      '.mov': 'video/mov',
      '.mp3': 'audio/mp3',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  getMediaType(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'document';
    return 'document';
  }

  // Cleanup method for graceful shutdown
  async cleanup() {
    try {
      logInfo('Cleaning up WhatsApp connections...');
      
      for (const [deviceId] of this.connections) {
        await this.disconnectDevice(deviceId);
      }
      
      logInfo('WhatsApp service cleanup completed');
    } catch (error) {
      logError(error, 'Error during WhatsApp service cleanup');
    }
  }
}

// Create singleton instance
const whatsappService = new WhatsAppService();

module.exports = whatsappService; 
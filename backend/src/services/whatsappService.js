const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { logError, logInfo, logWarn } = require('../utils/logger');
const { Device } = require('../models');
const { generateUUID } = require('../utils/helpers');
// Lazy load messageService to avoid circular dependency
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

      // Check if device is already connecting or connected
      const existingConnection = this.connections.get(deviceId);
      if (existingConnection) {
        // Check if connection is still active and connected
        if (existingConnection.isConnected) {
          logWarn(`Device ${deviceId} is already connected, cannot initialize new connection`);
          throw new Error('Device is already connected');
        }
        
        // If connecting, check how long it's been connecting
        const connectingDuration = Date.now() - existingConnection.connectionStartTime.getTime();
        const connectingTimeout = 120000; // 2 minutes
        
        if (device.status === 'connecting' && connectingDuration < connectingTimeout) {
          logInfo(`Device ${deviceId} is still connecting (${Math.round(connectingDuration/1000)}s), waiting...`);
          // Don't disconnect, just return the existing connection
          return { success: true, sessionId: existingConnection.sessionId, alreadyConnecting: true };
        }
        
        logInfo(`Device ${deviceId} has stale connection, cleaning up first...`);
        try {
          await this.disconnectDevice(deviceId);
          // Wait a bit for cleanup to complete
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (cleanupError) {
          logWarn(`Error during cleanup of existing connection: ${cleanupError.message}`);
        }
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

      // Create WhatsApp socket with Baileys 7.x compatible configuration
      logInfo(`Creating WhatsApp socket for device: ${deviceId}`);
      const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        // Browser identification - required for Baileys 7.x
        browser: ['KlikWhatsApp', 'Chrome', '1.0.0'],
        
        // Logger - Baileys 7.x expects proper logger structure
        logger: {
          level: 'silent', // Use silent and handle manually
          child: () => ({
            level: 'silent',
            trace: () => {},
            debug: () => {},
            info: () => {},
            warn: (msg, meta) => {
              logWarn(`Baileys warn [${deviceId}]: ${msg}`, meta);
            },
            error: (msg, meta) => {
              logError(new Error(`Baileys error [${deviceId}]: ${msg}`), 'Baileys', meta);
            },
            fatal: (msg, meta) => {
              logError(new Error(`Baileys fatal [${deviceId}]: ${msg}`), 'Baileys', meta);
            }
          }),
          trace: () => {},
          debug: () => {},
          info: () => {},
          warn: (msg, meta) => {
            logWarn(`Baileys warn [${deviceId}]: ${msg}`, meta);
          },
          error: (msg, meta) => {
            logError(new Error(`Baileys error [${deviceId}]: ${msg}`), 'Baileys', meta);
          },
          fatal: (msg, meta) => {
            logError(new Error(`Baileys fatal [${deviceId}]: ${msg}`), 'Baileys', meta);
          }
        },
        
        // Connection settings for Baileys 7.x
        connectTimeoutMs: 120000, // 2 minutes
        defaultQueryTimeoutMs: 60000, // 1 minute for queries
        keepAliveIntervalMs: 10000, // 10 seconds
        
        // Message retry settings
        retryRequestDelayMs: 250,
        maxMsgRetryCount: 5,
        
        // QR code timeout - important for connection
        qrTimeout: 120000, // 2 minutes
        
        // Connection behavior
        markOnlineOnConnect: false,
        
        // Message handling - Baileys 7.x requires proper implementation
        shouldSyncHistoryMessage: () => false,
        shouldIgnoreJid: (jid) => false,
        
        // getMessage - Required in Baileys 7.x to handle message decryption
        // Return undefined to skip message fetching during connection
        getMessage: async (key) => {
          // During connection, don't try to fetch messages
          // This helps avoid connection issues
          return undefined;
        },
        
        // Additional Baileys 7.x options
        generateHighQualityLinkPreview: true
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
        lastActivity: new Date(),
        qrGenerated: false,
        connectionStartTime: new Date()
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

    // Connection update handler - Baileys 7.x compatible
    sock.ev.on('connection.update', async (update) => {
      try {
        const { connection, lastDisconnect, qr, isNewLogin, isOnline, receiveTimeout } = update;

        // Enhanced logging for debugging
        logInfo(`[${deviceId}] Connection update:`, {
          connection,
          isOnline,
          isNewLogin,
          hasQR: !!qr,
          hasLastDisconnect: !!lastDisconnect,
          receiveTimeout
        });

        if (lastDisconnect) {
          logWarn(`[${deviceId}] Last disconnect info:`, {
            error: lastDisconnect.error?.message,
            output: lastDisconnect.error?.output,
            statusCode: lastDisconnect.error?.output?.statusCode
          });
        }

        // Handle QR code - Baileys 7.x may send QR multiple times
        if (qr) {
          try {
            logInfo(`[${deviceId}] QR code received, length: ${qr.length}, generating data URL...`);
            
            // Generate QR code with better options
            const qrCode = await qrcode.toDataURL(qr, {
              errorCorrectionLevel: 'M',
              type: 'image/png',
              quality: 0.92,
              margin: 1,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              }
            });
            
            logInfo(`[${deviceId}] QR code generated successfully, length: ${qrCode.length}`);
            
            connectionInfo.qrCode = qrCode;
            connectionInfo.qrGenerated = true;
            connectionInfo.lastQRTime = new Date();
            
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
              logInfo(`[${deviceId}] QR code notification sent to frontend`);
            } else {
              logWarn(`[${deviceId}] Device not found when sending QR code notification`);
            }
            
            logInfo(`[${deviceId}] QR code process completed successfully`);
          } catch (qrError) {
            logError(qrError, `[${deviceId}] Error generating QR code`);
            // Try to emit error status
            try {
              const device = await Device.findByPk(deviceId);
              if (device) {
                await socketService.handleDeviceConnection({
                  userId: device.user_id,
                  deviceId,
                  status: 'error',
                  error: 'Failed to generate QR code'
                });
              }
            } catch (emitError) {
              logError(emitError, `[${deviceId}] Error emitting QR generation failure`);
            }
          }
        }

        if (connection === 'close') {
          try {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = (lastDisconnect?.error instanceof Boom) && 
              statusCode !== DisconnectReason.loggedOut;

            logWarn(`[${deviceId}] ========== CONNECTION CLOSED ==========`);
            logWarn(`[${deviceId}] Status code: ${statusCode}`);
            logWarn(`[${deviceId}] Error message:`, lastDisconnect?.error?.message || 'No error');
            logWarn(`[${deviceId}] Should reconnect: ${shouldReconnect}`);
            
            // Check if device was in the middle of pairing (had QR generated)
            const wasPairing = connectionInfo.qrGenerated && !connectionInfo.isConnected;
            if (wasPairing) {
              logWarn(`[${deviceId}] Connection closed during QR pairing process!`);
            }

            // Handle different disconnect reasons
            if (statusCode === DisconnectReason.loggedOut) {
              logInfo(`Device ${deviceId} logged out, clearing session...`);
              // Remove connection but keep session for re-authentication
              this.connections.delete(deviceId);
              await this.updateDeviceStatus(deviceId, 'disconnected');
              
              const device = await Device.findByPk(deviceId);
              if (device) {
                await socketService.handleDeviceConnection({
                  userId: device.user_id,
                  deviceId,
                  status: 'disconnected'
                });
              }
            } else if (statusCode === DisconnectReason.badSession) {
              logWarn(`Bad session for device ${deviceId}, clearing and allowing reconnect...`);
              // Clear bad session but don't delete connection info immediately
              connectionInfo.isConnected = false;
              connectionInfo.qrCode = null;
              await this.updateDeviceStatus(deviceId, 'error');
              
              const device = await Device.findByPk(deviceId);
              if (device) {
                await socketService.handleDeviceConnection({
                  userId: device.user_id,
                  deviceId,
                  status: 'error',
                  error: 'Session invalid, please try connecting again'
                });
              }
              
              // Remove connection to allow fresh start
              this.connections.delete(deviceId);
            } else if (shouldReconnect) {
              logWarn(`Connection closed for device: ${deviceId}, attempting to reconnect...`);
              // Don't delete connection yet, let reconnect handle it
              try {
                await this.reconnectDevice(deviceId);
              } catch (reconnectError) {
                logError(reconnectError, `Reconnection failed for device: ${deviceId}`);
                await this.updateDeviceStatus(deviceId, 'error');
                this.connections.delete(deviceId);
              }
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
            // Ensure connection is removed on error
            try {
              this.connections.delete(deviceId);
              await this.updateDeviceStatus(deviceId, 'error');
            } catch (cleanupError) {
              logError(cleanupError, `Error in cleanup after connection close error`);
            }
          }
        }

        // Handle connection open - Baileys 7.x compatible
        if (connection === 'open') {
          try {
            logInfo(`[${deviceId}] ========== CONNECTION OPENED ==========`);
            logInfo(`[${deviceId}] Connection details: isOnline=${isOnline}, isNewLogin=${isNewLogin}`);
            
            // Save credentials one more time to ensure they're persisted
            try {
              await connectionInfo.saveCreds();
              logInfo(`[${deviceId}] Credentials saved after connection open`);
            } catch (credsError) {
              logWarn(`[${deviceId}] Could not save credentials after open (non-critical):`, credsError.message);
            }
            
            connectionInfo.isConnected = true;
            connectionInfo.qrCode = null;
            connectionInfo.qrGenerated = false;
            
            // Clear QR code from database
            await this.clearDeviceQR(deviceId);
            logInfo(`[${deviceId}] QR code cleared from database`);
            
            // Update device status to connected
            await this.updateDeviceStatus(deviceId, 'connected');
            logInfo(`[${deviceId}] Device status updated to connected`);
            
            // Get device info for socket notification
            const device = await Device.findByPk(deviceId);
            if (device) {
              await socketService.handleDeviceConnection({
                userId: device.user_id,
                deviceId,
                status: 'connected'
              });
              logInfo(`[${deviceId}] Connection notification sent to frontend`);
            } else {
              logWarn(`[${deviceId}] Device not found when sending connection notification`);
            }
            
            logInfo(`[${deviceId}] ========== CONNECTION PROCESS COMPLETE ==========`);
          } catch (openError) {
            logError(openError, `[${deviceId}] Error handling connection open`);
            // Emit error status
            try {
              const device = await Device.findByPk(deviceId);
              if (device) {
                await socketService.handleDeviceConnection({
                  userId: device.user_id,
                  deviceId,
                  status: 'error',
                  error: 'Connection opened but failed to update status'
                });
              }
            } catch (emitError) {
              logError(emitError, `[${deviceId}] Error emitting connection open error`);
            }
          }
        }

        // Handle connection state changes - Baileys 7.x may use 'connecting' state
        if (connection === 'connecting') {
          logInfo(`Device ${deviceId} is connecting...`);
          // Don't change status here, wait for 'open' or QR
        }

      } catch (error) {
        logError(error, `Error in connection update for device: ${deviceId}`);
      }
    });

    // Credentials update handler - Critical for connection after QR scan
    sock.ev.on('creds.update', async () => {
      try {
        logInfo(`[${deviceId}] Credentials update event received, saving...`);
        await connectionInfo.saveCreds();
        logInfo(`[${deviceId}] Credentials saved successfully`);
        
        // Update device status after credentials saved (means pairing is progressing)
        const device = await Device.findByPk(deviceId);
        if (device && device.status === 'connecting') {
          logInfo(`[${deviceId}] Device is pairing, credentials saved - waiting for connection open...`);
        }
      } catch (error) {
        logError(error, `[${deviceId}] Error saving credentials`);
        // This is critical - if credentials can't be saved, connection will fail
        try {
          const device = await Device.findByPk(deviceId);
          if (device) {
            await socketService.handleDeviceConnection({
              userId: device.user_id,
              deviceId,
              status: 'error',
              error: 'Failed to save credentials after QR scan'
            });
          }
        } catch (emitError) {
          logError(emitError, `[${deviceId}] Error emitting credentials save failure`);
        }
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
      // Lazy load messageService to avoid circular dependency
      const messageService = require('./messageService');
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
      let connection = this.connections.get(deviceId);
      if (!connection || !connection.isConnected) {
        // Try to auto-reconnect using stored session
        try {
          const device = await Device.findByPk(deviceId);
          if (device) {
            await this.initializeConnection(deviceId, device.user_id);
            // wait briefly for open state
            const waitUntil = Date.now() + 10000; // 10s
            while (Date.now() < waitUntil) {
              const st = await this.getConnectionStatus(deviceId);
              if (st.connected) break;
              await new Promise(r => setTimeout(r, 500));
            }
          }
        } catch (_) { /* ignore */ }
        connection = this.connections.get(deviceId);
      }
      if (!connection || !connection.isConnected) throw new Error('Device not connected');

      const { sock } = connection;

      // Format phone number
      const formattedNumber = this.formatPhoneNumber(to);

      // Prepare message data
      let messageData;
      if (typeof message === 'object' && (message.image || message.video || message.audio || message.document)) {
        // Already structured media payload
        messageData = { ...message };
      } else if (typeof message === 'object' && message.sections) {
        // List message
        messageData = {
          text: message.text || 'Choose an option',
          ...(message.title && { title: message.title }),
          ...(message.footer && { footer: message.footer }),
          buttonText: message.buttonText || 'Select',
          sections: message.sections
        };
      } else if (typeof message === 'object' && message.templateButtons) {
        // Template buttons
        messageData = {
          text: message.text || '',
          templateButtons: message.templateButtons
        };
      } else {
        messageData = { text: message.text || message, ...options };
      }

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
  async sendMediaMessage(deviceId, to, mediaPathOrBuffer, caption = '', options = {}) {
    try {
      let connection = this.connections.get(deviceId);
      if (!connection || !connection.isConnected) {
        // Try to auto-reconnect using stored session
        try {
          const device = await Device.findByPk(deviceId);
          if (device) {
            await this.initializeConnection(deviceId, device.user_id);
            const waitUntil = Date.now() + 10000;
            while (Date.now() < waitUntil) {
              const st = await this.getConnectionStatus(deviceId);
              if (st.connected) break;
              await new Promise(r => setTimeout(r, 500));
            }
          }
        } catch (_) { /* ignore */ }
        connection = this.connections.get(deviceId);
      }
      if (!connection || !connection.isConnected) throw new Error('Device not connected');

      const { sock } = connection;

      // Format phone number
      const formattedNumber = this.formatPhoneNumber(to);

      let messageData;

      // Handle buffer (from URL download)
      if (Buffer.isBuffer(mediaPathOrBuffer)) {
        const mimeType = options.mimeType || 'image/jpeg';
        
        // Determine message type based on MIME type
        if (mimeType.startsWith('image/')) {
          messageData = {
            image: mediaPathOrBuffer,
            caption: caption,
            mimetype: mimeType,
            ...options
          };
        } else if (mimeType.startsWith('video/')) {
          messageData = {
            video: mediaPathOrBuffer,
            caption: caption,
            mimetype: mimeType,
            ...options
          };
        } else if (mimeType.startsWith('audio/')) {
          messageData = {
            audio: mediaPathOrBuffer,
            mimetype: mimeType,
            ...options
          };
        } else {
          // For documents (PDF, DOC, etc.)
          const fileName = options.fileName || 'document';
          messageData = {
            document: mediaPathOrBuffer,
            caption: caption,
            mimetype: mimeType,
            fileName: fileName,
            ...options
          };
        }
      } else {
        // Handle file path
        const fs = require('fs');
        const path = require('path');
        
        if (!fs.existsSync(mediaPathOrBuffer)) {
          throw new Error(`Media file not found: ${mediaPathOrBuffer}`);
        }

        const fileExtension = path.extname(mediaPathOrBuffer).toLowerCase();
        const mimeType = options.mimeType || this.getMimeTypeFromExtension(fileExtension);

        if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(fileExtension)) {
          messageData = {
            image: fs.readFileSync(mediaPathOrBuffer),
            caption: caption,
            mimetype: mimeType,
            ...options
          };
        } else if (['.mp4', '.avi', '.mov', '.mkv'].includes(fileExtension)) {
          messageData = {
            video: fs.readFileSync(mediaPathOrBuffer),
            caption: caption,
            mimetype: mimeType,
            ...options
          };
        } else if (['.mp3', '.wav', '.ogg', '.m4a'].includes(fileExtension)) {
          messageData = {
            audio: fs.readFileSync(mediaPathOrBuffer),
            mimetype: mimeType,
            ...options
          };
        } else {
          // Default to document
          messageData = {
            document: fs.readFileSync(mediaPathOrBuffer),
            caption: caption,
            mimetype: mimeType,
            fileName: path.basename(mediaPathOrBuffer),
            ...options
          };
        }
      }

      // Send media message
      const result = await sock.sendMessage(`${formattedNumber}@s.whatsapp.net`, messageData);

      // Update last activity
      connection.lastActivity = new Date();

      logInfo(`Media message sent successfully from device: ${deviceId}`, {
        to: formattedNumber,
        messageId: result.key.id,
        mediaType: messageData.image ? 'image' : messageData.video ? 'video' : messageData.audio ? 'audio' : 'document'
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

  // Helper method to get MIME type from file extension
  getMimeTypeFromExtension(extension) {
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.mkv': 'video/x-matroska',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/mp4',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain'
    };
    
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
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
        logInfo(`Device ${deviceId} not in connections map, updating status to disconnected`);
        await this.updateDeviceStatus(deviceId, 'disconnected');
        return { success: true, message: 'Device not connected' };
      }

      const { sock, sessionPath } = connection;

      // Close connection gracefully
      try {
        logInfo(`Logging out device: ${deviceId}`);
        await sock.logout();
        sock.end();
      } catch (logoutError) {
        // Handle case where connection is already closed
        if (logoutError.message === 'Connection Closed' || 
            logoutError.output?.statusCode === 428 ||
            logoutError.message?.includes('Connection Closed')) {
          logInfo(`Device connection already closed: ${deviceId}`);
          // Force end the socket if logout fails
          try {
            sock.end();
          } catch (endError) {
            // Ignore end errors
          }
        } else {
          logWarn(`Logout error for device ${deviceId}: ${logoutError.message}`);
          // Force end the socket anyway
          try {
            sock.end();
          } catch (endError) {
            // Ignore end errors
          }
        }
      }

      // Check device status before cleaning up session
      try {
        const device = await Device.findByPk(deviceId);
        const shouldCleanupSession = device && device.status !== 'connecting';
        
        if (shouldCleanupSession && sessionPath && fs.existsSync(sessionPath)) {
          logInfo(`Cleaning up session files for device: ${deviceId} (status: ${device.status})`);
          // Remove session files to ensure clean reconnection
          const files = fs.readdirSync(sessionPath);
          for (const file of files) {
            const filePath = path.join(sessionPath, file);
            try {
              fs.unlinkSync(filePath);
            } catch (unlinkError) {
              logWarn(`Could not remove session file ${file}: ${unlinkError.message}`);
            }
          }
          // Remove the session directory
          try {
            fs.rmdirSync(sessionPath);
          } catch (rmdirError) {
            logWarn(`Could not remove session directory: ${rmdirError.message}`);
          }
        } else if (device && device.status === 'connecting') {
          logInfo(`Skipping session cleanup for device ${deviceId} - still connecting`);
        }
      } catch (cleanupError) {
        logWarn(`Error checking device status before cleanup: ${cleanupError.message}`);
      }

      // Remove from connections map
      this.connections.delete(deviceId);

      // Update device status and clear QR code
      await this.updateDeviceStatus(deviceId, 'disconnected');
      await this.clearDeviceQR(deviceId);

      logInfo(`Device disconnected and cleaned up: ${deviceId}`);
      return { success: true, message: 'Device disconnected successfully' };

    } catch (error) {
      logError(error, `Error disconnecting device: ${deviceId}`);
      // Ensure device is marked as disconnected even if cleanup fails
      try {
        await this.updateDeviceStatus(deviceId, 'disconnected');
        this.connections.delete(deviceId);
      } catch (fallbackError) {
        logError(fallbackError, `Error in fallback disconnect for device: ${deviceId}`);
      }
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

      // Disconnect first (handle gracefully if already disconnected)
      try {
        await this.disconnectDevice(deviceId);
      } catch (disconnectError) {
        // If disconnect fails, still try to reconnect
        logInfo(`Disconnect failed during reconnect, continuing: ${deviceId}`);
        // Clean up connection from map if it exists
        this.connections.delete(deviceId);
      }

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

  // Clear device QR code
  async clearDeviceQR(deviceId) {
    try {
      const device = await Device.findByPk(deviceId);
      if (device) {
        await device.clearQRCode();
        logInfo(`QR code cleared for device: ${deviceId}`);
      }
    } catch (error) {
      logError(error, `Error clearing QR code for device: ${deviceId}`);
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
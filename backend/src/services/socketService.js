const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { logError, logInfo } = require('../utils/logger');
const webhookService = require('./webhookService');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socket
    this.userRooms = new Map(); // userId -> room names
    this.deviceConnections = new Map(); // deviceId -> socket
  }

  // Initialize Socket.io server
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Authentication middleware
    this.io.use(this.authenticateSocket.bind(this));

    // Connection handler
    this.io.on('connection', this.handleConnection.bind(this));

    logInfo('Socket.io server initialized');
  }

  // Authenticate socket connection
  async authenticateSocket(socket, next) {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Remove 'Bearer ' prefix if present
      const cleanToken = token.replace('Bearer ', '');
      
      // Verify JWT token
      const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
      
      // Attach user info to socket
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      
      next();
    } catch (error) {
      logError(error, 'Socket authentication failed');
      next(new Error('Authentication failed'));
    }
  }

  // Handle socket connection
  handleConnection(socket) {
    const userId = socket.userId;
    const userRole = socket.userRole;

    logInfo(`Socket connected: ${socket.id} for user: ${userId}`);

    // Store user connection
    this.connectedUsers.set(userId, socket);
    
    // Join user's personal room
    const userRoom = `user:${userId}`;
    socket.join(userRoom);
    this.userRooms.set(userId, userRoom);

    // Join role-based room
    const roleRoom = `role:${userRole}`;
    socket.join(roleRoom);

    // Send connection confirmation
    socket.emit('connected', {
      userId,
      userRole,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });

    // Handle device connection
    socket.on('join_device', (deviceId) => {
      this.handleDeviceJoin(socket, deviceId);
    });

    // Handle device disconnection
    socket.on('leave_device', (deviceId) => {
      this.handleDeviceLeave(socket, deviceId);
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      this.handleTyping(socket, data);
    });

    // Handle message read receipt
    socket.on('message_read', (data) => {
      this.handleMessageRead(socket, data);
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      this.handleDisconnect(socket, reason);
    });

    // Handle error
    socket.on('error', (error) => {
      logError(error, `Socket error for user: ${userId}`);
    });
  }

  // Handle device join
  handleDeviceJoin(socket, deviceId) {
    const userId = socket.userId;
    const deviceRoom = `device:${deviceId}`;
    
    socket.join(deviceRoom);
    this.deviceConnections.set(deviceId, socket);
    
    logInfo(`User ${userId} joined device room: ${deviceId}`);
    
    socket.emit('device_joined', {
      deviceId,
      timestamp: new Date().toISOString()
    });
  }

  // Handle device leave
  handleDeviceLeave(socket, deviceId) {
    const userId = socket.userId;
    const deviceRoom = `device:${deviceId}`;
    
    socket.leave(deviceRoom);
    this.deviceConnections.delete(deviceId);
    
    logInfo(`User ${userId} left device room: ${deviceId}`);
    
    socket.emit('device_left', {
      deviceId,
      timestamp: new Date().toISOString()
    });
  }

  // Handle typing indicator
  handleTyping(socket, data) {
    const { deviceId, toNumber, isTyping } = data;
    const deviceRoom = `device:${deviceId}`;
    
    socket.to(deviceRoom).emit('typing_indicator', {
      deviceId,
      fromNumber: socket.userId,
      toNumber,
      isTyping,
      timestamp: new Date().toISOString()
    });
  }

  // Handle message read receipt
  handleMessageRead(socket, data) {
    const { messageId, deviceId } = data;
    const deviceRoom = `device:${deviceId}`;
    
    socket.to(deviceRoom).emit('message_read_receipt', {
      messageId,
      deviceId,
      readBy: socket.userId,
      timestamp: new Date().toISOString()
    });
  }

  // Handle disconnect
  handleDisconnect(socket, reason) {
    const userId = socket.userId;
    
    // Remove from connected users
    this.connectedUsers.delete(userId);
    this.userRooms.delete(userId);
    
    // Remove from device connections
    for (const [deviceId, userSocket] of this.deviceConnections.entries()) {
      if (userSocket === socket) {
        this.deviceConnections.delete(deviceId);
        break;
      }
    }
    
    logInfo(`Socket disconnected: ${socket.id} for user: ${userId}, reason: ${reason}`);
  }

  // Emit to specific user
  emitToUser(userId, event, data) {
    const socket = this.connectedUsers.get(userId);
    if (socket) {
      socket.emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Emit to user room
  emitToUserRoom(userId, event, data) {
    const userRoom = this.userRooms.get(userId);
    if (userRoom) {
      this.io.to(userRoom).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Emit to device room
  emitToDevice(deviceId, event, data) {
    const deviceRoom = `device:${deviceId}`;
    this.io.to(deviceRoom).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // Emit to role-based room
  emitToRole(role, event, data) {
    const roleRoom = `role:${role}`;
    this.io.to(roleRoom).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // Emit to all connected users
  emitToAll(event, data) {
    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // Handle new message
  async handleNewMessage(messageData) {
    const { userId, deviceId, message } = messageData;
    
    // Emit to user
    this.emitToUserRoom(userId, 'new_message', {
      type: 'received',
      deviceId,
      message
    });

    // Emit to device room
    this.emitToDevice(deviceId, 'message_received', {
      message
    });

    // Trigger webhooks
    await webhookService.queueWebhook(userId, 'message.received', {
      userId,
      deviceId,
      message
    });

    logInfo(`New message notification sent for user: ${userId}, device: ${deviceId}`);
  }

  // Handle message sent
  async handleMessageSent(messageData) {
    const { userId, deviceId, message } = messageData;
    
    // Emit to user
    this.emitToUserRoom(userId, 'new_message', {
      type: 'sent',
      deviceId,
      message
    });

    // Emit to device room
    this.emitToDevice(deviceId, 'message_sent', {
      message
    });

    // Trigger webhooks
    await webhookService.queueWebhook(userId, 'message.sent', {
      userId,
      deviceId,
      message
    });

    logInfo(`Message sent notification for user: ${userId}, device: ${deviceId}`);
  }

  // Handle device connection status
  async handleDeviceConnection(deviceData) {
    const { userId, deviceId, status, qrCode } = deviceData;
    
    logInfo(`Handling device connection: ${deviceId} - ${status} for user: ${userId}`);
    
    // Emit to user
    this.emitToUserRoom(userId, 'device_status', {
      deviceId,
      status,
      qrCode
    });

    // Emit to device room
    this.emitToDevice(deviceId, 'connection_status', {
      deviceId,
      status,
      qrCode
    });

    // Backward-compatibility events for existing frontend listeners
    try {
      if (status === 'qr_ready' && qrCode) {
        logInfo(`Emitting QR event for device: ${deviceId}`);
        this.emitToUserRoom(userId, 'device:qr', {
          deviceId,
          qrCode
        });
        this.emitToDevice(deviceId, 'device:qr', {
          deviceId,
          qrCode
        });
      } else if (status === 'connected') {
        logInfo(`Emitting connected event for device: ${deviceId}`);
        this.emitToUserRoom(userId, 'device:connected', { deviceId });
        this.emitToDevice(deviceId, 'device:connected', { deviceId });
      } else if (status === 'disconnected') {
        logInfo(`Emitting disconnected event for device: ${deviceId}`);
        this.emitToUserRoom(userId, 'device:disconnected', { deviceId });
        this.emitToDevice(deviceId, 'device:disconnected', { deviceId });
      }
    } catch (error) {
      logError(error, `Error emitting backward-compatibility events for device: ${deviceId}`);
    }

    // Trigger webhooks based on status
    if (status === 'connected') {
      await webhookService.queueWebhook(userId, 'device.connected', {
        userId,
        deviceId
      });
    } else if (status === 'disconnected') {
      await webhookService.queueWebhook(userId, 'device.disconnected', {
        userId,
        deviceId
      });
    } else if (status === 'qr_ready' && qrCode) {
      await webhookService.queueWebhook(userId, 'device.qr_generated', {
        userId,
        deviceId,
        qrCode
      });
    }

    logInfo(`Device status update: ${deviceId} - ${status}`);
  }

  // Handle contact events
  async handleContactEvent(eventData) {
    const { userId, contact, event } = eventData;
    
    // Emit to user
    this.emitToUserRoom(userId, 'contact_event', {
      event,
      contact
    });

    // Trigger webhooks
    await webhookService.queueWebhook(userId, `contact.${event}`, {
      userId,
      contact
    });

    logInfo(`Contact event: ${event} for user: ${userId}`);
  }

  // Handle system notification
  handleSystemNotification(notificationData) {
    const { type, message, target, data } = notificationData;
    
    switch (target) {
      case 'user':
        this.emitToUser(data.userId, 'system_notification', {
          type,
          message,
          data
        });
        break;
      case 'role':
        this.emitToRole(data.role, 'system_notification', {
          type,
          message,
          data
        });
        break;
      case 'device':
        this.emitToDevice(data.deviceId, 'system_notification', {
          type,
          message,
          data
        });
        break;
      case 'all':
        this.emitToAll('system_notification', {
          type,
          message,
          data
        });
        break;
    }

    logInfo(`System notification sent: ${type} - ${message}`);
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get connected devices count
  getConnectedDevicesCount() {
    return this.deviceConnections.size;
  }

  // Get user connection status
  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }

  // Get device connection status
  isDeviceConnected(deviceId) {
    return this.deviceConnections.has(deviceId);
  }

  // Get connection statistics
  getConnectionStats() {
    return {
      totalUsers: this.connectedUsers.size,
      totalDevices: this.deviceConnections.size,
      connectedUsers: Array.from(this.connectedUsers.keys()),
      connectedDevices: Array.from(this.deviceConnections.keys())
    };
  }

  // Broadcast message to all connected users
  broadcastMessage(message, data = {}) {
    this.emitToAll('broadcast', {
      message,
      ...data
    });
  }

  // Send notification to specific users
  sendNotification(userIds, notification) {
    userIds.forEach(userId => {
      this.emitToUser(userId, 'notification', notification);
    });
  }

  // Handle file upload progress
  handleFileUploadProgress(userId, fileId, progress) {
    this.emitToUser(userId, 'file_upload_progress', {
      fileId,
      progress
    });
  }

  // Handle file upload complete
  handleFileUploadComplete(userId, fileData) {
    this.emitToUser(userId, 'file_upload_complete', {
      file: fileData
    });
  }

  // Handle file upload error
  handleFileUploadError(userId, fileId, error) {
    this.emitToUser(userId, 'file_upload_error', {
      fileId,
      error: error.message
    });
  }
}

module.exports = new SocketService(); 
const { ApiKey } = require('../models');
const { logError, logInfo } = require('../utils/logger');

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map();

// Clean up rate limit store every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.timestamp > 3600000) { // 1 hour
      rateLimitStore.delete(key);
    }
  }
}, 3600000);

const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key is required',
        error: 'MISSING_API_KEY'
      });
    }

    // Find API key
    logInfo(`Looking for API key: ${apiKey.substring(0, 8)}...`, 'API_AUTH_DEBUG');
    const keyData = await ApiKey.findByKey(apiKey);
    
    if (!keyData) {
      logError(`API key not found: ${apiKey.substring(0, 8)}...`, 'API_AUTH_DEBUG');
      return res.status(401).json({
        success: false,
        message: 'Invalid API key',
        error: 'INVALID_API_KEY'
      });
    }
    
    logInfo(`API key found: ${keyData.key_prefix}...`, 'API_AUTH_DEBUG');

    // Check if API key is active
    if (!keyData.is_active) {
      return res.status(401).json({
        success: false,
        message: 'API key is disabled',
        error: 'API_KEY_DISABLED'
      });
    }

    // Check if API key is expired
    if (keyData.isExpired()) {
      return res.status(401).json({
        success: false,
        message: 'API key has expired',
        error: 'API_KEY_EXPIRED'
      });
    }

    // Check IP whitelist
    const clientIp = req.ip || req.connection.remoteAddress;
    if (!keyData.isIpAllowed(clientIp)) {
      logError(`API key access denied for IP: ${clientIp}`, 'API_AUTH');
      return res.status(403).json({
        success: false,
        message: 'Access denied from this IP address',
        error: 'IP_NOT_ALLOWED'
      });
    }

    // Rate limiting
    const rateLimitKey = `${keyData.id}_${Math.floor(Date.now() / 3600000)}`; // Per hour
    const currentUsage = rateLimitStore.get(rateLimitKey) || { count: 0, timestamp: Date.now() };
    
    if (currentUsage.count >= keyData.rate_limit) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded',
        error: 'RATE_LIMIT_EXCEEDED',
        retry_after: 3600 // 1 hour
      });
    }

    // Update rate limit counter
    currentUsage.count++;
    rateLimitStore.set(rateLimitKey, currentUsage);

    // Update last used timestamp
    await keyData.update({ last_used_at: new Date() });

    // Get user data
    const { User, Device } = require('../models');
    const user = await User.findByPk(keyData.user_id);
    // If key is bound to a device, fetch minimal device info
    let boundDevice = null;
    if (keyData.device_id) {
      boundDevice = await Device.findByPk(keyData.device_id, { attributes: ['id', 'name', 'status', 'user_id'] });
    }
    
    // Attach data to request
    req.apiKey = keyData;
    req.user = user;
    req.boundDevice = boundDevice;
    req.rateLimitInfo = {
      current: currentUsage.count,
      limit: keyData.rate_limit,
      reset: Math.floor(Date.now() / 3600000) * 3600000 + 3600000
    };

    logInfo(`API key authenticated: ${keyData.key_prefix}... for user: ${keyData.user_id}`, 'API_AUTH');
    next();

  } catch (error) {
    logError(error, 'API_AUTH_ERROR');
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: 'AUTH_ERROR'
    });
  }
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.apiKey) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'AUTH_REQUIRED'
      });
    }

    if (!req.apiKey.canAccess(permission)) {
      return res.status(403).json({
        success: false,
        message: `Permission denied: ${permission} required`,
        error: 'PERMISSION_DENIED'
      });
    }

    next();
  };
};

const requireReadPermission = requirePermission('read');
const requireWritePermission = requirePermission('write');
const requireAdminPermission = requirePermission('admin');

module.exports = {
  authenticateApiKey,
  requireReadPermission,
  requireWritePermission,
  requireAdminPermission
}; 
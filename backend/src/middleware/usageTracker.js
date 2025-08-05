const { ApiUsage } = require('../models');
const { logInfo } = require('../utils/logger');

const trackApiUsage = async (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;
  const originalJson = res.json;

  // Override res.send to capture response
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    const responseSize = Buffer.byteLength(data, 'utf8');
    
    // Track usage asynchronously (don't block response)
    trackUsageAsync(req, res, responseTime, responseSize, data);
    
    return originalSend.call(this, data);
  };

  // Override res.json to capture response
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    const responseSize = Buffer.byteLength(JSON.stringify(data), 'utf8');
    
    // Track usage asynchronously (don't block response)
    trackUsageAsync(req, res, responseTime, responseSize, data);
    
    return originalJson.call(this, data);
  };

  next();
};

const trackUsageAsync = async (req, res, responseTime, responseSize, responseData) => {
  try {
    // Only track if we have API key info
    if (!req.apiKey || !req.user) {
      return;
    }

    const requestSize = req.headers['content-length'] ? parseInt(req.headers['content-length']) : 0;
    const statusCode = res.statusCode;
    const endpoint = req.originalUrl;
    const method = req.method;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Determine if there's an error
    let errorMessage = null;
    if (statusCode >= 400) {
      if (typeof responseData === 'object' && responseData.message) {
        errorMessage = responseData.message;
      } else if (typeof responseData === 'string') {
        errorMessage = responseData;
      }
    }

    // Create usage record
    await ApiUsage.create({
      api_key_id: req.apiKey.id,
      user_id: req.user.id,
      endpoint: endpoint,
      method: method,
      status_code: statusCode,
      response_time: responseTime,
      request_size: requestSize,
      response_size: responseSize,
      ip_address: ipAddress,
      user_agent: userAgent,
      error_message: errorMessage,
      metadata: {
        rate_limit_info: req.rateLimitInfo,
        user_agent: userAgent,
        referer: req.headers.referer,
        origin: req.headers.origin
      }
    });

    logInfo(`API usage tracked: ${method} ${endpoint} - ${statusCode} (${responseTime}ms)`, 'USAGE_TRACKER');

  } catch (error) {
    // Don't let tracking errors affect the API response
    logInfo(`Failed to track API usage: ${error.message}`, 'USAGE_TRACKER_ERROR');
  }
};

module.exports = {
  trackApiUsage
}; 
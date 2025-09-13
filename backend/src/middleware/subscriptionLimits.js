const { UserSubscription, SubscriptionPlan, Device, Message, ApiUsage } = require('../models');
const { logError, logInfo } = require('../utils/logger');

// Get user's current subscription and limits
const getUserLimits = async (userId) => {
  try {
    const subscription = await UserSubscription.findOne({
      where: { 
        user_id: userId,
        status: ['active', 'trialing']
      },
      include: [{
        model: SubscriptionPlan,
        as: 'plan'
      }]
    });

    if (!subscription) {
      // Return free plan limits if no subscription
      return {
        messages_per_month: 1000,
        devices: 1,
        api_requests_per_month: 500,
        attachments: false,
        autoreply: false,
        remove_watermark: false
      };
    }

    return subscription.plan.limits;
  } catch (error) {
    logError(error, 'Get user limits error');
    return null;
  }
};

// Check if user has reached message limit
const checkMessageLimit = async (userId) => {
  try {
    const limits = await getUserLimits(userId);
    if (!limits) return { allowed: false, reason: 'Unable to check limits' };

    // Unlimited messages
    if (limits.messages_per_month === -1) {
      return { allowed: true };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const messageCount = await Message.count({
      where: {
        user_id: userId,
        created_at: {
          [require('sequelize').Op.gte]: startOfMonth
        }
      }
    });

    if (messageCount >= limits.messages_per_month) {
      return { 
        allowed: false, 
        reason: `Message limit reached (${messageCount}/${limits.messages_per_month})`,
        current: messageCount,
        limit: limits.messages_per_month
      };
    }

    return { 
      allowed: true, 
      current: messageCount, 
      limit: limits.messages_per_month 
    };
  } catch (error) {
    logError(error, 'Check message limit error');
    return { allowed: false, reason: 'Error checking message limit' };
  }
};

// Check if user has reached device limit
const checkDeviceLimit = async (userId) => {
  try {
    const limits = await getUserLimits(userId);
    if (!limits) return { allowed: false, reason: 'Unable to check limits' };

    const deviceCount = await Device.count({
      where: { user_id: userId }
    });

    if (deviceCount >= limits.devices) {
      return { 
        allowed: false, 
        reason: `Device limit reached (${deviceCount}/${limits.devices})`,
        current: deviceCount,
        limit: limits.devices
      };
    }

    return { 
      allowed: true, 
      current: deviceCount, 
      limit: limits.devices 
    };
  } catch (error) {
    logError(error, 'Check device limit error');
    return { allowed: false, reason: 'Error checking device limit' };
  }
};

// Check if user has reached API request limit
const checkApiLimit = async (userId) => {
  try {
    const limits = await getUserLimits(userId);
    if (!limits) return { allowed: false, reason: 'Unable to check limits' };

    // Unlimited API requests
    if (limits.api_requests_per_month === -1) {
      return { allowed: true };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const apiCount = await ApiUsage.count({
      where: {
        user_id: userId,
        created_at: {
          [require('sequelize').Op.gte]: startOfMonth
        }
      }
    });

    if (apiCount >= limits.api_requests_per_month) {
      return { 
        allowed: false, 
        reason: `API request limit reached (${apiCount}/${limits.api_requests_per_month})`,
        current: apiCount,
        limit: limits.api_requests_per_month
      };
    }

    return { 
      allowed: true, 
      current: apiCount, 
      limit: limits.api_requests_per_month 
    };
  } catch (error) {
    logError(error, 'Check API limit error');
    return { allowed: false, reason: 'Error checking API limit' };
  }
};

// Check if user has access to a specific feature
const checkFeatureAccess = async (userId, feature) => {
  try {
    const limits = await getUserLimits(userId);
    if (!limits) return { allowed: false, reason: 'Unable to check limits' };

    const hasAccess = limits[feature] === true;
    
    return { 
      allowed: hasAccess, 
      reason: hasAccess ? 'Feature available' : `Feature not available in current plan`
    };
  } catch (error) {
    logError(error, 'Check feature access error');
    return { allowed: false, reason: 'Error checking feature access' };
  }
};

// Middleware to check message limits before sending
const enforceMessageLimit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limitCheck = await checkMessageLimit(userId);

    if (!limitCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: limitCheck.reason,
        error: 'MESSAGE_LIMIT_EXCEEDED',
        data: {
          current: limitCheck.current,
          limit: limitCheck.limit
        }
      });
    }

    // Add limit info to request for logging
    req.messageLimit = limitCheck;
    next();
  } catch (error) {
    logError(error, 'Enforce message limit middleware error');
    res.status(500).json({
      success: false,
      message: 'Error checking message limits'
    });
  }
};

// Middleware to check device limits before creating device
const enforceDeviceLimit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limitCheck = await checkDeviceLimit(userId);

    if (!limitCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: limitCheck.reason,
        error: 'DEVICE_LIMIT_EXCEEDED',
        data: {
          current: limitCheck.current,
          limit: limitCheck.limit
        }
      });
    }

    req.deviceLimit = limitCheck;
    next();
  } catch (error) {
    logError(error, 'Enforce device limit middleware error');
    res.status(500).json({
      success: false,
      message: 'Error checking device limits'
    });
  }
};

// Middleware to check API limits
const enforceApiLimit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limitCheck = await checkApiLimit(userId);

    if (!limitCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: limitCheck.reason,
        error: 'API_LIMIT_EXCEEDED',
        data: {
          current: limitCheck.current,
          limit: limitCheck.limit
        }
      });
    }

    req.apiLimit = limitCheck;
    next();
  } catch (error) {
    logError(error, 'Enforce API limit middleware error');
    res.status(500).json({
      success: false,
      message: 'Error checking API limits'
    });
  }
};

// Middleware to check feature access
const enforceFeatureAccess = (feature) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const accessCheck = await checkFeatureAccess(userId, feature);

      if (!accessCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: accessCheck.reason,
          error: 'FEATURE_NOT_AVAILABLE',
          feature: feature
        });
      }

      next();
    } catch (error) {
      logError(error, 'Enforce feature access middleware error');
      res.status(500).json({
        success: false,
        message: 'Error checking feature access'
      });
    }
  };
};

module.exports = {
  getUserLimits,
  checkMessageLimit,
  checkDeviceLimit,
  checkApiLimit,
  checkFeatureAccess,
  enforceMessageLimit,
  enforceDeviceLimit,
  enforceApiLimit,
  enforceFeatureAccess
};

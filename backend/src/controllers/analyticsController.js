const { ApiUsage, ApiKey, User, Message, Device, Invoice, sequelize } = require('../models');
const { logError, logInfo } = require('../utils/logger');
const { Op } = require('sequelize');

// Get user analytics overview
const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30d' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get API usage stats
    const apiUsageStats = await ApiUsage.findAll({
      where: {
        user_id: userId,
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_requests'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 END')), 'successful_requests'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status_code >= 400 THEN 1 END')), 'failed_requests'],
        [sequelize.fn('AVG', sequelize.col('response_time')), 'avg_response_time'],
        [sequelize.fn('SUM', sequelize.col('request_size')), 'total_request_size'],
        [sequelize.fn('SUM', sequelize.col('response_size')), 'total_response_size']
      ],
      raw: true
    });

    // Get message stats
    const messageStats = await Message.findAll({
      where: {
        user_id: userId,
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_messages'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = "sent" THEN 1 END')), 'sent_messages'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = "failed" THEN 1 END')), 'failed_messages'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN direction = "outbound" THEN 1 END')), 'outbound_messages'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN direction = "inbound" THEN 1 END')), 'inbound_messages']
      ],
      raw: true
    });

    // Get device stats
    const deviceStats = await Device.findAll({
      where: {
        user_id: userId
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_devices'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = "connected" THEN 1 END')), 'connected_devices'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = "disconnected" THEN 1 END')), 'disconnected_devices']
      ],
      raw: true
    });

    // Get daily usage for chart
    const dailyUsage = await ApiUsage.findAll({
      where: {
        user_id: userId,
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'requests'],
        [sequelize.fn('AVG', sequelize.col('response_time')), 'avg_response_time']
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      raw: true
    });

    // Get top endpoints
    const topEndpoints = await ApiUsage.findAll({
      where: {
        user_id: userId,
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        'endpoint',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('response_time')), 'avg_response_time']
      ],
      group: ['endpoint'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

    const stats = {
      period: period,
      date_range: {
        start: startDate,
        end: endDate
      },
      api_usage: apiUsageStats[0] || {
        total_requests: 0,
        successful_requests: 0,
        failed_requests: 0,
        avg_response_time: 0,
        total_request_size: 0,
        total_response_size: 0
      },
      messages: messageStats[0] || {
        total_messages: 0,
        sent_messages: 0,
        failed_messages: 0,
        outbound_messages: 0,
        inbound_messages: 0
      },
      devices: deviceStats[0] || {
        total_devices: 0,
        connected_devices: 0,
        disconnected_devices: 0
      },
      daily_usage: dailyUsage,
      top_endpoints: topEndpoints
    };

    // Calculate success rate
    if (stats.api_usage.total_requests > 0) {
      stats.api_usage.success_rate = (stats.api_usage.successful_requests / stats.api_usage.total_requests * 100).toFixed(2);
    } else {
      stats.api_usage.success_rate = 0;
    }

    if (stats.messages.total_messages > 0) {
      stats.messages.success_rate = (stats.messages.sent_messages / stats.messages.total_messages * 100).toFixed(2);
    } else {
      stats.messages.success_rate = 0;
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logError(error, 'Get User Analytics Error');
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get API key specific analytics
const getApiKeyAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { apiKeyId } = req.params;
    const { period = '30d' } = req.query;

    // Verify API key belongs to user
    const apiKey = await ApiKey.findOne({
      where: { id: apiKeyId, user_id: userId }
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get usage stats for this API key
    const usageStats = await ApiUsage.findAll({
      where: {
        api_key_id: apiKeyId,
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_requests'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 END')), 'successful_requests'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status_code >= 400 THEN 1 END')), 'failed_requests'],
        [sequelize.fn('AVG', sequelize.col('response_time')), 'avg_response_time'],
        [sequelize.fn('SUM', sequelize.col('request_size')), 'total_request_size'],
        [sequelize.fn('SUM', sequelize.col('response_size')), 'total_response_size']
      ],
      raw: true
    });

    // Get daily usage
    const dailyUsage = await ApiUsage.findAll({
      where: {
        api_key_id: apiKeyId,
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'requests'],
        [sequelize.fn('AVG', sequelize.col('response_time')), 'avg_response_time']
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      raw: true
    });

    // Get endpoint breakdown
    const endpointBreakdown = await ApiUsage.findAll({
      where: {
        api_key_id: apiKeyId,
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        'endpoint',
        'method',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('response_time')), 'avg_response_time'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 END')), 'success_count'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status_code >= 400 THEN 1 END')), 'error_count']
      ],
      group: ['endpoint', 'method'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      raw: true
    });

    // Get recent activity
    const recentActivity = await ApiUsage.findAll({
      where: {
        api_key_id: apiKeyId
      },
      attributes: [
        'endpoint',
        'method',
        'status_code',
        'response_time',
        'ip_address',
        'created_at'
      ],
      order: [['created_at', 'DESC']],
      limit: 20,
      raw: true
    });

    const stats = {
      api_key: {
        id: apiKey.id,
        name: apiKey.name,
        key_prefix: apiKey.key_prefix,
        permissions: apiKey.permissions,
        rate_limit: apiKey.rate_limit,
        is_active: apiKey.is_active
      },
      period: period,
      date_range: {
        start: startDate,
        end: endDate
      },
      usage: usageStats[0] || {
        total_requests: 0,
        successful_requests: 0,
        failed_requests: 0,
        avg_response_time: 0,
        total_request_size: 0,
        total_response_size: 0
      },
      daily_usage: dailyUsage,
      endpoint_breakdown: endpointBreakdown,
      recent_activity: recentActivity
    };

    // Calculate success rate
    if (stats.usage.total_requests > 0) {
      stats.usage.success_rate = (stats.usage.successful_requests / stats.usage.total_requests * 100).toFixed(2);
    } else {
      stats.usage.success_rate = 0;
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logError(error, 'Get API Key Analytics Error');
    res.status(500).json({
      success: false,
      message: 'Failed to get API key analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get real-time analytics
const getRealTimeAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current hour stats
    const now = new Date();
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0);
    const hourEnd = new Date(hourStart.getTime() + 3600000);

    const currentHourStats = await ApiUsage.findAll({
      where: {
        user_id: userId,
        created_at: {
          [Op.between]: [hourStart, hourEnd]
        }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'requests'],
        [sequelize.fn('AVG', sequelize.col('response_time')), 'avg_response_time'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status_code >= 400 THEN 1 END')), 'errors']
      ],
      raw: true
    });

    // Get last 24 hours hourly breakdown
    const last24Hours = [];
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - (i * 3600000));
      const hourEnd = new Date(hourStart.getTime() + 3600000);
      
      const hourStats = await ApiUsage.findAll({
        where: {
          user_id: userId,
          created_at: {
            [Op.between]: [hourStart, hourEnd]
          }
        },
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'requests'],
          [sequelize.fn('AVG', sequelize.col('response_time')), 'avg_response_time']
        ],
        raw: true
      });

      last24Hours.push({
        hour: hourStart.getHours(),
        timestamp: hourStart,
        requests: hourStats[0]?.requests || 0,
        avg_response_time: hourStats[0]?.avg_response_time || 0
      });
    }

    // Get active devices
    const activeDevices = await Device.count({
      where: {
        user_id: userId,
        status: 'connected'
      }
    });

    // Get recent messages
    const recentMessages = await Message.count({
      where: {
        user_id: userId,
        created_at: {
          [Op.gte]: new Date(now.getTime() - 3600000) // Last hour
        }
      }
    });

    const realTimeStats = {
      current_hour: currentHourStats[0] || {
        requests: 0,
        avg_response_time: 0,
        errors: 0
      },
      last_24_hours: last24Hours,
      active_devices: activeDevices,
      recent_messages: recentMessages,
      timestamp: now
    };

    res.json({
      success: true,
      data: realTimeStats
    });

  } catch (error) {
    logError(error, 'Get Real-time Analytics Error');
    res.status(500).json({
      success: false,
      message: 'Failed to get real-time analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get admin analytics overview
const getAdminAnalytics = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: true,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Get total users count
    const totalUsers = await User.count({
      where: {
        status: 'active'
      }
    });

    // Get new users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newUsersThisMonth = await User.count({
      where: {
        created_at: {
          [Op.gte]: startOfMonth
        }
      }
    });

    // Get device stats
    const deviceStats = await Device.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_devices'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = "connected" THEN 1 END')), 'active_devices']
      ],
      raw: true
    });

    // Get invoice stats
    const invoiceStats = await Invoice.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = "paid" THEN 1 END')), 'paid_invoices'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = "paid" THEN amount ELSE 0 END')), 'paid_amount'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = "pending" OR status = "overdue" THEN 1 END')), 'unpaid_invoices'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = "pending" OR status = "overdue" THEN amount ELSE 0 END')), 'unpaid_amount']
      ],
      raw: true
    });

    const stats = deviceStats[0] || { total_devices: 0, active_devices: 0 };
    const invoiceData = invoiceStats[0] || { 
      paid_invoices: 0, 
      paid_amount: 0, 
      unpaid_invoices: 0, 
      unpaid_amount: 0 
    };

    const adminData = {
      totalUsers,
      newUsersThisMonth,
      activeDevices: parseInt(stats.active_devices) || 0,
      totalDevices: parseInt(stats.total_devices) || 0,
      paidInvoices: parseInt(invoiceData.paid_invoices) || 0,
      paidAmount: parseInt(invoiceData.paid_amount) || 0,
      unpaidInvoices: parseInt(invoiceData.unpaid_invoices) || 0,
      unpaidAmount: parseInt(invoiceData.unpaid_amount) || 0
    };

    logInfo('Admin analytics fetched successfully', { userId: req.user.id });

    res.json({
      error: false,
      message: 'Admin analytics retrieved successfully',
      success: true,
      data: adminData
    });

  } catch (error) {
    logError(error, 'Admin Analytics');
    res.status(500).json({
      error: true,
      message: 'Failed to fetch admin analytics'
    });
  }
};

module.exports = {
  getUserAnalytics,
  getApiKeyAnalytics,
  getRealTimeAnalytics,
  getAdminAnalytics
}; 
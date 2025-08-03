const { Op } = require('sequelize');
const { Message, Device, Contact, User, Template } = require('../models');
const { logInfo, logError } = require('../utils/logger');

class AnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get message statistics for user
  async getMessageStats(userId, filters = {}) {
    try {
      const {
        device_id,
        date_from,
        date_to,
        message_type,
        status
      } = filters;

      let whereClause = { user_id: userId };

      // Apply filters
      if (device_id) {
        whereClause.device_id = device_id;
      }

      if (date_from || date_to) {
        whereClause.created_at = {};
        if (date_from) {
          whereClause.created_at[Op.gte] = new Date(date_from);
        }
        if (date_to) {
          whereClause.created_at[Op.lte] = new Date(date_to);
        }
      }

      if (message_type) {
        whereClause.message_type = message_type;
      }

      if (status) {
        whereClause.status = status;
      }

      // Get message counts by status
      const statusStats = await Message.findAll({
        where: whereClause,
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status']
      });

      // Get message counts by type
      const typeStats = await Message.findAll({
        where: whereClause,
        attributes: [
          'message_type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['message_type']
      });

      // Get total messages
      const totalMessages = await Message.count({ where: whereClause });

      // Get messages by date (last 30 days)
      const dateStats = await this.getMessagesByDate(userId, whereClause);

      return {
        total_messages: totalMessages,
        by_status: statusStats.reduce((acc, stat) => {
          acc[stat.status] = parseInt(stat.dataValues.count);
          return acc;
        }, {}),
        by_type: typeStats.reduce((acc, stat) => {
          acc[stat.message_type] = parseInt(stat.dataValues.count);
          return acc;
        }, {}),
        by_date: dateStats
      };

    } catch (error) {
      logError(error, 'Error getting message statistics');
      throw error;
    }
  }

  // Get device statistics
  async getDeviceStats(userId) {
    try {
      // Get device counts by status
      const deviceStats = await Device.findAll({
        where: { user_id: userId },
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status']
      });

      // Get total devices
      const totalDevices = await Device.count({ where: { user_id: userId } });

      // Get active devices (connected in last 24 hours)
      const activeDevices = await Device.count({
        where: {
          user_id: userId,
          last_activity: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      });

      return {
        total_devices: totalDevices,
        active_devices: activeDevices,
        by_status: deviceStats.reduce((acc, stat) => {
          acc[stat.status] = parseInt(stat.dataValues.count);
          return acc;
        }, {})
      };

    } catch (error) {
      logError(error, 'Error getting device statistics');
      throw error;
    }
  }

  // Get contact statistics
  async getContactStats(userId) {
    try {
      // Get total contacts
      const totalContacts = await Contact.count({ where: { user_id: userId } });

      // Get contacts by tags
      const tagStats = await Contact.findAll({
        where: { user_id: userId },
        attributes: [
          'tags',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['tags']
      });

      // Get contacts added in last 30 days
      const recentContacts = await Contact.count({
        where: {
          user_id: userId,
          created_at: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      });

      return {
        total_contacts: totalContacts,
        recent_contacts: recentContacts,
        by_tags: tagStats.reduce((acc, stat) => {
          const tags = stat.tags ? JSON.parse(stat.tags) : [];
          tags.forEach(tag => {
            acc[tag] = (acc[tag] || 0) + parseInt(stat.dataValues.count);
          });
          return acc;
        }, {})
      };

    } catch (error) {
      logError(error, 'Error getting contact statistics');
      throw error;
    }
  }

  // Get user activity report
  async getUserActivityReport(userId, period = '30d') {
    try {
      const days = this.getPeriodDays(period);
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Get daily message counts
      const dailyMessages = await Message.findAll({
        where: {
          user_id: userId,
          created_at: { [Op.gte]: startDate }
        },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: [sequelize.fn('DATE', sequelize.col('created_at'))],
        order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
      });

      // Get device activity
      const deviceActivity = await Device.findAll({
        where: {
          user_id: userId,
          last_activity: { [Op.gte]: startDate }
        },
        attributes: [
          'name',
          'last_activity',
          [sequelize.fn('COUNT', sequelize.col('messages.id')), 'message_count']
        ],
        include: [{
          model: Message,
          as: 'messages',
          attributes: [],
          where: {
            created_at: { [Op.gte]: startDate }
          }
        }],
        group: ['Device.id'],
        order: [['last_activity', 'DESC']]
      });

      return {
        period: period,
        daily_messages: dailyMessages.map(item => ({
          date: item.dataValues.date,
          count: parseInt(item.dataValues.count)
        })),
        device_activity: deviceActivity.map(device => ({
          name: device.name,
          last_activity: device.last_activity,
          message_count: parseInt(device.dataValues.message_count)
        }))
      };

    } catch (error) {
      logError(error, 'Error getting user activity report');
      throw error;
    }
  }

  // Get system performance metrics
  async getSystemMetrics() {
    try {
      const cacheKey = 'system_metrics';
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      // Get total users
      const totalUsers = await User.count();

      // Get total messages (last 24 hours)
      const messages24h = await Message.count({
        where: {
          created_at: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      });

      // Get total devices
      const totalDevices = await Device.count();

      // Get active devices
      const activeDevices = await Device.count({
        where: {
          last_activity: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      });

      // Get message success rate
      const totalMessages = await Message.count();
      const successfulMessages = await Message.count({
        where: { status: 'sent' }
      });

      const successRate = totalMessages > 0 ? (successfulMessages / totalMessages) * 100 : 0;

      const metrics = {
        total_users: totalUsers,
        total_devices: totalDevices,
        active_devices: activeDevices,
        messages_24h: messages24h,
        success_rate: Math.round(successRate * 100) / 100,
        timestamp: new Date()
      };

      this.setCachedData(cacheKey, metrics);
      return metrics;

    } catch (error) {
      logError(error, 'Error getting system metrics');
      throw error;
    }
  }

  // Get template usage statistics
  async getTemplateStats(userId) {
    try {
      // Get template counts by status
      const statusStats = await Template.findAll({
        where: { user_id: userId },
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status']
      });

      // Get most used templates
      const topTemplates = await Template.findAll({
        where: { user_id: userId },
        attributes: [
          'name',
          'usage_count',
          'category'
        ],
        order: [['usage_count', 'DESC']],
        limit: 10
      });

      // Get total usage
      const totalUsage = await Template.sum('usage_count', {
        where: { user_id: userId }
      });

      return {
        by_status: statusStats.reduce((acc, stat) => {
          acc[stat.status] = parseInt(stat.dataValues.count);
          return acc;
        }, {}),
        top_templates: topTemplates,
        total_usage: totalUsage || 0
      };

    } catch (error) {
      logError(error, 'Error getting template statistics');
      throw error;
    }
  }

  // Get messages by date for charting
  async getMessagesByDate(userId, whereClause) {
    const days = 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const dateStats = await Message.findAll({
      where: {
        ...whereClause,
        created_at: { [Op.gte]: startDate }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
    });

    return dateStats.map(item => ({
      date: item.dataValues.date,
      count: parseInt(item.dataValues.count)
    }));
  }

  // Get period days from string
  getPeriodDays(period) {
    const periods = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    return periods[period] || 30;
  }

  // Cache management
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = new AnalyticsService(); 
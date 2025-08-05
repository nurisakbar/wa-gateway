const { ApiKey } = require('../models');
const { logError, logInfo } = require('../utils/logger');

// Get all API keys for user
const getUserApiKeys = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const apiKeys = await ApiKey.findAll({
      where: { user_id: userId },
      attributes: [
        'id', 'name', 'key_prefix', 'permissions', 'rate_limit', 
        'is_active', 'last_used_at', 'expires_at', 'created_at'
      ],
      order: [['created_at', 'DESC']]
    });

    logInfo(`Retrieved ${apiKeys.length} API keys for user: ${userId}`, 'API_KEY');

    res.json({
      success: true,
      data: apiKeys
    });

  } catch (error) {
    logError(error, 'Get API Keys Error');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve API keys',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new API key
const createApiKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, permissions, rate_limit, ip_whitelist, expires_at } = req.body;

    // Validate input
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'API key name is required'
      });
    }

    // Check if name already exists for this user
    const existingKey = await ApiKey.findOne({
      where: { user_id: userId, name: name.trim() }
    });

    if (existingKey) {
      return res.status(400).json({
        success: false,
        message: 'API key with this name already exists'
      });
    }

    // Generate new API key
    const { apiKey, key } = ApiKey.generateNewKey(userId, name.trim(), permissions);

    // Set additional properties
    if (rate_limit) apiKey.rate_limit = rate_limit;
    if (ip_whitelist) apiKey.ip_whitelist = ip_whitelist;
    if (expires_at) apiKey.expires_at = new Date(expires_at);

    // Save to database
    await apiKey.save();

    logInfo(`Created new API key: ${apiKey.key_prefix}... for user: ${userId}`, 'API_KEY');

    res.status(201).json({
      success: true,
      message: 'API key created successfully',
      data: {
        id: apiKey.id,
        name: apiKey.name,
        key: key, // Only returned once
        key_prefix: apiKey.key_prefix,
        permissions: apiKey.permissions,
        rate_limit: apiKey.rate_limit,
        expires_at: apiKey.expires_at,
        created_at: apiKey.created_at
      }
    });

  } catch (error) {
    logError(error, 'Create API Key Error');
    res.status(500).json({
      success: false,
      message: 'Failed to create API key',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update API key
const updateApiKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, permissions, rate_limit, ip_whitelist, expires_at, is_active } = req.body;

    // Find API key
    const apiKey = await ApiKey.findOne({
      where: { id, user_id: userId }
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    // Update fields
    const updateData = {};
    
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'API key name cannot be empty'
        });
      }
      
      // Check if name already exists (excluding current key)
      const existingKey = await ApiKey.findOne({
        where: { 
          user_id: userId, 
          name: name.trim(),
          id: { [require('sequelize').Op.ne]: id }
        }
      });

      if (existingKey) {
        return res.status(400).json({
          success: false,
          message: 'API key with this name already exists'
        });
      }
      
      updateData.name = name.trim();
    }

    if (permissions !== undefined) updateData.permissions = permissions;
    if (rate_limit !== undefined) updateData.rate_limit = rate_limit;
    if (ip_whitelist !== undefined) updateData.ip_whitelist = ip_whitelist;
    if (expires_at !== undefined) updateData.expires_at = expires_at ? new Date(expires_at) : null;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Update API key
    await apiKey.update(updateData);

    logInfo(`Updated API key: ${apiKey.key_prefix}... for user: ${userId}`, 'API_KEY');

    res.json({
      success: true,
      message: 'API key updated successfully',
      data: {
        id: apiKey.id,
        name: apiKey.name,
        key_prefix: apiKey.key_prefix,
        permissions: apiKey.permissions,
        rate_limit: apiKey.rate_limit,
        ip_whitelist: apiKey.ip_whitelist,
        is_active: apiKey.is_active,
        expires_at: apiKey.expires_at,
        last_used_at: apiKey.last_used_at,
        updated_at: apiKey.updated_at
      }
    });

  } catch (error) {
    logError(error, 'Update API Key Error');
    res.status(500).json({
      success: false,
      message: 'Failed to update API key',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Regenerate API key
const regenerateApiKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Find API key
    const apiKey = await ApiKey.findOne({
      where: { id, user_id: userId }
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    // Generate new key
    const newKey = apiKey.generateKey();
    await apiKey.save();

    logInfo(`Regenerated API key: ${apiKey.key_prefix}... for user: ${userId}`, 'API_KEY');

    res.json({
      success: true,
      message: 'API key regenerated successfully',
      data: {
        id: apiKey.id,
        name: apiKey.name,
        key: newKey, // Only returned once
        key_prefix: apiKey.key_prefix,
        updated_at: apiKey.updated_at
      }
    });

  } catch (error) {
    logError(error, 'Regenerate API Key Error');
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate API key',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete API key
const deleteApiKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Find API key
    const apiKey = await ApiKey.findOne({
      where: { id, user_id: userId }
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    // Delete API key
    await apiKey.destroy();

    logInfo(`Deleted API key: ${apiKey.key_prefix}... for user: ${userId}`, 'API_KEY');

    res.json({
      success: true,
      message: 'API key deleted successfully'
    });

  } catch (error) {
    logError(error, 'Delete API Key Error');
    res.status(500).json({
      success: false,
      message: 'Failed to delete API key',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get specific API key
const getApiKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Find API key
    const apiKey = await ApiKey.findOne({
      where: { id, user_id: userId },
      attributes: [
        'id', 'name', 'key_prefix', 'permissions', 'rate_limit', 
        'is_active', 'last_used_at', 'expires_at', 'created_at', 'updated_at'
      ]
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    res.json({
      success: true,
      data: apiKey
    });

  } catch (error) {
    logError(error, 'Get API Key Error');
    res.status(500).json({
      success: false,
      message: 'Failed to get API key',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get API key usage statistics
const getApiKeyStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Find API key
    const apiKey = await ApiKey.findOne({
      where: { id, user_id: userId }
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    // Get usage statistics (this would be enhanced with actual usage tracking)
    const stats = {
      total_requests: 0, // Would be calculated from usage logs
      requests_today: 0,
      requests_this_month: 0,
      last_used: apiKey.last_used_at,
      rate_limit_used: 0, // Would be calculated from rate limit store
      rate_limit_remaining: apiKey.rate_limit
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logError(error, 'Get API Key Stats Error');
    res.status(500).json({
      success: false,
      message: 'Failed to get API key statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getUserApiKeys,
  createApiKey,
  getApiKey,
  updateApiKey,
  regenerateApiKey,
  deleteApiKey,
  getApiKeyStats
}; 
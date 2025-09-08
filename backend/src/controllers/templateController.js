const Template = require('../models/Template');
const { Op } = require('sequelize');

// Get all templates for a user
const getTemplates = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, status, search } = req.query;
    const userId = req.user.id;
    
    const whereClause = { user_id: userId };
    
    // Add filters
    if (category) {
      whereClause.category = category;
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const offset = (page - 1) * limit;
    
    const { count, rows: templates } = await Template.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: {
        templates,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates',
      error: error.message
    });
  }
};

// Get a single template
const getTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const template = await Template.findOne({
      where: { id, user_id: userId }
    });
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    res.json({
      success: true,
      data: { template }
    });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template',
      error: error.message
    });
  }
};

// Create a new template
const createTemplate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, category, language, content, variables, description } = req.body;
    
    // Validate required fields
    if (!name || !content) {
      return res.status(400).json({
        success: false,
        message: 'Name and content are required'
      });
    }
    
    // Check if template name already exists for this user
    const existingTemplate = await Template.findByUserAndName(userId, name);
    if (existingTemplate) {
      return res.status(409).json({
        success: false,
        message: 'Template name already exists'
      });
    }
    
    // Parse variables if provided as string
    let parsedVariables = variables;
    if (typeof variables === 'string') {
      try {
        parsedVariables = JSON.parse(variables);
      } catch (e) {
        parsedVariables = [];
      }
    }
    
    const template = await Template.create({
      user_id: userId,
      name,
      category: category || 'utility',
      language: language || 'en',
      content,
      variables: parsedVariables ? JSON.stringify(parsedVariables) : null,
      description,
      status: 'draft'
    });
    
    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: { template }
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create template',
      error: error.message
    });
  }
};

// Update a template
const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, category, language, content, variables, description, status } = req.body;
    
    const template = await Template.findOne({
      where: { id, user_id: userId }
    });
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    // Check if new name conflicts with existing template
    if (name && name !== template.name) {
      const existingTemplate = await Template.findByUserAndName(userId, name);
      if (existingTemplate) {
        return res.status(409).json({
          success: false,
          message: 'Template name already exists'
        });
      }
    }
    
    // Parse variables if provided as string
    let parsedVariables = variables;
    if (typeof variables === 'string') {
      try {
        parsedVariables = JSON.parse(variables);
      } catch (e) {
        parsedVariables = template.variables ? JSON.parse(template.variables) : [];
      }
    }
    
    await template.update({
      name: name || template.name,
      category: category || template.category,
      language: language || template.language,
      content: content || template.content,
      variables: parsedVariables ? JSON.stringify(parsedVariables) : template.variables,
      description: description !== undefined ? description : template.description,
      status: status || template.status
    });
    
    res.json({
      success: true,
      message: 'Template updated successfully',
      data: { template }
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update template',
      error: error.message
    });
  }
};

// Delete a template
const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const template = await Template.findOne({
      where: { id, user_id: userId }
    });
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    await template.destroy();
    
    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete template',
      error: error.message
    });
  }
};

// Submit template for approval
const submitForApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const template = await Template.findOne({
      where: { id, user_id: userId }
    });
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    if (template.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft templates can be submitted for approval'
      });
    }
    
    await template.update({ status: 'pending' });
    
    res.json({
      success: true,
      message: 'Template submitted for approval',
      data: { template }
    });
  } catch (error) {
    console.error('Submit template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit template',
      error: error.message
    });
  }
};

// Get template statistics
const getTemplateStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const stats = await Template.findAll({
      where: { user_id: userId },
      attributes: [
        'status',
        [Template.sequelize.fn('COUNT', Template.sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });
    
    const categoryStats = await Template.findAll({
      where: { user_id: userId },
      attributes: [
        'category',
        [Template.sequelize.fn('COUNT', Template.sequelize.col('id')), 'count']
      ],
      group: ['category'],
      raw: true
    });
    
    const totalUsage = await Template.sum('usage_count', {
      where: { user_id: userId }
    });
    
    res.json({
      success: true,
      data: {
        statusStats: stats,
        categoryStats: categoryStats,
        totalUsage: totalUsage || 0
      }
    });
  } catch (error) {
    console.error('Get template stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template statistics',
      error: error.message
    });
  }
};

module.exports = {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  submitForApproval,
  getTemplateStats
};

const { Template } = require('../models');
const { logInfo, logError } = require('../utils/logger');

class TemplateService {
  constructor() {
    this.templateCache = new Map();
  }

  // Create new template
  async createTemplate(templateData, userId) {
    try {
      const {
        name,
        category,
        language,
        content,
        variables = [],
        status = 'draft',
        description = ''
      } = templateData;

      // Validate template data
      this.validateTemplateData(templateData);

      // Check if template name already exists for this user
      const existingTemplate = await Template.findOne({
        where: { name, user_id: userId }
      });

      if (existingTemplate) {
        throw new Error('Template name already exists');
      }

      // Create template
      const template = await Template.create({
        user_id: userId,
        name,
        category,
        language,
        content,
        variables: JSON.stringify(variables),
        status,
        description,
        created_at: new Date(),
        updated_at: new Date()
      });

      logInfo(`Template created: ${template.id} by user: ${userId}`);

      return {
        success: true,
        template: this.formatTemplate(template)
      };

    } catch (error) {
      logError(error, 'Error creating template');
      throw error;
    }
  }

  // Update template
  async updateTemplate(templateId, updateData, userId) {
    try {
      // Find template and check ownership
      const template = await Template.findOne({
        where: { id: templateId, user_id: userId }
      });

      if (!template) {
        throw new Error('Template not found or access denied');
      }

      // Validate update data
      if (updateData.content) {
        this.validateTemplateContent(updateData.content);
      }

      // Update template
      const updatedTemplate = await template.update({
        ...updateData,
        variables: updateData.variables ? JSON.stringify(updateData.variables) : template.variables,
        updated_at: new Date()
      });

      // Clear cache
      this.templateCache.delete(templateId);

      logInfo(`Template updated: ${templateId} by user: ${userId}`);

      return {
        success: true,
        template: this.formatTemplate(updatedTemplate)
      };

    } catch (error) {
      logError(error, 'Error updating template');
      throw error;
    }
  }

  // Delete template
  async deleteTemplate(templateId, userId) {
    try {
      // Find template and check ownership
      const template = await Template.findOne({
        where: { id: templateId, user_id: userId }
      });

      if (!template) {
        throw new Error('Template not found or access denied');
      }

      // Check if template is in use
      if (template.usage_count > 0) {
        throw new Error('Cannot delete template that has been used');
      }

      // Delete template
      await template.destroy();

      // Clear cache
      this.templateCache.delete(templateId);

      logInfo(`Template deleted: ${templateId} by user: ${userId}`);

      return {
        success: true,
        message: 'Template deleted successfully'
      };

    } catch (error) {
      logError(error, 'Error deleting template');
      throw error;
    }
  }

  // Get template by ID
  async getTemplate(templateId, userId) {
    try {
      // Check cache first
      if (this.templateCache.has(templateId)) {
        return this.templateCache.get(templateId);
      }

      // Find template
      const template = await Template.findOne({
        where: { id: templateId, user_id: userId }
      });

      if (!template) {
        throw new Error('Template not found');
      }

      const formattedTemplate = this.formatTemplate(template);

      // Cache the result
      this.templateCache.set(templateId, formattedTemplate);

      return formattedTemplate;

    } catch (error) {
      logError(error, 'Error getting template');
      throw error;
    }
  }

  // Get all templates for user
  async getUserTemplates(userId, filters = {}) {
    try {
      const {
        status,
        category,
        language,
        search,
        page = 1,
        limit = 20
      } = filters;

      let whereClause = { user_id: userId };

      // Apply filters
      if (status) {
        whereClause.status = status;
      }

      if (category) {
        whereClause.category = category;
      }

      if (language) {
        whereClause.language = language;
      }

      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { content: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }

      // Get templates with pagination
      const { count, rows } = await Template.findAndCountAll({
        where: whereClause,
        order: [['updated_at', 'DESC']],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });

      const templates = rows.map(template => this.formatTemplate(template));

      return {
        templates,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit))
        }
      };

    } catch (error) {
      logError(error, 'Error getting user templates');
      throw error;
    }
  }

  // Approve template (for admin users)
  async approveTemplate(templateId, adminUserId) {
    try {
      // Find template
      const template = await Template.findByPk(templateId);

      if (!template) {
        throw new Error('Template not found');
      }

      // Update template status
      await template.update({
        status: 'approved',
        approved_by: adminUserId,
        approved_at: new Date(),
        updated_at: new Date()
      });

      // Clear cache
      this.templateCache.delete(templateId);

      logInfo(`Template approved: ${templateId} by admin: ${adminUserId}`);

      return {
        success: true,
        template: this.formatTemplate(template)
      };

    } catch (error) {
      logError(error, 'Error approving template');
      throw error;
    }
  }

  // Reject template (for admin users)
  async rejectTemplate(templateId, adminUserId, reason = '') {
    try {
      // Find template
      const template = await Template.findByPk(templateId);

      if (!template) {
        throw new Error('Template not found');
      }

      // Update template status
      await template.update({
        status: 'rejected',
        rejected_by: adminUserId,
        rejected_at: new Date(),
        rejection_reason: reason,
        updated_at: new Date()
      });

      // Clear cache
      this.templateCache.delete(templateId);

      logInfo(`Template rejected: ${templateId} by admin: ${adminUserId}`);

      return {
        success: true,
        template: this.formatTemplate(template)
      };

    } catch (error) {
      logError(error, 'Error rejecting template');
      throw error;
    }
  }

  // Use template (increment usage count)
  async useTemplate(templateId) {
    try {
      const template = await Template.findByPk(templateId);

      if (!template) {
        throw new Error('Template not found');
      }

      if (template.status !== 'approved') {
        throw new Error('Template is not approved for use');
      }

      // Increment usage count
      await template.increment('usage_count');

      // Clear cache
      this.templateCache.delete(templateId);

      logInfo(`Template used: ${templateId}`);

      return {
        success: true,
        usage_count: template.usage_count + 1
      };

    } catch (error) {
      logError(error, 'Error using template');
      throw error;
    }
  }

  // Get template statistics
  async getTemplateStats(userId) {
    try {
      const stats = await Template.findAll({
        where: { user_id: userId },
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status']
      });

      const totalTemplates = await Template.count({
        where: { user_id: userId }
      });

      const totalUsage = await Template.sum('usage_count', {
        where: { user_id: userId }
      });

      return {
        total_templates: totalTemplates,
        total_usage: totalUsage || 0,
        by_status: stats.reduce((acc, stat) => {
          acc[stat.status] = parseInt(stat.dataValues.count);
          return acc;
        }, {})
      };

    } catch (error) {
      logError(error, 'Error getting template statistics');
      throw error;
    }
  }

  // Validate template data
  validateTemplateData(templateData) {
    const { name, category, language, content } = templateData;

    if (!name || name.trim().length === 0) {
      throw new Error('Template name is required');
    }

    if (!category || !['marketing', 'utility', 'authentication'].includes(category)) {
      throw new Error('Valid category is required');
    }

    if (!language || language.trim().length === 0) {
      throw new Error('Template language is required');
    }

    if (!content || content.trim().length === 0) {
      throw new Error('Template content is required');
    }

    this.validateTemplateContent(content);
  }

  // Validate template content
  validateTemplateContent(content) {
    // Check for required variables format {{variable_name}}
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables = content.match(variableRegex);

    if (variables) {
      // Validate variable names
      variables.forEach(variable => {
        const varName = variable.replace(/\{\{|\}\}/g, '');
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varName)) {
          throw new Error(`Invalid variable name: ${varName}`);
        }
      });
    }
  }

  // Format template for response
  formatTemplate(template) {
    return {
      id: template.id,
      name: template.name,
      category: template.category,
      language: template.language,
      content: template.content,
      variables: template.variables ? JSON.parse(template.variables) : [],
      status: template.status,
      description: template.description,
      usage_count: template.usage_count || 0,
      approved_by: template.approved_by,
      approved_at: template.approved_at,
      rejected_by: template.rejected_by,
      rejected_at: template.rejected_at,
      rejection_reason: template.rejection_reason,
      created_at: template.created_at,
      updated_at: template.updated_at
    };
  }

  // Clear template cache
  clearCache() {
    this.templateCache.clear();
  }
}

module.exports = new TemplateService(); 
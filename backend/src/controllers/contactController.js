const { Contact, Message } = require('../models');
const { logError, logInfo } = require('../utils/logger');
const { formatPhoneNumber } = require('../utils/helpers');

class ContactController {
  // Get all contacts for a user
  async getUserContacts(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, search, tag, favorite, blocked } = req.query;

      // Build where clause
      const whereClause = { user_id: userId };
      if (favorite === 'true') whereClause.is_favorite = true;
      if (blocked === 'true') whereClause.is_blocked = true;

      let contacts;
      let totalCount;

      if (search) {
        // Search contacts
        contacts = await Contact.search(userId, search, {
          limit: parseInt(limit),
          offset: (parseInt(page) - 1) * parseInt(limit)
        });
        totalCount = contacts.length; // For search, we get all results
      } else if (tag) {
        // Get contacts by tag
        contacts = await Contact.findByTag(userId, tag);
        totalCount = contacts.length;
      } else {
        // Get all contacts with pagination
        const result = await Contact.findAndCountAll({
          where: whereClause,
          limit: parseInt(limit),
          offset: (parseInt(page) - 1) * parseInt(limit),
          order: [['name', 'ASC']]
        });
        contacts = result.rows;
        totalCount = result.count;
      }

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: contacts,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: totalCount,
          items_per_page: parseInt(limit)
        }
      });

    } catch (error) {
      logError(error, 'Error getting user contacts');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get a specific contact
  async getContact(req, res) {
    try {
      const { contactId } = req.params;
      const userId = req.user.id;

      const contact = await Contact.findOne({
        where: { id: contactId, user_id: userId }
      });

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'Contact not found'
        });
      }

      res.json({
        success: true,
        data: contact
      });

    } catch (error) {
      logError(error, 'Error getting contact');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Create a new contact
  async createContact(req, res) {
    try {
      const userId = req.user.id;
      const { name, phone, email, organization, notes, tags } = req.body;

      // Format phone number
      const formattedPhone = formatPhoneNumber(phone);

      // Check if contact already exists
      const existingContact = await Contact.findByPhone(formattedPhone, userId);
      if (existingContact) {
        return res.status(400).json({
          success: false,
          message: 'Contact with this phone number already exists'
        });
      }

      // Create contact
      const contact = await Contact.create({
        user_id: userId,
        name,
        phone: formattedPhone,
        email,
        organization,
        notes,
        tags: tags || []
      });

      logInfo(`Contact created: ${contact.id} by user: ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Contact created successfully',
        data: contact
      });

    } catch (error) {
      logError(error, 'Error creating contact');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update contact
  async updateContact(req, res) {
    try {
      const { contactId } = req.params;
      const userId = req.user.id;
      const { name, phone, email, organization, notes, tags } = req.body;

      // Find contact
      const contact = await Contact.findOne({
        where: { id: contactId, user_id: userId }
      });

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'Contact not found'
        });
      }

      // Check if new phone number conflicts with existing contact
      if (phone && phone !== contact.phone) {
        const formattedPhone = formatPhoneNumber(phone);
        const existingContact = await Contact.findByPhone(formattedPhone, userId);
        if (existingContact && existingContact.id !== contactId) {
          return res.status(400).json({
            success: false,
            message: 'Contact with this phone number already exists'
          });
        }
      }

      // Update contact
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (phone !== undefined) updateData.phone = formatPhoneNumber(phone);
      if (email !== undefined) updateData.email = email;
      if (organization !== undefined) updateData.organization = organization;
      if (notes !== undefined) updateData.notes = notes;
      if (tags !== undefined) updateData.tags = tags;

      await contact.update(updateData);

      logInfo(`Contact updated: ${contactId} by user: ${userId}`);

      res.json({
        success: true,
        message: 'Contact updated successfully',
        data: contact
      });

    } catch (error) {
      logError(error, 'Error updating contact');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Delete contact
  async deleteContact(req, res) {
    try {
      const { contactId } = req.params;
      const userId = req.user.id;

      // Find contact
      const contact = await Contact.findOne({
        where: { id: contactId, user_id: userId }
      });

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'Contact not found'
        });
      }

      // Delete contact
      await contact.destroy();

      logInfo(`Contact deleted: ${contactId} by user: ${userId}`);

      res.json({
        success: true,
        message: 'Contact deleted successfully'
      });

    } catch (error) {
      logError(error, 'Error deleting contact');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Toggle favorite status
  async toggleFavorite(req, res) {
    try {
      const { contactId } = req.params;
      const userId = req.user.id;

      // Find contact
      const contact = await Contact.findOne({
        where: { id: contactId, user_id: userId }
      });

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'Contact not found'
        });
      }

      // Toggle favorite status
      const isFavorite = await contact.toggleFavorite();

      logInfo(`Contact favorite toggled: ${contactId} by user: ${userId}`);

      res.json({
        success: true,
        message: `Contact ${isFavorite ? 'added to' : 'removed from'} favorites`,
        data: { is_favorite: isFavorite }
      });

    } catch (error) {
      logError(error, 'Error toggling contact favorite');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Toggle blocked status
  async toggleBlocked(req, res) {
    try {
      const { contactId } = req.params;
      const userId = req.user.id;

      // Find contact
      const contact = await Contact.findOne({
        where: { id: contactId, user_id: userId }
      });

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'Contact not found'
        });
      }

      // Toggle blocked status
      const isBlocked = await contact.toggleBlocked();

      logInfo(`Contact blocked toggled: ${contactId} by user: ${userId}`);

      res.json({
        success: true,
        message: `Contact ${isBlocked ? 'blocked' : 'unblocked'}`,
        data: { is_blocked: isBlocked }
      });

    } catch (error) {
      logError(error, 'Error toggling contact blocked');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Add tag to contact
  async addTag(req, res) {
    try {
      const { contactId } = req.params;
      const userId = req.user.id;
      const { tag } = req.body;

      if (!tag) {
        return res.status(400).json({
          success: false,
          message: 'Tag is required'
        });
      }

      // Find contact
      const contact = await Contact.findOne({
        where: { id: contactId, user_id: userId }
      });

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'Contact not found'
        });
      }

      // Add tag
      await contact.addTag(tag);

      logInfo(`Tag added to contact: ${contactId} by user: ${userId}`);

      res.json({
        success: true,
        message: 'Tag added successfully',
        data: contact
      });

    } catch (error) {
      logError(error, 'Error adding tag to contact');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Remove tag from contact
  async removeTag(req, res) {
    try {
      const { contactId, tag } = req.params;
      const userId = req.user.id;

      // Find contact
      const contact = await Contact.findOne({
        where: { id: contactId, user_id: userId }
      });

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'Contact not found'
        });
      }

      // Remove tag
      await contact.removeTag(tag);

      logInfo(`Tag removed from contact: ${contactId} by user: ${userId}`);

      res.json({
        success: true,
        message: 'Tag removed successfully',
        data: contact
      });

    } catch (error) {
      logError(error, 'Error removing tag from contact');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get contact statistics
  async getContactStats(req, res) {
    try {
      const userId = req.user.id;

      const stats = await Contact.getStats(userId);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logError(error, 'Error getting contact statistics');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get contact conversation history
  async getContactHistory(req, res) {
    try {
      const { contactId } = req.params;
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;

      // Find contact
      const contact = await Contact.findOne({
        where: { id: contactId, user_id: userId }
      });

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'Contact not found'
        });
      }

      // Get conversation history
      const offset = (page - 1) * limit;
      const messages = await Message.findAndCountAll({
        where: {
          user_id: userId,
          [require('sequelize').Op.or]: [
            { from_number: contact.phone },
            { to_number: contact.phone }
          ]
        },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      const totalPages = Math.ceil(messages.count / limit);

      res.json({
        success: true,
        data: {
          contact,
          messages: messages.rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: messages.count,
            items_per_page: parseInt(limit)
          }
        }
      });

    } catch (error) {
      logError(error, 'Error getting contact history');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Import contacts (bulk)
  async importContacts(req, res) {
    try {
      const userId = req.user.id;
      const { contacts } = req.body;

      if (!Array.isArray(contacts) || contacts.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Contacts array is required and must not be empty'
        });
      }

      const results = {
        created: 0,
        updated: 0,
        errors: []
      };

      for (const contactData of contacts) {
        try {
          const { name, phone, email, organization, notes, tags } = contactData;

          if (!name || !phone) {
            results.errors.push({
              contact: contactData,
              error: 'Name and phone are required'
            });
            continue;
          }

          const formattedPhone = formatPhoneNumber(phone);

          // Try to create or update contact
          const contact = await Contact.updateOrCreate(userId, formattedPhone, {
            name,
            phone: formattedPhone,
            email,
            organization,
            notes,
            tags: tags || []
          });

          if (contact._options.isNewRecord) {
            results.created++;
          } else {
            results.updated++;
          }

        } catch (error) {
          results.errors.push({
            contact: contactData,
            error: error.message
          });
        }
      }

      logInfo(`Contacts imported: ${results.created} created, ${results.updated} updated by user: ${userId}`);

      res.json({
        success: true,
        message: 'Contacts import completed',
        data: results
      });

    } catch (error) {
      logError(error, 'Error importing contacts');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new ContactController(); 
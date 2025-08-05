const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateContactCreation, 
  validateContactUpdate, 
  validateUUID, 
  validateContactUUID,
  validatePagination 
} = require('../middleware/validation');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all contacts for the authenticated user
router.get('/', validatePagination, contactController.getUserContacts);

// Get contact statistics
router.get('/stats', contactController.getContactStats);

// Import contacts (bulk)
router.post('/import', contactController.importContacts);

// Create a new contact
router.post('/', validateContactCreation, contactController.createContact);

// Get a specific contact
router.get('/:contactId', validateContactUUID, contactController.getContact);

// Update contact
router.put('/:contactId', validateContactUUID, validateContactUpdate, contactController.updateContact);

// Delete contact
router.delete('/:contactId', validateContactUUID, contactController.deleteContact);

// Toggle favorite status
router.patch('/:contactId/favorite', validateContactUUID, contactController.toggleFavorite);

// Toggle blocked status
router.patch('/:contactId/blocked', validateContactUUID, contactController.toggleBlocked);

// Add tag to contact
router.post('/:contactId/tags', validateContactUUID, contactController.addTag);

// Remove tag from contact
router.delete('/:contactId/tags/:tag', validateContactUUID, contactController.removeTag);

// Get contact conversation history
router.get('/:contactId/history', validateContactUUID, validatePagination, contactController.getContactHistory);

module.exports = router; 
const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateContactCreation, 
  validateContactUpdate, 
  validateUUID, 
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
router.get('/:contactId', validateUUID, contactController.getContact);

// Update contact
router.put('/:contactId', validateUUID, validateContactUpdate, contactController.updateContact);

// Delete contact
router.delete('/:contactId', validateUUID, contactController.deleteContact);

// Toggle favorite status
router.patch('/:contactId/favorite', validateUUID, contactController.toggleFavorite);

// Toggle blocked status
router.patch('/:contactId/blocked', validateUUID, contactController.toggleBlocked);

// Add tag to contact
router.post('/:contactId/tags', validateUUID, contactController.addTag);

// Remove tag from contact
router.delete('/:contactId/tags/:tag', validateUUID, contactController.removeTag);

// Get contact conversation history
router.get('/:contactId/history', validateUUID, validatePagination, contactController.getContactHistory);

module.exports = router; 
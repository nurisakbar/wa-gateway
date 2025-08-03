const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const fileUploadService = require('../services/fileUploadService');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get supported file types
router.get('/types', fileController.getSupportedFileTypes);

// Get file statistics
router.get('/stats', fileController.getFileStats);

// List user files
router.get('/', validatePagination, fileController.listUserFiles);

// Upload file
router.post('/upload', fileUploadService.handleFileUpload.bind(fileUploadService), fileController.uploadFile);

// Get file info
router.get('/:userId/*', fileController.getFileInfo);

// Download file
router.get('/:userId/*/download', fileController.downloadFile);

// Validate file for WhatsApp
router.get('/:userId/*/validate', fileController.validateFileForWhatsApp);

// Delete file
router.delete('/:userId/*', fileController.deleteFile);

// Clean up old files (super admin only)
router.post('/cleanup', requireSuperAdmin, fileController.cleanupOldFiles);

module.exports = router; 
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  submitForApproval,
  getTemplateStats
} = require('../controllers/templateController');

// All routes require authentication
router.use(authenticateToken);

// GET /api/v1/templates - Get all templates for user
router.get('/', getTemplates);

// GET /api/v1/templates/stats - Get template statistics
router.get('/stats', getTemplateStats);

// GET /api/v1/templates/:id - Get a single template
router.get('/:id', getTemplate);

// POST /api/v1/templates - Create a new template
router.post('/', createTemplate);

// PUT /api/v1/templates/:id - Update a template
router.put('/:id', updateTemplate);

// DELETE /api/v1/templates/:id - Delete a template
router.delete('/:id', deleteTemplate);

// POST /api/v1/templates/:id/submit - Submit template for approval
router.post('/:id/submit', submitForApproval);

module.exports = router;

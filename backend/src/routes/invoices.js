const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateIdUUID } = require('../middleware/validation');
const invoiceController = require('../controllers/invoiceController');

// All routes require authentication
router.use(authenticateToken);

// Get user's invoices
router.get('/', invoiceController.getUserInvoices);

// Get invoice statistics
router.get('/stats', invoiceController.getInvoiceStats);

// Get specific invoice
router.get('/:id', validateIdUUID, invoiceController.getInvoice);

// Generate new invoice
router.post('/generate', invoiceController.generateInvoice);

// Mark invoice as paid
router.post('/:id/pay', validateIdUUID, invoiceController.markInvoiceAsPaid);

// Download invoice
router.get('/:id/download', validateIdUUID, invoiceController.downloadInvoice);

// User: Confirm payment (upload proof of payment)
router.post('/:id/confirm-payment', validateIdUUID, invoiceController.confirmPayment);

// Admin routes
// Get all pending payment confirmations
router.get('/admin/pending-confirmations', requireAdmin, invoiceController.getPendingPaymentConfirmations);

// Approve payment confirmation
router.post('/:id/approve-payment', validateIdUUID, requireAdmin, invoiceController.approvePayment);

// Reject payment confirmation
router.post('/:id/reject-payment', validateIdUUID, requireAdmin, invoiceController.rejectPayment);

module.exports = router; 
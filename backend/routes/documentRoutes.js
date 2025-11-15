const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const documentController = require('../controllers/documentController');
const authMiddleware = require('../utils/authMiddleware');
const { upload } = require('../config/s3Config');

// Validation middleware
const validateAgentId = [
  param('agentId')
    .isMongoId()
    .withMessage('Invalid agent ID format')
];

const validateDocumentId = [
  param('documentId')
    .isMongoId()
    .withMessage('Invalid document ID format')
];

const validateDocumentUpdate = [
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Document name must be between 1 and 255 characters')
];

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Upload document
router.post(
  '/agents/:agentId/documents',
  validateAgentId,
  upload.single('document'),
  documentController.uploadDocument
);

// Get all documents for an agent
router.get(
  '/agents/:agentId/documents',
  validateAgentId,
  documentController.getDocuments
);

// Get document statistics
router.get(
  '/agents/:agentId/documents/stats',
  validateAgentId,
  documentController.getDocumentStats
);

// Get document download URL
router.get(
  '/agents/:agentId/documents/:documentId/url',
  validateAgentId,
  validateDocumentId,
  documentController.getDocumentUrl
);

// Update document
router.put(
  '/agents/:agentId/documents/:documentId',
  validateAgentId,
  validateDocumentId,
  validateDocumentUpdate,
  documentController.updateDocument
);

// Delete document
router.delete(
  '/agents/:agentId/documents/:documentId',
  validateAgentId,
  validateDocumentId,
  documentController.deleteDocument
);

module.exports = router;

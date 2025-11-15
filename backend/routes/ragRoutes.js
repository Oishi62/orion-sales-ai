const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const authMiddleware = require('../utils/authMiddleware');
const ragService = require('../services/ragService');

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

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get RAG processing status for a specific document
router.get(
  '/agents/:agentId/documents/:documentId/rag-status',
  validateAgentId,
  validateDocumentId,
  async (req, res) => {
    try {
      const { agentId, documentId } = req.params;
      
      // Verify agent ownership
      const Agent = require('../models/Agent');
      const agent = await Agent.findOne({ _id: agentId, userId: req.user.userId });
      if (!agent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found or access denied'
        });
      }

      const status = ragService.getProcessingStatus(agentId, documentId);
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error getting RAG status:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get RAG processing status'
      });
    }
  }
);

// Get all RAG processing statuses for an agent
router.get(
  '/agents/:agentId/rag-status',
  validateAgentId,
  async (req, res) => {
    try {
      const { agentId } = req.params;
      
      // Verify agent ownership
      const Agent = require('../models/Agent');
      const agent = await Agent.findOne({ _id: agentId, userId: req.user.userId });
      if (!agent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found or access denied'
        });
      }

      const statuses = ragService.getAgentProcessingStatuses(agentId);
      
      res.json({
        success: true,
        data: {
          statuses: statuses,
          count: statuses.length
        }
      });
    } catch (error) {
      console.error('Error getting agent RAG statuses:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get RAG processing statuses'
      });
    }
  }
);

// Manually trigger RAG processing for all agent documents
router.post(
  '/agents/:agentId/process-documents',
  validateAgentId,
  async (req, res) => {
    try {
      const { agentId } = req.params;
      
      // Verify agent ownership
      const Agent = require('../models/Agent');
      const agent = await Agent.findOne({ _id: agentId, userId: req.user.userId });
      if (!agent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found or access denied'
        });
      }

      // Trigger processing asynchronously
      setImmediate(async () => {
        try {
          await ragService.processAgentDocuments(agentId);
        } catch (error) {
          console.error('Error in background RAG processing:', error);
        }
      });

      res.json({
        success: true,
        message: 'RAG processing started for all agent documents'
      });
    } catch (error) {
      console.error('Error triggering RAG processing:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to trigger RAG processing'
      });
    }
  }
);

// Manually trigger RAG processing for a specific document
router.post(
  '/agents/:agentId/documents/:documentId/process',
  validateAgentId,
  validateDocumentId,
  async (req, res) => {
    try {
      const { agentId, documentId } = req.params;
      
      // Verify agent ownership and get document
      const Agent = require('../models/Agent');
      const agent = await Agent.findOne({ _id: agentId, userId: req.user.userId });
      if (!agent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found or access denied'
        });
      }

      const document = agent.product.documents.id(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Trigger processing asynchronously
      setImmediate(async () => {
        try {
          await ragService.processDocumentForRAG(agentId, document);
        } catch (error) {
          console.error('Error in background RAG processing:', error);
        }
      });

      res.json({
        success: true,
        message: 'RAG processing started for document'
      });
    } catch (error) {
      console.error('Error triggering document RAG processing:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to trigger document RAG processing'
      });
    }
  }
);

// Get RAG statistics for an agent
router.get(
  '/agents/:agentId/rag-stats',
  validateAgentId,
  async (req, res) => {
    try {
      const { agentId } = req.params;
      
      // Verify agent ownership
      const Agent = require('../models/Agent');
      const agent = await Agent.findOne({ _id: agentId, userId: req.user.userId });
      if (!agent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found or access denied'
        });
      }

      const stats = await ragService.getAgentRAGStats(agentId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting RAG stats:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get RAG statistics'
      });
    }
  }
);

// RAG health check
router.get('/health', async (req, res) => {
  try {
    const health = await ragService.healthCheck();
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health
    });
  } catch (error) {
    console.error('Error checking RAG health:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check RAG health'
    });
  }
});

module.exports = router;

const documentService = require('../services/documentService');
const { validationResult } = require('express-validator');

class DocumentController {
  // Upload document
  async uploadDocument(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { agentId } = req.params;
      
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Verify agent ownership
      const Agent = require('../models/Agent');
      const agent = await Agent.findOne({ _id: agentId, userId: req.user.userId });
      if (!agent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found or access denied'
        });
      }

      const result = await documentService.uploadDocument(agentId, req.file);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Document uploaded successfully'
      });
    } catch (error) {
      console.error('Error in uploadDocument:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload document'
      });
    }
  }

  // Get all documents for an agent
  async getDocuments(req, res) {
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

      const documents = await documentService.getAgentDocuments(agentId);

      res.json({
        success: true,
        data: {
          documents: documents,
          count: documents.length
        }
      });
    } catch (error) {
      console.error('Error in getDocuments:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch documents'
      });
    }
  }

  // Delete document
  async deleteDocument(req, res) {
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

      const result = await documentService.deleteDocument(agentId, documentId);

      res.json({
        success: true,
        data: result,
        message: 'Document deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteDocument:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete document'
      });
    }
  }

  // Get document download URL
  async getDocumentUrl(req, res) {
    try {
      const { agentId, documentId } = req.params;
      const { expires } = req.query;

      // Verify agent ownership
      const Agent = require('../models/Agent');
      const agent = await Agent.findOne({ _id: agentId, userId: req.user.userId });
      if (!agent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found or access denied'
        });
      }

      const result = await documentService.getDocumentUrl(
        agentId, 
        documentId, 
        expires ? parseInt(expires) : 3600
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in getDocumentUrl:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate document URL'
      });
    }
  }

  // Update document
  async updateDocument(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { agentId, documentId } = req.params;
      const updateData = req.body;

      // Verify agent ownership
      const Agent = require('../models/Agent');
      const agent = await Agent.findOne({ _id: agentId, userId: req.user.userId });
      if (!agent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found or access denied'
        });
      }

      const result = await documentService.updateDocument(agentId, documentId, updateData);

      res.json({
        success: true,
        data: result,
        message: 'Document updated successfully'
      });
    } catch (error) {
      console.error('Error in updateDocument:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update document'
      });
    }
  }

  // Get document statistics
  async getDocumentStats(req, res) {
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

      const stats = await documentService.getDocumentStats(agentId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error in getDocumentStats:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get document statistics'
      });
    }
  }
}

module.exports = new DocumentController();

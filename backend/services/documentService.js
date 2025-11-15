const Agent = require('../models/Agent');
const { deleteFromS3, getSignedUrl } = require('../config/s3Config');
const ragService = require('./ragService');

class DocumentService {
  // Upload document and save to agent
  async uploadDocument(agentId, fileData) {
    try {
      const agent = await Agent.findById(agentId);
      if (!agent) {
        throw new Error('Agent not found');
      }

      // Create document object
      const document = {
        name: fileData.originalname,
        url: fileData.location,
        key: fileData.key,
        size: fileData.size,
        mimeType: fileData.mimetype,
        uploadedAt: new Date()
      };

      // Initialize product and documents array if they don't exist
      if (!agent.product) {
        agent.product = {};
      }
      if (!agent.product.documents) {
        agent.product.documents = [];
      }

      // Add document to agent
      agent.product.documents.push(document);
      await agent.save();

      // Get the saved document with its generated _id
      const savedDocument = agent.product.documents[agent.product.documents.length - 1];

      // Trigger RAG processing asynchronously
      setImmediate(async () => {
        try {
          console.log(`🚀 Triggering RAG processing for document: ${savedDocument.name}`);
          await ragService.processDocumentForRAG(agentId, savedDocument);
        } catch (error) {
          console.error('❌ Error in background RAG processing:', error);
        }
      });

      return {
        success: true,
        document: document,
        message: 'Document uploaded successfully. RAG processing started in background.'
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  // Get all documents for an agent
  async getAgentDocuments(agentId) {
    try {
      const agent = await Agent.findById(agentId).select('product.documents');
      if (!agent) {
        throw new Error('Agent not found');
      }

      // Return empty array if product or documents don't exist yet
      return (agent.product && agent.product.documents) ? agent.product.documents : [];
    } catch (error) {
      console.error('Error fetching agent documents:', error);
      throw error;
    }
  }

  // Delete document from agent and S3
  async deleteDocument(agentId, documentId) {
    try {
      const agent = await Agent.findById(agentId);
      if (!agent) {
        throw new Error('Agent not found');
      }

      // Find the document
      const documentIndex = agent.product.documents.findIndex(
        doc => doc._id.toString() === documentId
      );

      if (documentIndex === -1) {
        throw new Error('Document not found');
      }

      const document = agent.product.documents[documentIndex];

      // Delete from S3
      await deleteFromS3(document.key);

      // Delete vectors from Qdrant if document was processed
      if (document.ragProcessed) {
        try {
          await ragService.deleteDocumentVectors(document._id);
          console.log(`✅ Deleted RAG vectors for document: ${document.name}`);
        } catch (error) {
          console.error('❌ Error deleting RAG vectors:', error);
          // Don't fail the entire operation if vector deletion fails
        }
      }

      // Remove from agent
      agent.product.documents.splice(documentIndex, 1);
      await agent.save();

      return {
        success: true,
        message: 'Document and associated vectors deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // Get signed URL for document access
  async getDocumentUrl(agentId, documentId, expires = 3600) {
    try {
      const agent = await Agent.findById(agentId);
      if (!agent) {
        throw new Error('Agent not found');
      }

      const document = agent.product.documents.find(
        doc => doc._id.toString() === documentId
      );

      if (!document) {
        throw new Error('Document not found');
      }

      const signedUrl = getSignedUrl(document.key, expires);
      
      return {
        url: signedUrl,
        document: document
      };
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw error;
    }
  }

  // Update document metadata
  async updateDocument(agentId, documentId, updateData) {
    try {
      const agent = await Agent.findById(agentId);
      if (!agent) {
        throw new Error('Agent not found');
      }

      const document = agent.product.documents.find(
        doc => doc._id.toString() === documentId
      );

      if (!document) {
        throw new Error('Document not found');
      }

      // Update allowed fields
      if (updateData.name) document.name = updateData.name;

      await agent.save();

      return {
        success: true,
        document: document,
        message: 'Document updated successfully'
      };
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  // Get document statistics for an agent
  async getDocumentStats(agentId) {
    try {
      const agent = await Agent.findById(agentId).select('product.documents');
      if (!agent) {
        throw new Error('Agent not found');
      }

      const documents = agent.product.documents || [];
      
      const stats = {
        totalDocuments: documents.length,
        totalSize: documents.reduce((sum, doc) => sum + (doc.size || 0), 0),
        fileTypes: {},
        latestUpload: null
      };

      documents.forEach(doc => {
        // Count file types
        const extension = doc.name.split('.').pop().toLowerCase();
        stats.fileTypes[extension] = (stats.fileTypes[extension] || 0) + 1;

        // Find latest upload
        if (!stats.latestUpload || doc.uploadedAt > stats.latestUpload) {
          stats.latestUpload = doc.uploadedAt;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting document stats:', error);
      throw error;
    }
  }
}

module.exports = new DocumentService();

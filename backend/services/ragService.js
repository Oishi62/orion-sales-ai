const qdrantService = require('./qdrantService');
const embeddingService = require('./embeddingService');
const documentProcessorService = require('./documentProcessorService');
const Agent = require('../models/Agent');

class RAGService {
  constructor() {
    this.processingQueue = new Map(); // Track processing status
  }

  // Initialize RAG services
  async initialize() {
    try {
      console.log('🚀 Initializing RAG services...');
      
      // Initialize Qdrant collection
      await qdrantService.initializeCollection();
      
      // Health check for all services
      const [qdrantHealth, embeddingHealth] = await Promise.all([
        qdrantService.healthCheck(),
        embeddingService.healthCheck()
      ]);

      console.log('📊 RAG Services Health Check:');
      console.log('  - Qdrant:', qdrantHealth.status);
      console.log('  - OpenAI Embeddings:', embeddingHealth.status);

      if (qdrantHealth.status === 'unhealthy') {
        throw new Error(`Qdrant service unhealthy: ${qdrantHealth.error}`);
      }

      if (embeddingHealth.status === 'unhealthy') {
        throw new Error(`Embedding service unhealthy: ${embeddingHealth.error}`);
      }

      console.log('✅ RAG services initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error initializing RAG services:', error);
      throw error;
    }
  }

  // Process single document for RAG
  async processDocumentForRAG(agentId, document) {
    // Debug logging
    console.log('🔍 RAG Processing Debug Info:');
    console.log('  - Agent ID:', agentId);
    console.log('  - Document ID:', document._id);
    console.log('  - Document Name:', document.name);
    console.log('  - Document Keys:', Object.keys(document));

    if (!document._id) {
      throw new Error('Document ID is missing. Cannot process document for RAG.');
    }

    const processingId = `${agentId}_${document._id}`;
    
    try {
      console.log(`🔄 Starting RAG processing for document: ${document.name}`);
      
      // Mark as processing
      this.processingQueue.set(processingId, {
        status: 'processing',
        startTime: new Date(),
        agentId: agentId,
        documentId: document._id,
        documentName: document.name,
        progress: 0
      });

      // Update document status in database
      await this.updateDocumentProcessingStatus(agentId, document._id, 'processing', 0);

      // Step 1: Process document (extract text and chunk)
      console.log('📄 Step 1: Processing document...');
      this.updateProcessingProgress(processingId, 20, 'Extracting text from document...');
      
      const processedDoc = await documentProcessorService.processDocument(document);
      
      if (!processedDoc.success) {
        throw new Error(`Document processing failed: ${processedDoc.error}`);
      }

      // Step 2: Generate embeddings
      console.log('🧠 Step 2: Generating embeddings...');
      this.updateProcessingProgress(processingId, 50, 'Generating embeddings...');
      
      const chunksWithEmbeddings = await embeddingService.generateEmbeddings(processedDoc.chunks);

      // Step 3: Store in Qdrant
      console.log('💾 Step 3: Storing vectors in Qdrant...');
      this.updateProcessingProgress(processingId, 80, 'Storing vectors in database...');
      
      const vectorCount = await qdrantService.storeDocumentVectors(document._id, chunksWithEmbeddings);

      // Step 4: Update document metadata
      console.log('📝 Step 4: Updating document metadata...');
      this.updateProcessingProgress(processingId, 95, 'Finalizing...');
      
      await this.updateDocumentRAGMetadata(agentId, document._id, {
        ragProcessed: true,
        vectorCount: vectorCount,
        textLength: processedDoc.extractedText.length,
        chunkCount: processedDoc.chunks.length,
        processedAt: new Date(),
        embeddingModel: 'text-embedding-3-small',
        stats: processedDoc.stats
      });

      // Mark as completed
      this.updateProcessingProgress(processingId, 100, 'Completed successfully');
      await this.updateDocumentProcessingStatus(agentId, document._id, 'completed', 100);

      // Remove from processing queue after a delay
      setTimeout(() => {
        this.processingQueue.delete(processingId);
      }, 30000); // Keep for 30 seconds for status checking

      console.log(`✅ RAG processing completed for document: ${document.name}`);
      
      return {
        success: true,
        documentId: document._id,
        vectorCount: vectorCount,
        stats: processedDoc.stats,
        processingTime: Date.now() - this.processingQueue.get(processingId).startTime.getTime()
      };

    } catch (error) {
      console.error(`❌ RAG processing failed for document ${document.name}:`, error);
      
      // Mark as failed
      this.updateProcessingProgress(processingId, 0, `Failed: ${error.message}`);
      await this.updateDocumentProcessingStatus(agentId, document._id, 'failed', 0, error.message);

      // Keep failed status in queue for debugging
      setTimeout(() => {
        this.processingQueue.delete(processingId);
      }, 300000); // Keep for 5 minutes

      return {
        success: false,
        documentId: document._id,
        error: error.message,
        processingTime: Date.now() - this.processingQueue.get(processingId).startTime.getTime()
      };
    }
  }

  // Process all documents for an agent
  async processAgentDocuments(agentId) {
    try {
      console.log(`🚀 Processing all documents for agent: ${agentId}`);
      
      const agent = await Agent.findById(agentId);
      if (!agent || !agent.product?.documents) {
        throw new Error('Agent not found or has no documents');
      }

      const documents = agent.product.documents.filter(doc => !doc.ragProcessed);
      
      if (documents.length === 0) {
        console.log('ℹ️ No unprocessed documents found');
        return { success: true, processedCount: 0, results: [] };
      }

      console.log(`📋 Found ${documents.length} documents to process`);
      
      const results = [];
      
      // Process documents sequentially to avoid overwhelming the services
      for (const document of documents) {
        const result = await this.processDocumentForRAG(agentId, document);
        results.push(result);
        
        // Add small delay between documents
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      console.log(`✅ Batch processing completed: ${successful} successful, ${failed} failed`);
      
      return {
        success: true,
        processedCount: results.length,
        successful: successful,
        failed: failed,
        results: results
      };

    } catch (error) {
      console.error('❌ Error processing agent documents:', error);
      throw error;
    }
  }

  // Delete document vectors when document is deleted
  async deleteDocumentVectors(documentId) {
    try {
      await qdrantService.deleteDocumentVectors(documentId);
      console.log(`✅ Deleted vectors for document: ${documentId}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting document vectors:', error);
      throw error;
    }
  }

  // Update processing progress
  updateProcessingProgress(processingId, progress, message) {
    if (this.processingQueue.has(processingId)) {
      const status = this.processingQueue.get(processingId);
      status.progress = progress;
      status.message = message;
      status.updatedAt = new Date();
      this.processingQueue.set(processingId, status);
    }
  }

  // Get processing status
  getProcessingStatus(agentId, documentId) {
    const processingId = `${agentId}_${documentId}`;
    return this.processingQueue.get(processingId) || null;
  }

  // Get all processing statuses for an agent
  getAgentProcessingStatuses(agentId) {
    const statuses = [];
    for (const [key, status] of this.processingQueue.entries()) {
      if (status.agentId === agentId) {
        statuses.push(status);
      }
    }
    return statuses;
  }

  // Update document processing status in database
  async updateDocumentProcessingStatus(agentId, documentId, status, progress, error = null) {
    try {
      const agent = await Agent.findById(agentId);
      if (!agent) return;

      const document = agent.product.documents.id(documentId);
      if (!document) return;

      document.ragProcessingStatus = status;
      document.ragProcessingProgress = progress;
      if (error) {
        document.ragProcessingError = error;
      }
      document.ragLastUpdated = new Date();

      await agent.save();
    } catch (error) {
      console.error('Error updating document processing status:', error);
    }
  }

  // Update document RAG metadata
  async updateDocumentRAGMetadata(agentId, documentId, metadata) {
    try {
      const agent = await Agent.findById(agentId);
      if (!agent) throw new Error('Agent not found');

      const document = agent.product.documents.id(documentId);
      if (!document) throw new Error('Document not found');

      // Update document with RAG metadata
      Object.assign(document, metadata);
      
      await agent.save();
      return true;
    } catch (error) {
      console.error('Error updating document RAG metadata:', error);
      throw error;
    }
  }

  // Get RAG statistics for an agent
  async getAgentRAGStats(agentId) {
    try {
      const agent = await Agent.findById(agentId);
      if (!agent || !agent.product?.documents) {
        return {
          totalDocuments: 0,
          processedDocuments: 0,
          totalVectors: 0,
          totalTextLength: 0
        };
      }

      const documents = agent.product.documents;
      const processed = documents.filter(doc => doc.ragProcessed);
      
      const stats = {
        totalDocuments: documents.length,
        processedDocuments: processed.length,
        totalVectors: processed.reduce((sum, doc) => sum + (doc.vectorCount || 0), 0),
        totalTextLength: processed.reduce((sum, doc) => sum + (doc.textLength || 0), 0),
        processingRate: documents.length > 0 ? Math.round((processed.length / documents.length) * 100) : 0
      };

      return stats;
    } catch (error) {
      console.error('Error getting agent RAG stats:', error);
      throw error;
    }
  }

  // Health check for RAG services
  async healthCheck() {
    try {
      const [qdrantHealth, embeddingHealth] = await Promise.all([
        qdrantService.healthCheck(),
        embeddingService.healthCheck()
      ]);

      return {
        status: qdrantHealth.status === 'healthy' && embeddingHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
        services: {
          qdrant: qdrantHealth,
          embeddings: embeddingHealth
        },
        processingQueue: {
          activeJobs: this.processingQueue.size,
          jobs: Array.from(this.processingQueue.values())
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = new RAGService();

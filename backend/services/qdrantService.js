const { QdrantClient } = require('@qdrant/js-client-rest');
const crypto = require('crypto');

// Generate UUID v4 using Node.js crypto module
function generateUUID() {
  return crypto.randomUUID();
}

class QdrantService {
  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    });
    this.collectionName = 'salesai-documents';
  }

  // Initialize Qdrant collection
  async initializeCollection() {
    try {
      // Check if collection exists
      const collections = await this.client.getCollections();
      const collectionExists = collections.collections.some(
        col => col.name === this.collectionName
      );

      if (!collectionExists) {
        console.log('🔧 Creating Qdrant collection:', this.collectionName);
        
        // Create collection with specified configuration
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: 1536, // text-embedding-3-small dimension
            distance: 'Cosine'
          },
          optimizers_config: {
            default_segment_number: 2
          },
          replication_factor: 1
        });

        console.log('✅ Qdrant collection created successfully');
        
        // Create index for agentId field to enable filtering
        console.log('🔧 Creating index for agentId field...');
        await this.client.createPayloadIndex(this.collectionName, {
          field_name: 'agentId',
          field_schema: 'keyword'
        });
        console.log('✅ AgentId index created successfully');
        
        // Create index for documentId field as well (for future use)
        console.log('🔧 Creating index for documentId field...');
        await this.client.createPayloadIndex(this.collectionName, {
          field_name: 'documentId',
          field_schema: 'keyword'
        });
        console.log('✅ DocumentId index created successfully');
        
      } else {
        console.log('✅ Qdrant collection already exists');
        
        // Check if indexes exist, create them if they don't
        try {
          console.log('🔧 Ensuring payload indexes exist...');
          
          // Try to create agentId index (will fail silently if it already exists)
          try {
            await this.client.createPayloadIndex(this.collectionName, {
              field_name: 'agentId',
              field_schema: 'keyword'
            });
            console.log('✅ AgentId index created');
          } catch (indexError) {
            if (indexError.message?.includes('already exists') || indexError.status === 409) {
              console.log('✅ AgentId index already exists');
            } else {
              console.warn('⚠️ Could not create agentId index:', indexError.message);
            }
          }
          
          // Try to create documentId index
          try {
            await this.client.createPayloadIndex(this.collectionName, {
              field_name: 'documentId',
              field_schema: 'keyword'
            });
            console.log('✅ DocumentId index created');
          } catch (indexError) {
            if (indexError.message?.includes('already exists') || indexError.status === 409) {
              console.log('✅ DocumentId index already exists');
            } else {
              console.warn('⚠️ Could not create documentId index:', indexError.message);
            }
          }
          
        } catch (error) {
          console.warn('⚠️ Error checking/creating indexes:', error.message);
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Error initializing Qdrant collection:', error);
      throw error;
    }
  }

  // Store document vectors in Qdrant
  async storeDocumentVectors(documentId, chunks, agentId = null) {
    try {
      // Validate documentId
      if (!documentId) {
        throw new Error('Document ID is required for storing vectors');
      }

      console.log(`📊 Preparing to store ${chunks.length} vectors for document: ${documentId}`);

      const points = chunks.map((chunk, index) => {
        const pointId = generateUUID(); // Generate a proper UUID for Qdrant
        console.log(`🆔 Generated UUID for chunk ${index}: ${pointId}`);
        return {
          id: pointId,
          vector: chunk.embedding,
          payload: {
            documentId: documentId,
            agentId: agentId, // Store agentId for filtering
            chunkIndex: index,
            text: chunk.text,
            pointId: pointId, // Store the UUID in payload for reference
            originalId: `${documentId}_chunk_${index}`, // Store original ID for debugging
            metadata: chunk.metadata || {}
          }
        };
      });

      await this.client.upsert(this.collectionName, {
        wait: true,
        points: points
      });

      console.log(`✅ Stored ${points.length} vectors for document ${documentId}`);
      return points.length;
    } catch (error) {
      console.error('❌ Error storing vectors in Qdrant:', error);
      throw error;
    }
  }

  // Delete document vectors from Qdrant
  async deleteDocumentVectors(documentId) {
    try {
      console.log(`🗑️ Deleting vectors for document: ${documentId}`);
      
      await this.client.delete(this.collectionName, {
        wait: true,
        filter: {
          must: [
            {
              key: 'documentId',
              match: {
                value: documentId
              }
            }
          ]
        }
      });

      console.log(`✅ Deleted vectors for document ${documentId}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting vectors from Qdrant:', error);
      throw error;
    }
  }

  // Search similar vectors (for future RAG querying)
  async searchSimilarVectors(queryVector, limit = 5, options = {}) {
    try {
      const { documentIds = null, agentId = null } = options;
      
      console.log('🔍 Search options:', { agentId, documentIds, limit });
      console.log('🔍 Vector info:', {
        isArray: Array.isArray(queryVector),
        length: queryVector?.length,
        firstFew: queryVector?.slice(0, 3),
        type: typeof queryVector
      });
      
      const searchParams = {
        vector: queryVector,
        limit: limit,
        with_payload: true,
        with_vector: false
      };

      // Build filter conditions
      const filterConditions = [];
      
      // Add filter for specific agent if provided
      if (agentId) {
        filterConditions.push({
          key: 'agentId',
          match: {
            value: agentId
          }
        });
        console.log('🎯 Adding agentId filter:', agentId);
      }
      
      // Add filter for specific documents if provided
      if (documentIds && documentIds.length > 0) {
        filterConditions.push({
          key: 'documentId',
          match: {
            any: documentIds
          }
        });
        console.log('📄 Adding documentIds filter:', documentIds);
      }
      
      // Apply filters if any exist
      if (filterConditions.length > 0) {
        searchParams.filter = {
          must: filterConditions
        };
        console.log('🔍 Applied filters:', JSON.stringify(searchParams.filter, null, 2));
      }

      const searchResult = await this.client.search(this.collectionName, searchParams);
      console.log('✅ Search completed, results:', searchResult.length);
      return searchResult;
    } catch (error) {
      console.error('❌ Error searching vectors in Qdrant:', error);
      console.error('❌ Search params that caused error:', JSON.stringify({
        vector: 'VECTOR_ARRAY',
        limit: limit,
        with_payload: true,
        with_vector: false,
        filter: error.searchParams?.filter
      }, null, 2));
      throw error;
    }
  }

  // Get collection info
  async getCollectionInfo() {
    try {
      const info = await this.client.getCollection(this.collectionName);
      return info;
    } catch (error) {
      console.error('❌ Error getting collection info:', error);
      throw error;
    }
  }

  // Get document vector count
  async getDocumentVectorCount(documentId) {
    try {
      const result = await this.client.count(this.collectionName, {
        filter: {
          must: [
            {
              key: 'documentId',
              match: {
                value: documentId
              }
            }
          ]
        }
      });

      return result.count;
    } catch (error) {
      console.error('❌ Error counting document vectors:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const collections = await this.client.getCollections();
      return {
        status: 'healthy',
        collections: collections.collections.length,
        collectionExists: collections.collections.some(col => col.name === this.collectionName)
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = new QdrantService();

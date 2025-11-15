const OpenAI = require('openai');

class EmbeddingService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = 'text-embedding-3-small';
    this.maxTokensPerChunk = 8000; // Conservative limit for text-embedding-3-small
  }

  // Generate embeddings for text chunks
  async generateEmbeddings(textChunks) {
    try {
      console.log(`🔄 Generating embeddings for ${textChunks.length} chunks`);
      
      const embeddings = [];
      
      // Process chunks in batches to avoid rate limits
      const batchSize = 10;
      for (let i = 0; i < textChunks.length; i += batchSize) {
        const batch = textChunks.slice(i, i + batchSize);
        
        const batchEmbeddings = await Promise.all(
          batch.map(async (chunk, index) => {
            try {
              const response = await this.openai.embeddings.create({
                model: this.model,
                input: chunk.text,
                encoding_format: 'float'
              });

              return {
                ...chunk,
                embedding: response.data[0].embedding,
                tokens: response.usage.total_tokens
              };
            } catch (error) {
              console.error(`❌ Error generating embedding for chunk ${i + index}:`, error);
              throw error;
            }
          })
        );

        embeddings.push(...batchEmbeddings);
        
        // Add small delay between batches to respect rate limits
        if (i + batchSize < textChunks.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const totalTokens = embeddings.reduce((sum, emb) => sum + emb.tokens, 0);
      console.log(`✅ Generated ${embeddings.length} embeddings using ${totalTokens} tokens`);
      
      return embeddings;
    } catch (error) {
      console.error('❌ Error generating embeddings:', error);
      throw error;
    }
  }

  // Generate embedding for a single query (for future RAG querying)
  async generateQueryEmbedding(query) {
    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: query,
        encoding_format: 'float'
      });

      return {
        embedding: response.data[0].embedding,
        tokens: response.usage.total_tokens
      };
    } catch (error) {
      console.error('❌ Error generating query embedding:', error);
      throw error;
    }
  }

  // Estimate token count for text (rough estimation)
  estimateTokenCount(text) {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  // Check if text is within token limits
  isWithinTokenLimit(text) {
    return this.estimateTokenCount(text) <= this.maxTokensPerChunk;
  }

  // Health check
  async healthCheck() {
    try {
      // Test with a simple embedding
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: 'Health check test',
        encoding_format: 'float'
      });

      return {
        status: 'healthy',
        model: this.model,
        dimension: response.data[0].embedding.length,
        tokens: response.usage.total_tokens
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = new EmbeddingService();

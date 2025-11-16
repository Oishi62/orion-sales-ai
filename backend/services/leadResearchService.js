const openaiService = require('./openaiService');
const ragService = require('./ragService');

class LeadResearchService {
  constructor() {
    this.name = 'LeadResearchService';
  }

  /**
   * Perform lead research for a company
   * @param {Object} lead - Lead object containing company information
   * @param {Object} config - Configuration for the research
   * @returns {Promise<Object>} Research results
   */
  async performLeadResearch(lead, config = {}) {
    try {
      console.log(`🔬 Starting lead research for ${lead.name} at ${lead.organization_name}`);

      const companyName = lead.organization_name;
      const companyLinkedInUrl = lead.account_linkedin_url;
      const agentId = config.agentId;

      if (!companyName) {
        throw new Error('Company name is required for lead research');
      }

      if (!companyLinkedInUrl) {
        throw new Error('Company LinkedIn URL is required for lead research');
      }

      if (!agentId) {
        console.warn('⚠️ No agentId provided - RAG query will search across all documents');
      }

      // Step 1: Get company description using OpenAI with web search
      console.log(`📝 Step 1: Getting company description for ${companyName}`);
      const companyDescription = await openaiService.getCompanyDescription(
        companyLinkedInUrl, 
        companyName
      );

      // Step 2: Query RAG system for relevant product documentation
      console.log(`🔍 Step 2: Querying RAG system for relevant documentation`);
      const ragPrompt = openaiService.generateRagPrompt(companyName, companyDescription);
      
      const ragConfig = {
        limit: config.ragLimit || 5,
        threshold: config.ragThreshold || 0.3,
        agentId: agentId
      };
      console.log('🔍 RAG Config being passed:', ragConfig);
      
      const ragResults = await ragService.queryDocuments(ragPrompt, ragConfig);

      console.log('🔍 RAG Results structure:', {
        success: ragResults.success,
        resultCount: ragResults.results?.length || 0,
        firstResult: ragResults.results?.[0] ? {
          hasContent: !!ragResults.results[0].content,
          contentType: typeof ragResults.results[0].content,
          contentLength: ragResults.results[0].content?.length || 0
        } : null
      });

      // Format RAG results into a coherent paragraph
      let relevantDocumentationText = '';
      if (ragResults.results && ragResults.results.length > 0) {
        const documentationParts = ragResults.results
          .filter(result => result.content && typeof result.content === 'string') // Filter out invalid content
          .map((result, index) => {
            return result.content.trim();
          });
        relevantDocumentationText = documentationParts.join(' ');
        
        // Clean up the text - remove extra whitespace and ensure proper sentence flow
        relevantDocumentationText = relevantDocumentationText
          .replace(/\s+/g, ' ')
          .replace(/\.\s*\./g, '.')
          .trim();
      } else {
        relevantDocumentationText = 'No relevant documentation found for this type of company.';
      }

      // Step 3: Generate lead insights and talking points using OpenAI with web search
      console.log(`🧠 Step 3: Generating lead insights and talking points`);
      const leadInsights = await openaiService.generateLeadInsights(lead, relevantDocumentationText);

      // Prepare the research results
      const researchResults = {
        lead: {
          name: lead.name,
          title: lead.title,
          organization_name: companyName,
          linkedin_url: lead.linkedin_url,
          account_linkedin_url: companyLinkedInUrl
        },
        companyDescription,
        relevantDocumentation: relevantDocumentationText, // Now a formatted paragraph
        leadInsights: leadInsights, // Step 3 output - insights and talking points
        ragResults: ragResults.results || [], // Keep original results for debugging
        ragQuery: ragPrompt,
        metadata: {
          researchedAt: new Date(),
          ragResultsCount: ragResults.results?.length || 0,
          ragScore: ragResults.results?.[0]?.score || 0
        }
      };

      console.log(`✅ Lead research completed for ${companyName}`);
      console.log(`📊 Found ${ragResults.results?.length || 0} relevant documentation pieces`);

      return researchResults;

    } catch (error) {
      console.error(`❌ Error performing lead research:`, error);
      throw error;
    }
  }

  /**
   * Process multiple leads for research
   * @param {Array} leads - Array of lead objects
   * @param {Object} config - Configuration for the research
   * @returns {Promise<Array>} Array of research results
   */
  async performBulkLeadResearch(leads, config = {}) {
    try {
      console.log(`🔬 Starting bulk lead research for ${leads.length} leads`);

      const results = [];
      const maxConcurrent = config.maxConcurrent || 3; // Limit concurrent requests

      // Process leads in batches to avoid overwhelming APIs
      for (let i = 0; i < leads.length; i += maxConcurrent) {
        const batch = leads.slice(i, i + maxConcurrent);
        
        const batchPromises = batch.map(async (lead, index) => {
          try {
            const result = await this.performLeadResearch(lead, config);
            return { success: true, data: result, leadIndex: i + index };
          } catch (error) {
            console.error(`❌ Failed to research lead ${lead.name}:`, error.message);
            return { 
              success: false, 
              error: error.message, 
              lead: lead.name,
              leadIndex: i + index 
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches to respect rate limits
        if (i + maxConcurrent < leads.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const successfulResults = results.filter(r => r.success).map(r => r.data);
      const failedResults = results.filter(r => !r.success);

      console.log(`✅ Bulk lead research completed: ${successfulResults.length} successful, ${failedResults.length} failed`);

      return {
        successful: successfulResults,
        failed: failedResults,
        total: leads.length,
        successCount: successfulResults.length,
        failureCount: failedResults.length
      };

    } catch (error) {
      console.error(`❌ Error performing bulk lead research:`, error);
      throw error;
    }
  }

  /**
   * Test the lead research service
   * @returns {Promise<boolean>} True if service is working
   */
  async testService() {
    try {
      // Test OpenAI connection
      const openaiTest = await openaiService.testConnection();
      
      // Test RAG service
      const ragTest = await ragService.testConnection();

      const isHealthy = openaiTest && ragTest;
      
      console.log(`🔬 Lead Research Service Health Check: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
      console.log(`  - OpenAI Service: ${openaiTest ? 'OK' : 'FAILED'}`);
      console.log(`  - RAG Service: ${ragTest ? 'OK' : 'FAILED'}`);

      return isHealthy;
    } catch (error) {
      console.error('❌ Lead Research Service health check failed:', error);
      return false;
    }
  }
}

module.exports = new LeadResearchService();

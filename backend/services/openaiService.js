const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Get company description using OpenAI with web search enabled
   * @param {string} companyLinkedInUrl - Company's LinkedIn URL
   * @param {string} companyName - Company name for context
   * @returns {Promise<string>} Company description
   */
  async getCompanyDescription(companyLinkedInUrl, companyName) {
    try {
      if (!companyLinkedInUrl) {
        throw new Error('Company LinkedIn URL is required');
      }

      console.log(`🔍 Getting company description for ${companyName} from ${companyLinkedInUrl}`);

      const prompt = `Please search the web for information about the company "${companyName}" and their LinkedIn page: ${companyLinkedInUrl}

Based on your web search results, provide a comprehensive company description that includes:
1. What the company does (products/services)
2. Their industry and market focus
3. Key business areas or specializations

Use web search to find current and accurate information about this company.

Keep the description concise but informative, around 1-2 paragraphs.`;

const response = await this.openai.responses.create({
    model: "gpt-5",
    tools: [
        { type: "web_search" },
    ],
    input: prompt,
});


      const description = response.output_text;
      
      if (!description) {
        throw new Error('No description received from OpenAI');
      }

      console.log(`✅ Generated company description for ${companyName}`);
      return description.trim();

    } catch (error) {
      console.error(`❌ Error getting company description for ${companyName}:`, error);
      throw error;
    }
  }

  /**
   * Generate a research prompt for RAG querying
   * @param {string} companyName - Company name
   * @param {string} companyDescription - Company description from step 1
   * @returns {string} Formatted prompt for RAG querying
   */
  generateRagPrompt(companyName, companyDescription) {
    return `The lead's company is a ${companyName} company described as:
"${companyDescription}".

Based on this context, retrieve the parts of our product documentation that 
explain features, benefits, or use cases relevant to this type of company.`;
  }

  /**
   * Generate lead insights and talking points using web search
   * @param {Object} leadData - Lead data from Apollo
   * @param {string} relevantDocumentation - RAG output about relevant product features
   * @returns {Promise<string>} Generated insights and talking points
   */
  async generateLeadInsights(leadData, relevantDocumentation) {
    try {
      console.log(`🧠 Generating lead insights for ${leadData.name} at ${leadData.organization_name}`);

      const prompt = `You are a Lead Research Agent.

You are a Lead Research Agent.

Here is the company data from Apollo:
${JSON.stringify(leadData, null, 2)}

Here are relevant parts of our product, retrieved via Qdrant:
${relevantDocumentation}

Your tasks:

1. Perform a **web search** to find recent and relevant information on the company, such as:
   - Recent announcements, press releases, or product launches  
   - Funding news, acquisitions, or partnerships  
   - Market expansion, leadership changes, or strategic pivots  

2. Summarize **what the company does**, including its business model, key markets, and customers.

3. Based on its industry, size, technology stack (if known), and recent developments, **identify plausible challenges or pain points** the company might face.

4. Link these inferred challenges to our product’s relevant capabilities (from the Qdrant documentation), explaining how our product can provide value in their context.

5. Generate **3–5 personalized insights or angles** for cold email outreach. These should leverage:
   - Their business context  
   - Recent news or triggers  
   - Strategic alignment with our product  

6. Provide **3 specific talking points** that can be used in an outbound email. Make them brief and actionable, focusing on how we can help them right now based on their recent developments.

Please structure your response clearly with numbered sections for each task.`;

      const response = await this.openai.responses.create({
        model: "gpt-5",
        tools: [{ "type": "web_search" }],
        input: prompt
      });

      const insights = response.output_text;

      if (!insights) {
        throw new Error('No insights received from OpenAI');
      }

      console.log(`✅ Generated lead insights for ${leadData.name}`);
      return insights.trim();

    } catch (error) {
      console.error(`❌ Error generating lead insights for ${leadData.name}:`, error);
      throw error;
    }
  }

  /**
   * Test OpenAI API connection
   * @returns {Promise<boolean>} True if connection is successful
   */
  async testConnection() {
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not configured');
      }

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: "Hello, this is a test message."
          }
        ],
        max_tokens: 10
      });

      console.log('✅ OpenAI API connection test successful');
      return true;
    } catch (error) {
      console.error('❌ OpenAI API connection test failed:', error.message);
      return false;
    }
  }
}

module.exports = new OpenAIService();

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

      const prompt = `## **Role**
Please search the web for information about the company "${companyName}" and their LinkedIn page: ${companyLinkedInUrl}

## **Context**
You will use web search to gather current and accurate information about the company.

## **Guidelines**
1. Provide a comprehensive company description that includes:
   - What the company does (products/services)
   - Their industry and market focus
   - Key business areas or specializations

2. Use web search to find current and accurate information about this company.

3. Keep the description concise but informative, around 1–2 paragraphs.
`;

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
    return `## **Role**
You are an AI assistant specialized in **mapping a company’s profile to the most relevant parts of our product documentation**.
Your responsibility is to read the company description and retrieve only those product features, benefits, or use cases that directly match the company’s industry, business model, problems, or workflows.

## **Context**
- The lead’s company is a **${companyName}** company.
- It is described as:
  **"${companyDescription}"**
- You also have access to **our product documentation**, which contains detailed explanations of product features, benefits, and use cases across multiple industries and scenarios.

Your task is to interpret the company description and identify which parts of the product documentation align with:
- the company’s industry,
- its operations,
- its inferred challenges,
- its goals or workflows.

## **Guidelines**
1. **Retrieve Only Relevant Information**
   - Pull only the sections of our product documentation that directly relate to what this type of company may care about.
   - Ignore generic or unrelated product features.

2. **Interpret, Don’t Copy Blindly**
   - Understand the company’s profile and infer which product features would matter most.
   - Prioritize relevance over quantity.

3. **Focus on Value & Use Cases**
   - Highlight benefits and use cases tailored to this company’s type.
   - Include any workflow improvements or industry-specific value propositions.

4. **No Extra Analysis**
   - Your output should include **only** the documentation excerpts or summaries relevant to this company.
   - Do not invent new features not found in the documentation.

`;
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

      const prompt = `## **Role**
You are a Lead Research Agent.

## **Context**
Here is the company data from Apollo:  
${JSON.stringify(leadData, null, 2)}

Here are relevant parts of our product, retrieved via Qdrant:  
${relevantDocumentation}

## **Guidelines**
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

Please structure your response clearly with numbered sections for each task.
`;

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

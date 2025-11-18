const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  /**
   * Draft a professional email using lead insights
   * @param {Object} leadData - The lead information
   * @param {string} leadInsights - The insights generated for this lead
   * @param {string} messagingStyle - Optional messaging style example
   * @param {string} agentName - Name of the agent
   * @returns {Promise<{email_subject: string, email_body: string}>}
   */
  async draftEmail(leadData, leadInsights, messagingStyle = null, agentName = 'Sales Agent') {
    try {
      const prompt = this.buildEmailDraftPrompt(leadData, leadInsights, messagingStyle, agentName);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the response to extract subject and body
      return this.parseEmailResponse(text);
    } catch (error) {
      console.error('Error drafting email with Gemini:', error);
      throw new Error(`Failed to draft email: ${error.message}`);
    }
  }

  /**
   * Build the prompt for email drafting
   * @param {Object} leadData - The lead information
   * @param {string} leadInsights - The insights generated for this lead
   * @param {string} messagingStyle - Optional messaging style example
   * @param {string} agentName - Name of the agent
   * @returns {string} The formatted prompt
   */
  buildEmailDraftPrompt(leadData, leadInsights, messagingStyle = null, agentName = 'Sales Agent') {
    let prompt = `
    ## **Role**
    You are a professional sales email writer acting as "${agentName}". Based on the lead information and research insights provided, draft a personalized cold outreach email.

## **Lead Information**
- Name: ${leadData.first_name} ${leadData.last_name}
- Title: ${leadData.title}
- Company: ${leadData.organization_name}
- LinkedIn: ${leadData.linkedin_url}

## **Research Insights**
${leadInsights}`;

    // Add messaging style if provided
    if (messagingStyle && messagingStyle.trim()) {
      prompt += `

## **Messaging Style Example**
Use this as a reference for tone, style, and approach (but don't copy it exactly):
${messagingStyle}`;
    }

    prompt += `

## **Critical Guidelines**
1. Write a professional, personalized cold email making sure to address the **lead by name**.
2. Use the research insights to make it relevant and compelling
3. Keep it concise (150-200 words max)
4. Include a clear value proposition
5. End with a soft call-to-action
6. Use a professional but friendly tone`;

    if (messagingStyle && messagingStyle.trim()) {
      prompt += `
7. Match the tone and style of the messaging example provided above`;
    }

    prompt += `

## **Format Your Response Exactly As Follows**
SUBJECT: [Your email subject line here]

BODY:
[Your email body here]

Make sure to start with "SUBJECT:" and "BODY:" exactly as shown above.`;

    return prompt;
  }

  /**
   * Parse the Gemini response to extract subject and body
   * @param {string} response - The raw response from Gemini
   * @returns {Object} Parsed email with subject and body
   */
  parseEmailResponse(response) {
    try {
      const lines = response.split('\n');
      let subject = '';
      let body = '';
      let isBody = false;

      for (const line of lines) {
        if (line.startsWith('SUBJECT:')) {
          subject = line.replace('SUBJECT:', '').trim();
        } else if (line.startsWith('BODY:')) {
          isBody = true;
        } else if (isBody && line.trim()) {
          body += line + '\n';
        }
      }

      // Clean up the body
      body = body.trim();

      // Fallback parsing if the format wasn't followed exactly
      if (!subject || !body) {
        const subjectMatch = response.match(/SUBJECT:\s*(.+)/i);
        const bodyMatch = response.match(/BODY:\s*([\s\S]+)/i);
        
        if (subjectMatch) subject = subjectMatch[1].trim();
        if (bodyMatch) body = bodyMatch[1].trim();
      }

      // Final fallback - use the entire response as body if parsing fails
      if (!subject && !body) {
        const lines = response.split('\n');
        subject = lines[0] || 'Personalized Outreach';
        body = lines.slice(1).join('\n').trim() || response;
      }

      return {
        email_subject: subject || 'Personalized Outreach',
        email_body: body || response
      };
    } catch (error) {
      console.error('Error parsing email response:', error);
      return {
        email_subject: 'Personalized Outreach',
        email_body: response
      };
    }
  }

  /**
   * Draft emails for multiple leads in bulk
   * @param {Array} leadsWithInsights - Array of {leadData, leadInsights} objects
   * @param {number} maxConcurrent - Maximum concurrent requests
   * @param {string} messagingStyle - Optional messaging style example
   * @param {string} agentName - Name of the agent
   * @returns {Promise<Array>} Array of drafted emails
   */
  async draftBulkEmails(leadsWithInsights, maxConcurrent = 3, messagingStyle = null, agentName = 'Sales Agent') {
    const results = [];
    
    // Process leads in batches to avoid rate limiting
    for (let i = 0; i < leadsWithInsights.length; i += maxConcurrent) {
      const batch = leadsWithInsights.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async ({ leadData, leadInsights }) => {
        try {
          const emailDraft = await this.draftEmail(leadData, leadInsights, messagingStyle, agentName);
          return {
            leadId: leadData.id || `${leadData.first_name}_${leadData.last_name}`,
            leadData,
            leadInsights,
            ...emailDraft,
            status: 'success'
          };
        } catch (error) {
          console.error(`Error drafting email for lead ${leadData.first_name} ${leadData.last_name}:`, error);
          return {
            leadId: leadData.id || `${leadData.first_name}_${leadData.last_name}`,
            leadData,
            leadInsights,
            email_subject: 'Error generating subject',
            email_body: 'Error generating email body',
            status: 'error',
            error: error.message
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to be respectful to the API
      if (i + maxConcurrent < leadsWithInsights.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}

module.exports = new GeminiService();

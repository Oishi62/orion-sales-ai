const geminiService = require('./geminiService');

class DraftEmailService {
  /**
   * Process leads from Lead Research node and draft emails for each
   * @param {Array} leads - Array of leads with their research data
   * @param {Object} config - Configuration for email drafting
   * @returns {Promise<Object>} Results with drafted emails
   */
  async processLeadsForEmailDrafting(leads, config = {}) {
    try {
      console.log(`Starting email drafting for ${leads.length} leads`);
      
      const maxConcurrent = config.maxConcurrent || 3;
      const draftedEmails = [];
      const errors = [];

      // Prepare leads with insights for email drafting
      const leadsWithInsights = leads.map(lead => ({
        leadData: {
          id: lead.id || `${lead.first_name}_${lead.last_name}`,
          first_name: lead.first_name,
          last_name: lead.last_name,
          name: lead.name,
          title: lead.title,
          organization_name: lead.organization_name,
          linkedin_url: lead.linkedin_url,
          email: lead.email,
          email_status: lead.email_status
        },
        leadInsights: lead.leadInsights || lead.insights || ''
      }));

      // Filter out leads without insights
      const validLeads = leadsWithInsights.filter(({ leadData, leadInsights }) => {
        if (!leadInsights || leadInsights.trim() === '') {
          console.warn(`Skipping lead ${leadData?.first_name} ${leadData?.last_name} - no insights available`);
          return false;
        }
        return true;
      });

      if (validLeads.length === 0) {
        throw new Error('No leads with valid insights found for email drafting');
      }

      console.log(`Drafting emails for ${validLeads.length} leads with valid insights`);

      // Use Gemini service to draft emails in bulk
      const emailResults = await geminiService.draftBulkEmails(validLeads, maxConcurrent, config.messagingStyle, config.agentName);

      // Process results
      for (const result of emailResults) {
        if (result.status === 'success') {
          draftedEmails.push({
            leadId: result.leadId,
            leadData: result.leadData,
            leadInsights: result.leadInsights,
            email_subject: result.email_subject,
            email_body: result.email_body,
            status: 'success'
          });
        } else {
          errors.push({
            leadId: result.leadId,
            leadData: result.leadData,
            error: result.error,
            status: 'error'
          });
        }
      }

      const summary = {
        totalLeads: leads.length,
        leadsWithInsights: validLeads.length,
        successfulDrafts: draftedEmails.length,
        errors: errors.length,
        successRate: validLeads.length > 0 ? (draftedEmails.length / validLeads.length * 100).toFixed(1) : 0
      };

      console.log('Email drafting completed:', summary);

      return {
        draftedEmails,
        errors,
        summary,
        metadata: {
          processedAt: new Date().toISOString(),
          maxConcurrent,
          ...summary
        }
      };

    } catch (error) {
      console.error('Error in email drafting service:', error);
      throw new Error(`Email drafting failed: ${error.message}`);
    }
  }

  /**
   * Draft email for a single lead
   * @param {Object} leadData - The lead information
   * @param {string} leadInsights - The insights for this lead
   * @param {string} messagingStyle - Optional messaging style example
   * @param {string} agentName - Name of the agent
   * @returns {Promise<Object>} Drafted email result
   */
  async draftSingleEmail(leadData, leadInsights, messagingStyle = null, agentName = 'Sales Agent') {
    try {
      if (!leadInsights || leadInsights.trim() === '') {
        throw new Error('No insights available for email drafting');
      }

      const emailDraft = await geminiService.draftEmail(leadData, leadInsights, messagingStyle, agentName);
      
      return {
        leadId: leadData.id || `${leadData.first_name}_${leadData.last_name}`,
        leadData,
        leadInsights,
        ...emailDraft,
        status: 'success',
        draftedAt: new Date().toISOString()
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
        error: error.message,
        draftedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Validate lead data for email drafting
   * @param {Object} leadData - The lead data to validate
   * @returns {boolean} Whether the lead data is valid
   */
  validateLeadData(leadData) {
    const requiredFields = ['first_name', 'last_name', 'organization_name'];
    
    for (const field of requiredFields) {
      if (!leadData[field] || leadData[field].trim() === '') {
        console.warn(`Lead missing required field: ${field}`);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Format email draft for storage/display
   * @param {Object} emailDraft - The drafted email
   * @returns {Object} Formatted email draft
   */
  formatEmailDraft(emailDraft) {
    return {
      leadId: emailDraft.leadId,
      leadName: `${emailDraft.leadData.first_name} ${emailDraft.leadData.last_name}`,
      leadTitle: emailDraft.leadData.title,
      leadCompany: emailDraft.leadData.organization_name,
      leadEmail: emailDraft.leadData.email,
      emailSubject: emailDraft.email_subject,
      emailBody: emailDraft.email_body,
      status: emailDraft.status,
      error: emailDraft.error,
      draftedAt: emailDraft.draftedAt || new Date().toISOString()
    };
  }
}

module.exports = new DraftEmailService();

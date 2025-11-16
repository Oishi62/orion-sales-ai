const axios = require('axios');

class ApolloService {
  constructor() {
    this.apiKey = process.env.APOLLO_API_KEY;
    this.baseURL = 'https://api.apollo.io/api/v1';
    
    if (!this.apiKey) {
      console.warn('Apollo API key not found in environment variables');
    }

    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }

  /**
   * Search for people using Apollo API
   * @param {Object} searchParams - Search parameters
   * @param {number} limit - Number of leads to fetch (default: 25, max: 100)
   * @returns {Promise<Object>} Apollo API response
   */
  async searchPeople(searchParams, limit = 25) {
    try {
      if (!this.apiKey) {
        throw new Error('Apollo API key is not configured');
      }

      // Prepare the request payload
      const payload = {
        ...searchParams,
        page: 1,
        per_page: Math.min(limit, 100) // Apollo API max is 100 per request
      };

      console.log('🔍 Apollo API Request:', {
        url: `${this.baseURL}/mixed_people/search`,
        payload: JSON.stringify(payload, null, 2)
      });

      const response = await this.client.post('/mixed_people/search', payload, {
        headers: {
          'X-Api-Key': this.apiKey
        }
      });

      console.log('✅ Apollo API Response:', {
        status: response.status,
        totalResults: response.data?.pagination?.total_entries || 0,
        returnedResults: response.data?.people?.length || 0
      });

      return response.data;
    } catch (error) {
      console.error('❌ Apollo API Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Convert Agent ICP data to Apollo search parameters
   * @param {Object} agent - Agent object with apollo ICP data
   * @returns {Object} Apollo search parameters
   */
  convertAgentToApolloParams(agent) {
    const apolloData = agent.apollo || {};
    const searchParams = {};

    // Job titles
    if (apolloData.jobTitles && apolloData.jobTitles.length > 0) {
      searchParams.person_titles = apolloData.jobTitles;
    }

    // Company names
    if (apolloData.companies && apolloData.companies.length > 0) {
      searchParams.organization_names = apolloData.companies;
    }

    // Locations
    if (apolloData.locations && apolloData.locations.length > 0) {
      searchParams.person_locations = apolloData.locations;
    }

    // Company size (employee range)
    if (apolloData.employeeRange) {
      const employeeRangeMap = {
        '1-10': { min: 1, max: 10 },
        '11-50': { min: 11, max: 50 },
        '51-200': { min: 51, max: 200 },
        '201-500': { min: 201, max: 500 },
        '501-1000': { min: 501, max: 1000 },
        '1001-5000': { min: 1001, max: 5000 },
        '5001+': { min: 5001, max: null }
      };

      const range = employeeRangeMap[apolloData.employeeRange];
      if (range) {
        searchParams.organization_num_employees_ranges = [apolloData.employeeRange];
      }
    }

    // Company types
    if (apolloData.companyTypes) {
      const companyTypes = [];
      if (apolloData.companyTypes.public) companyTypes.push('public');
      if (apolloData.companyTypes.private) companyTypes.push('private');
      if (companyTypes.length > 0) {
        searchParams.organization_types = companyTypes;
      }
    }

    // Funding stages
    if (apolloData.fundingStages && apolloData.fundingStages.length > 0) {
      searchParams.organization_funding_stage_list = apolloData.fundingStages;
    }

    // Revenue range
    if (apolloData.revenue && apolloData.revenue.type === 'is between') {
      // Apollo uses revenue ranges, we'll need to map our min/max to their ranges
      // For now, we'll skip this as it requires specific Apollo range values
    }

    console.log('🎯 Converted Agent ICP to Apollo params:', {
      agentId: agent._id,
      apolloParams: searchParams
    });

    return searchParams;
  }

  /**
   * Enrich people data using bulk enrichment API
   * @param {Array} people - Array of people objects to enrich
   * @returns {Promise<Array>} Array of enriched people objects
   */
  async bulkEnrichPeople(people) {
    try {
      if (!this.apiKey) {
        throw new Error('Apollo API key is not configured');
      }

      if (!people || people.length === 0) {
        return [];
      }

      // Prepare details array for bulk enrichment
      const details = people.map(person => {
        const detail = {};
        
        // Add available identifiers
        if (person.first_name) detail.first_name = person.first_name;
        if (person.last_name) detail.last_name = person.last_name;
        if (person.name) detail.name = person.name;
        if (person.linkedin_url) detail.linkedin_url = person.linkedin_url;
        if (person.organization_name) detail.organization_name = person.organization_name;
        if (person.title) detail.title = person.title;
        
        return detail;
      });

      const payload = {
        details: details,
        reveal_personal_emails: true,
        reveal_phone_number: false // Set to true if you want phone numbers too
      };

      console.log('📧 Apollo Bulk Enrichment Request:', {
        url: `${this.baseURL}/people/bulk_match`,
        peopleCount: details.length
      });

      const response = await this.client.post('/people/bulk_match', payload, {
        headers: {
          'X-Api-Key': this.apiKey
        }
      });

      console.log('✅ Apollo Bulk Enrichment Response:', {
        status: response.status,
        enrichedCount: response.data?.matches?.length || 0
      });

      return response.data?.matches || [];
    } catch (error) {
      console.error('❌ Apollo Bulk Enrichment Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Fetch leads for a specific agent and enrich their emails
   * @param {Object} agent - Agent object with ICP data
   * @param {number} limit - Number of leads to fetch
   * @returns {Promise<Array>} Array of formatted and enriched lead objects
   */
  async fetchLeadsForAgent(agent, limit = 25) {
    try {
      const searchParams = this.convertAgentToApolloParams(agent);
      
      if (Object.keys(searchParams).length === 0) {
        throw new Error('No valid search parameters found in agent ICP data');
      }

      const apolloResponse = await this.searchPeople(searchParams, limit);
      
      if (!apolloResponse.people || apolloResponse.people.length === 0) {
        return [];
      }

      // Format the leads to match our required structure
      let formattedLeads = apolloResponse.people.map(person => ({
        first_name: person.first_name,
        last_name: person.last_name,
        name: person.name,
        linkedin_url: person.linkedin_url,
        title: person.title,
        organization_name: person.organization?.name || null,
        email_status: person.email_status,
        email: person.email,
        // Additional useful fields
        apollo_id: person.id,
        organization_id: person.organization?.id || null,
        city: person.city,
        state: person.state,
        country: person.country,
        industry: person.organization?.industry || null,
        company_size: person.organization?.estimated_num_employees || null,
        // Company LinkedIn URL
        account_linkedin_url: person.organization?.linkedin_url || null
      }));

      console.log(`✅ Fetched ${formattedLeads.length} leads for agent ${agent._id}`);
      
      // Log email status for debugging
      formattedLeads.forEach((lead, index) => {
        console.log(`Lead ${index + 1}: ${lead.name} - Email: ${lead.email || 'NO EMAIL'} - Status: ${lead.email_status || 'NO STATUS'}`);
      });

      // For now, let's try to enrich ALL leads to get better email data
      // Later we can optimize this to only enrich specific cases
      const leadsNeedingEnrichment = formattedLeads;

      if (leadsNeedingEnrichment.length > 0) {
        console.log(`📧 Enriching emails for ${leadsNeedingEnrichment.length} leads...`);
        
        try {
          const enrichedData = await this.bulkEnrichPeople(leadsNeedingEnrichment);
          
          // Update the leads with enriched email data
          const enrichmentMap = new Map();
          enrichedData.forEach(enriched => {
            // Create a key to match enriched data back to original leads
            const key = `${enriched.first_name}_${enriched.last_name}_${enriched.organization_name}`.toLowerCase();
            enrichmentMap.set(key, enriched);
          });

          formattedLeads = formattedLeads.map(lead => {
            const key = `${lead.first_name}_${lead.last_name}_${lead.organization_name}`.toLowerCase();
            const enrichedLead = enrichmentMap.get(key);
            
            if (enrichedLead && enrichedLead.email) {
              return {
                ...lead,
                email: enrichedLead.email,
                email_status: enrichedLead.email_status || 'enriched',
                // Update other enriched fields if available
                linkedin_url: enrichedLead.linkedin_url || lead.linkedin_url,
                title: enrichedLead.title || lead.title
              };
            }
            
            return lead;
          });

          const enrichedCount = formattedLeads.filter(lead => lead.email && lead.email_status === 'enriched').length;
          console.log(`✅ Successfully enriched emails for ${enrichedCount} leads`);
        } catch (enrichmentError) {
          console.warn('⚠️ Email enrichment failed, returning leads without enrichment:', enrichmentError.message);
          // Continue with original leads if enrichment fails
        }
      }
      
      return formattedLeads;
    } catch (error) {
      console.error(`❌ Error fetching leads for agent ${agent._id}:`, error);
      throw error;
    }
  }

  /**
   * Test Apollo API connection
   * @returns {Promise<boolean>} True if connection is successful
   */
  async testConnection() {
    try {
      if (!this.apiKey) {
        throw new Error('Apollo API key is not configured');
      }

      // Make a simple test request with minimal parameters
      const response = await this.client.post('/mixed_people/search', {
        person_titles: ['CEO'],
        per_page: 1
      }, {
        headers: {
          'X-Api-Key': this.apiKey
        }
      });

      console.log('✅ Apollo API connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Apollo API connection test failed:', error.message);
      return false;
    }
  }
}

module.exports = new ApolloService();

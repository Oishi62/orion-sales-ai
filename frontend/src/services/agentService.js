import axios from 'axios';
import { safeLog, sanitizeForLogging } from '../utils/security';

// Create axios instance with base configuration
const agentAPI = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
agentAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in development (with sanitized data)
    if (process.env.NODE_ENV === 'development') {
      safeLog.log('🚀 Agent API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: sanitizeForLogging(config.data)
      });
    }
    
    return config;
  },
  (error) => {
    safeLog.error('❌ Agent API Request Error:', sanitizeForLogging(error));
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
agentAPI.interceptors.response.use(
  (response) => {
    // Log response in development (with sanitized data)
    if (process.env.NODE_ENV === 'development') {
      safeLog.log('✅ Agent API Response:', {
        status: response.status,
        url: response.config.url,
        data: sanitizeForLogging(response.data)
      });
    }
    
    return response;
  },
  (error) => {
    const sanitizedError = sanitizeForLogging(error.response?.data || error.message);
    safeLog.error('❌ Agent API Response Error:', sanitizedError);
    
    // Handle common error scenarios
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/signin';
    }
    
    return Promise.reject(error);
  }
);

const agentService = {
  /**
   * Create a new agent (Step 1: Agent Configuration)
   * @param {Object} agentData - Agent configuration data
   * @returns {Promise<Object>} API response
   */
  async createAgent(agentData) {
    try {
      const response = await agentAPI.post('/agents', {
        name: agentData.name,
        description: agentData.description
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create agent');
    }
  },

  /**
   * Update agent basic information (name, description)
   * @param {string} agentId - Agent ID
   * @param {Object} agentData - Agent data to update
   * @returns {Promise<Object>} API response
   */
  async updateAgent(agentId, agentData) {
    try {
      const response = await agentAPI.put(`/agents/${agentId}`, {
        name: agentData.name,
        description: agentData.description
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to update agent');
    }
  },

  /**
   * Update agent with product information (Step 2)
   * @param {string} agentId - Agent ID
   * @param {Object} productData - Product information data
   * @returns {Promise<Object>} API response
   */
  async updateAgentProduct(agentId, productData) {
    try {
      const response = await agentAPI.put(`/agents/${agentId}/product`, {
        description: productData.description,
        url: productData.url
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to update product information');
    }
  },

  /**
   * Update agent with ICP configuration (Step 3)
   * @param {string} agentId - Agent ID
   * @param {Object} icpData - ICP configuration data
   * @returns {Promise<Object>} API response
   */
  async updateAgentICP(agentId, icpData) {
    try {
      const response = await agentAPI.put(`/agents/${agentId}/icp`, {
        jobTitles: icpData.jobTitles,
        companies: icpData.companies,
        locations: icpData.locations,
        revenueType: icpData.revenueType,
        revenueMin: icpData.revenueMin,
        revenueMax: icpData.revenueMax,
        employeeRange: icpData.employeeRange,
        fundingStages: icpData.fundingStages,
        companyTypes: icpData.companyTypes,
        jobTitlesTab: icpData.jobTitlesTab,
        includeSimilarTitles: icpData.includeSimilarTitles,
        messagingStyle: icpData.messagingStyle
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to update ICP configuration');
    }
  },

  /**
   * Activate an agent (Final step)
   * @param {string} agentId - Agent ID
   * @returns {Promise<Object>} API response
   */
  async activateAgent(agentId) {
    try {
      const response = await agentAPI.put(`/agents/${agentId}/activate`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to activate agent');
    }
  },

  /**
   * Get all agents for the current user
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} API response
   */
  async getUserAgents(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.status) {
        params.append('status', filters.status);
      }
      
      if (filters.active !== undefined) {
        params.append('active', filters.active.toString());
      }

      const response = await agentAPI.get(`/agents?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch agents');
    }
  },

  /**
   * Get a single agent by ID
   * @param {string} agentId - Agent ID
   * @returns {Promise<Object>} API response
   */
  async getAgentById(agentId) {
    try {
      const response = await agentAPI.get(`/agents/${agentId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch agent');
    }
  },

  /**
   * Delete an agent
   * @param {string} agentId - Agent ID
   * @returns {Promise<Object>} API response
   */
  async deleteAgent(agentId) {
    try {
      const response = await agentAPI.delete(`/agents/${agentId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to delete agent');
    }
  },

  /**
   * Handle API errors consistently
   * @param {Error} error - The error object
   * @param {string} defaultMessage - Default error message
   * @returns {Error} Formatted error
   */
  handleError(error, defaultMessage) {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    } else if (error.response?.data?.errors) {
      // Handle validation errors
      const validationErrors = error.response.data.errors
        .map(err => err.msg)
        .join(', ');
      return new Error(`Validation failed: ${validationErrors}`);
    } else if (error.message) {
      return new Error(error.message);
    } else {
      return new Error(defaultMessage);
    }
  }
};

export default agentService;

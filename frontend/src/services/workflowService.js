import axios from 'axios';

// Create axios instance for workflow API
const workflowAPI = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

// Add auth token to requests
workflowAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
workflowAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

class WorkflowService {
  /**
   * Handle API errors consistently
   * @param {Error} error - The error object
   * @param {string} defaultMessage - Default error message
   * @returns {Error} Formatted error
   */
  handleError(error, defaultMessage) {
    const message = error.response?.data?.message || defaultMessage;
    const newError = new Error(message);
    newError.status = error.response?.status;
    newError.data = error.response?.data;
    return newError;
  }

  /**
   * Create a new workflow
   * @param {Object} workflowData - Workflow configuration data
   * @returns {Promise<Object>} API response
   */
  async createWorkflow(workflowData) {
    try {
      const response = await workflowAPI.post('/workflows', {
        name: workflowData.name,
        description: workflowData.description,
        nodes: workflowData.nodes || [],
        connections: workflowData.connections || []
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create workflow');
    }
  }

  /**
   * Get all workflows for the current user
   * @param {Object} options - Query options
   * @returns {Promise<Object>} API response
   */
  async getWorkflows(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.status) params.append('status', options.status);
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);

      const response = await workflowAPI.get(`/workflows?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch workflows');
    }
  }

  /**
   * Get workflow by ID
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Object>} API response
   */
  async getWorkflow(workflowId) {
    try {
      const response = await workflowAPI.get(`/workflows/${workflowId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch workflow');
    }
  }

  /**
   * Update workflow
   * @param {string} workflowId - Workflow ID
   * @param {Object} workflowData - Updated workflow data
   * @returns {Promise<Object>} API response
   */
  async updateWorkflow(workflowId, workflowData) {
    try {
      const response = await workflowAPI.put(`/workflows/${workflowId}`, workflowData);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to update workflow');
    }
  }

  /**
   * Delete workflow
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Object>} API response
   */
  async deleteWorkflow(workflowId) {
    try {
      const response = await workflowAPI.delete(`/workflows/${workflowId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to delete workflow');
    }
  }

  /**
   * Activate workflow
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Object>} API response
   */
  async activateWorkflow(workflowId) {
    try {
      const response = await workflowAPI.post(`/workflows/${workflowId}/activate`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to activate workflow');
    }
  }

  /**
   * Pause workflow
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Object>} API response
   */
  async pauseWorkflow(workflowId) {
    try {
      const response = await workflowAPI.post(`/workflows/${workflowId}/pause`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to pause workflow');
    }
  }

  /**
   * Execute workflow manually
   * @param {string} workflowId - Workflow ID
   * @param {Object} input - Input data for execution
   * @returns {Promise<Object>} API response
   */
  async executeWorkflow(workflowId, input = {}) {
    try {
      const response = await workflowAPI.post(`/workflows/${workflowId}/execute`, { input });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to execute workflow');
    }
  }

  /**
   * Get workflow executions
   * @param {string} workflowId - Workflow ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} API response
   */
  async getWorkflowExecutions(workflowId, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);

      const response = await workflowAPI.get(`/workflows/${workflowId}/executions?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch workflow executions');
    }
  }

  /**
   * Get agents for workflow nodes
   * @returns {Promise<Object>} API response
   */
  async getAgentsForWorkflow() {
    try {
      const response = await workflowAPI.get('/agents/workflow');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch agents for workflow');
    }
  }
}

export default new WorkflowService();

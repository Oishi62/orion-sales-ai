import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

const ragService = {
  // Get RAG processing status for a specific document
  async getDocumentRAGStatus(agentId, documentId) {
    const response = await api.get(`/rag/agents/${agentId}/documents/${documentId}/rag-status`);
    return response.data;
  },

  // Get all RAG processing statuses for an agent
  async getAgentRAGStatuses(agentId) {
    const response = await api.get(`/rag/agents/${agentId}/rag-status`);
    return response.data;
  },

  // Manually trigger RAG processing for all agent documents
  async processAgentDocuments(agentId) {
    const response = await api.post(`/rag/agents/${agentId}/process-documents`);
    return response.data;
  },

  // Manually trigger RAG processing for a specific document
  async processDocument(agentId, documentId) {
    const response = await api.post(`/rag/agents/${agentId}/documents/${documentId}/process`);
    return response.data;
  },

  // Get RAG statistics for an agent
  async getAgentRAGStats(agentId) {
    const response = await api.get(`/rag/agents/${agentId}/rag-stats`);
    return response.data;
  },

  // RAG health check
  async healthCheck() {
    const response = await api.get('/rag/health');
    return response.data;
  },

  // Poll for processing status updates
  async pollProcessingStatus(agentId, documentId, onUpdate, intervalMs = 2000, maxAttempts = 150) {
    let attempts = 0;
    
    const poll = async () => {
      try {
        attempts++;
        const response = await this.getDocumentRAGStatus(agentId, documentId);
        const status = response.data;
        
        if (onUpdate) {
          onUpdate(status);
        }
        
        // Continue polling if still processing and haven't exceeded max attempts
        if (status && status.status === 'processing' && attempts < maxAttempts) {
          setTimeout(poll, intervalMs);
        } else if (attempts >= maxAttempts) {
          console.warn('RAG processing polling timed out');
          if (onUpdate) {
            onUpdate({ status: 'timeout', message: 'Processing status polling timed out' });
          }
        }
      } catch (error) {
        console.error('Error polling RAG status:', error);
        if (onUpdate) {
          onUpdate({ status: 'error', message: 'Failed to get processing status' });
        }
      }
    };
    
    // Start polling
    poll();
  },

  // Get processing status display text
  getStatusDisplayText(status) {
    if (!status) return 'Unknown';
    
    switch (status.status) {
      case 'processing':
        return status.message || 'Processing document...';
      case 'completed':
        return 'RAG processing completed';
      case 'failed':
        return `Processing failed: ${status.message || 'Unknown error'}`;
      case 'timeout':
        return 'Processing status check timed out';
      case 'error':
        return 'Error checking processing status';
      default:
        return status.message || 'Processing...';
    }
  },

  // Get processing progress percentage
  getProgressPercentage(status) {
    if (!status) return 0;
    return status.progress || 0;
  },

  // Check if processing is complete
  isProcessingComplete(status) {
    if (!status) return false;
    return ['completed', 'failed', 'timeout', 'error'].includes(status.status);
  },

  // Check if processing was successful
  isProcessingSuccessful(status) {
    if (!status) return false;
    return status.status === 'completed';
  }
};

export default ragService;

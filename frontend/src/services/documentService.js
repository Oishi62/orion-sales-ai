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

const documentService = {
  // Upload document
  async uploadDocument(agentId, file, onUploadProgress) {
    console.log('🔍 DocumentService - Upload request for agent:', agentId);
    console.log('🔍 DocumentService - File:', file.name);
    
    const formData = new FormData();
    formData.append('document', file);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    if (onUploadProgress) {
      config.onUploadProgress = onUploadProgress;
    }

    const url = `/agents/${agentId}/documents`;
    console.log('🔍 DocumentService - Request URL:', url);

    const response = await api.post(url, formData, config);
    return response.data;
  },

  // Get all documents for an agent
  async getDocuments(agentId) {
    const response = await api.get(`/agents/${agentId}/documents`);
    return response.data;
  },

  // Delete document
  async deleteDocument(agentId, documentId) {
    const response = await api.delete(`/agents/${agentId}/documents/${documentId}`);
    return response.data;
  },

  // Get document download URL
  async getDocumentUrl(agentId, documentId, expires = 3600) {
    const response = await api.get(`/agents/${agentId}/documents/${documentId}/url`, {
      params: { expires }
    });
    return response.data;
  },

  // Update document
  async updateDocument(agentId, documentId, updateData) {
    const response = await api.put(`/agents/${agentId}/documents/${documentId}`, updateData);
    return response.data;
  },

  // Get document statistics
  async getDocumentStats(agentId) {
    const response = await api.get(`/agents/${agentId}/documents/stats`);
    return response.data;
  },

  // Download document
  async downloadDocument(agentId, documentId) {
    try {
      const urlResponse = await this.getDocumentUrl(agentId, documentId);
      const downloadUrl = urlResponse.data.url;
      
      // Open in new tab for download
      window.open(downloadUrl, '_blank');
      
      return { success: true };
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  }
};

export default documentService;

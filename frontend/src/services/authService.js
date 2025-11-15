import axios from 'axios';
import { safeLog, sanitizeForLogging } from '../utils/security';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request details (sanitized) in development only
    if (process.env.NODE_ENV === 'development') {
      safeLog.log('🚀 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: sanitizeForLogging(config.data)
      });
    }
    
    return config;
  },
  (error) => {
    safeLog.error('❌ Request Error:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses (sanitized) in development only
    if (process.env.NODE_ENV === 'development') {
      safeLog.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        data: sanitizeForLogging(response.data)
      });
    }
    return response;
  },
  (error) => {
    // Log error responses (sanitized)
    safeLog.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message || error.message
    });
    
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Redirect to login page if not already there
      if (window.location.pathname !== '/signin' && window.location.pathname !== '/signup') {
        window.location.href = '/signin';
      }
    }
    
    return Promise.reject(error);
  }
);

class AuthService {
  /**
   * Sign up a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} API response
   */
  async signUp(userData) {
    try {
      const response = await api.post('/auth/signup', userData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Sign in an existing user
   * @param {Object} credentials - User login credentials
   * @returns {Promise<Object>} API response
   */
  async signIn(credentials) {
    try {
      const response = await api.post('/auth/signin', credentials);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get current user profile
   * @returns {Promise<Object>} API response
   */
  async getProfile() {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} API response
   */
  async updateProfile(profileData) {
    try {
      const response = await api.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Verify JWT token
   * @returns {Promise<Object>} API response
   */
  async verifyToken() {
    try {
      const response = await api.get('/auth/verify');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Logout user
   * @returns {Promise<Object>} API response
   */
  async logout() {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Change user password
   * @param {Object} passwordData - Current and new password
   * @returns {Promise<Object>} API response
   */
  async changePassword(passwordData) {
    try {
      const response = await api.put('/auth/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} API response
   */
  async requestPasswordReset(email) {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Reset password with token
   * @param {Object} resetData - Reset token and new password
   * @returns {Promise<Object>} API response
   */
  async resetPassword(resetData) {
    try {
      const response = await api.post('/auth/reset-password', resetData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors consistently
   * @param {Object} error - Axios error object
   * @returns {Error} Formatted error
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      // Handle validation errors
      if (status === 400 && data.errors) {
        const validationErrors = data.errors.map(err => err.msg).join(', ');
        return new Error(validationErrors);
      }
      
      // Handle other server errors
      return new Error(data.message || `Server error: ${status}`);
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your connection and try again.');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred.');
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    const token = localStorage.getItem('token');
    return !!token;
  }

  /**
   * Get stored auth token
   * @returns {string|null} JWT token
   */
  getToken() {
    return localStorage.getItem('token');
  }

  /**
   * Remove auth token
   */
  removeToken() {
    localStorage.removeItem('token');
  }

  /**
   * Set auth token
   * @param {string} token - JWT token
   */
  setToken(token) {
    localStorage.setItem('token', token);
  }
}

export default new AuthService();

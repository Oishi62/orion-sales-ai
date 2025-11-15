/**
 * Frontend security utilities to prevent sensitive data exposure
 */

const sensitiveFields = [
  'password',
  'confirmPassword',
  'currentPassword',
  'newPassword',
  'token',
  'refreshToken',
  'accessToken',
  'authorization'
];

/**
 * Sanitize object by removing sensitive fields
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
export const sanitizeForLogging = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForLogging(item));
  }

  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLogging(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Safe console logging that sanitizes sensitive data
 */
export const safeLog = {
  log: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      const sanitizedArgs = args.map(arg => 
        typeof arg === 'object' ? sanitizeForLogging(arg) : arg
      );
      console.log(...sanitizedArgs);
    }
  },
  
  error: (...args) => {
    const sanitizedArgs = args.map(arg => 
      typeof arg === 'object' ? sanitizeForLogging(arg) : arg
    );
    console.error(...sanitizedArgs);
  },
  
  warn: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      const sanitizedArgs = args.map(arg => 
        typeof arg === 'object' ? sanitizeForLogging(arg) : arg
      );
      console.warn(...sanitizedArgs);
    }
  },
  
  info: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      const sanitizedArgs = args.map(arg => 
        typeof arg === 'object' ? sanitizeForLogging(arg) : arg
      );
      console.info(...sanitizedArgs);
    }
  }
};

/**
 * Remove sensitive data from form data before submission
 * This doesn't affect the actual submission, just prevents logging
 * @param {Object} formData - Form data to sanitize for logging
 * @returns {Object} - Sanitized form data
 */
export const sanitizeFormData = (formData) => {
  return sanitizeForLogging(formData);
};

/**
 * Override global console methods in development to prevent accidental logging
 * This should be called once in the app initialization
 */
export const initializeSecureLogging = () => {
  if (process.env.NODE_ENV === 'development') {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    console.log = (...args) => {
      const sanitizedArgs = args.map(arg => 
        typeof arg === 'object' ? sanitizeForLogging(arg) : arg
      );
      originalLog.apply(console, sanitizedArgs);
    };

    console.error = (...args) => {
      const sanitizedArgs = args.map(arg => 
        typeof arg === 'object' ? sanitizeForLogging(arg) : arg
      );
      originalError.apply(console, sanitizedArgs);
    };

    console.warn = (...args) => {
      const sanitizedArgs = args.map(arg => 
        typeof arg === 'object' ? sanitizeForLogging(arg) : arg
      );
      originalWarn.apply(console, sanitizedArgs);
    };

    console.info = (...args) => {
      const sanitizedArgs = args.map(arg => 
        typeof arg === 'object' ? sanitizeForLogging(arg) : arg
      );
      originalInfo.apply(console, sanitizedArgs);
    };
  }
};

/**
 * Secure storage utilities
 */
export const secureStorage = {
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      safeLog.error('Failed to store item:', { key, error: error.message });
    }
  },
  
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      safeLog.error('Failed to retrieve item:', { key, error: error.message });
      return null;
    }
  },
  
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      safeLog.error('Failed to remove item:', { key, error: error.message });
    }
  }
};

export default {
  sanitizeForLogging,
  safeLog,
  sanitizeFormData,
  initializeSecureLogging,
  secureStorage
};

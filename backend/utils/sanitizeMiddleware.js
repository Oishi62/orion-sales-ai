/**
 * Middleware to sanitize sensitive data from requests and responses
 * Prevents passwords and other sensitive data from being logged
 */

const sensitiveFields = [
  'password',
  'confirmPassword',
  'currentPassword',
  'newPassword',
  'token',
  'refreshToken',
  'accessToken',
  'authorization',
  'cookie',
  'session'
];

/**
 * Recursively sanitize an object by replacing sensitive field values
 * @param {Object} obj - Object to sanitize
 * @param {Array} fields - Array of field names to sanitize
 * @returns {Object} - Sanitized object
 */
const sanitizeObject = (obj, fields = sensitiveFields) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, fields));
  }

  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    if (fields.some(field => lowerKey.includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, fields);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Middleware to sanitize request body before logging
 */
const sanitizeRequest = (req, res, next) => {
  // Store original body for processing
  req.originalBody = req.body;
  
  // Create sanitized version for logging
  if (req.body && typeof req.body === 'object') {
    req.sanitizedBody = sanitizeObject(req.body);
  }
  
  next();
};

/**
 * Override console methods to sanitize sensitive data
 */
const sanitizeConsole = () => {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;

  console.log = (...args) => {
    const sanitizedArgs = args.map(arg => 
      typeof arg === 'object' ? sanitizeObject(arg) : arg
    );
    originalLog.apply(console, sanitizedArgs);
  };

  console.error = (...args) => {
    const sanitizedArgs = args.map(arg => 
      typeof arg === 'object' ? sanitizeObject(arg) : arg
    );
    originalError.apply(console, sanitizedArgs);
  };

  console.warn = (...args) => {
    const sanitizedArgs = args.map(arg => 
      typeof arg === 'object' ? sanitizeObject(arg) : arg
    );
    originalWarn.apply(console, sanitizedArgs);
  };

  console.info = (...args) => {
    const sanitizedArgs = args.map(arg => 
      typeof arg === 'object' ? sanitizeObject(arg) : arg
    );
    originalInfo.apply(console, sanitizedArgs);
  };
};

/**
 * Express middleware to log requests without sensitive data
 */
const requestLogger = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    const logData = {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.sanitizedBody || '[No body]',
      timestamp: new Date().toISOString()
    };
    
    console.log('📝 Request:', logData);
  }
  
  next();
};

/**
 * Sanitize error objects before logging
 */
const sanitizeError = (error) => {
  if (!error || typeof error !== 'object') {
    return error;
  }

  const sanitized = {
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    name: error.name,
    code: error.code,
    status: error.status || error.statusCode
  };

  // Remove any sensitive data from error details
  if (error.details) {
    sanitized.details = sanitizeObject(error.details);
  }

  return sanitized;
};

module.exports = {
  sanitizeObject,
  sanitizeRequest,
  sanitizeConsole,
  requestLogger,
  sanitizeError,
  sensitiveFields
};

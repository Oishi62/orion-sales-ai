const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const { sanitizeRequest, sanitizeConsole, requestLogger } = require('./utils/sanitizeMiddleware');

// Initialize console sanitization to prevent password logging
sanitizeConsole();

const app = express();

// Trust proxy for rate limiting (required when behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Sanitize sensitive data from requests
app.use(sanitizeRequest);

// Request logging (only in development, with sanitized data)
if (process.env.NODE_ENV !== 'production') {
  app.use(requestLogger);
}

// Routes
const agentRoutes = require('./routes/agentRoutes');
const documentRoutes = require('./routes/documentRoutes');
const ragRoutes = require('./routes/ragRoutes');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api', documentRoutes);
app.use('/api/rag', ragRoutes);

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salesai', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Connect to database and initialize S3
const initializeServices = async () => {
  await connectDB();
  
  // Initialize S3 bucket if AWS credentials are provided
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.S3_BUCKET_NAME) {
    try {
      const { initializeS3Bucket } = require('./config/s3Config');
      await initializeS3Bucket();
      console.log('✅ S3 bucket initialized successfully');
    } catch (error) {
      console.warn('⚠️ S3 initialization failed:', error.message);
      console.warn('Document upload functionality may not work properly');
    }
  } else {
    console.warn('⚠️ AWS credentials not found. Document upload functionality will be disabled.');
  }

  // Initialize RAG services if credentials are provided
  if (process.env.QDRANT_URL && process.env.QDRANT_API_KEY && process.env.OPENAI_API_KEY) {
    try {
      const ragService = require('./services/ragService');
      await ragService.initialize();
      console.log('✅ RAG services initialized successfully');
    } catch (error) {
      console.warn('⚠️ RAG services initialization failed:', error.message);
      console.warn('Document RAG processing functionality may not work properly');
    }
  } else {
    console.warn('⚠️ RAG credentials not found (QDRANT_URL, QDRANT_API_KEY, OPENAI_API_KEY). RAG functionality will be disabled.');
  }
};

initializeServices();

// Error handling middleware
app.use((err, req, res, next) => {
  const { sanitizeError } = require('./utils/sanitizeMiddleware');
  const sanitizedError = sanitizeError(err);
  
  console.error('❌ Server Error:', sanitizedError);
  
  res.status(err.status || 500).json({ 
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : {
      name: err.name,
      message: err.message,
      // Don't include stack trace in response, only in logs
    }
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

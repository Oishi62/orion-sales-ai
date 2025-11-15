const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure AWS S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Custom multer storage for AWS SDK v3
const multerS3Storage = {
  _handleFile: async (req, file, cb) => {
    try {
      // Generate unique filename with timestamp
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      const key = `salesai/${uniqueSuffix}${extension}`;

      // Collect file data
      const chunks = [];
      file.stream.on('data', (chunk) => chunks.push(chunk));
      file.stream.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          
          // Upload to S3
          const uploadCommand = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: file.mimetype,
            Metadata: {
              fieldName: file.fieldname,
              originalName: file.originalname,
              uploadedBy: req.user?.userId || 'anonymous',
              uploadedAt: new Date().toISOString()
            }
          });

          await s3Client.send(uploadCommand);

          // Return file info
          cb(null, {
            bucket: process.env.S3_BUCKET_NAME,
            key: key,
            location: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
            size: buffer.length,
            mimetype: file.mimetype,
            originalname: file.originalname
          });
        } catch (error) {
          cb(error);
        }
      });
      
      file.stream.on('error', cb);
    } catch (error) {
      cb(error);
    }
  },
  _removeFile: (req, file, cb) => {
    // Optional: implement file removal logic
    cb(null);
  }
};

// Multer configuration
const upload = multer({
  storage: multerS3Storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow only specific file types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

// Function to delete file from S3
const deleteFromS3 = async (fileKey) => {
  try {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey
    });
    
    await s3Client.send(deleteCommand);
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw error;
  }
};

// Function to get signed URL for file access
const getSignedUrlForFile = async (fileKey, expires = 3600) => {
  try {
    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey
    });
    
    const signedUrl = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: expires });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
};

// Function to check if S3 bucket exists and create salesai folder
const initializeS3Bucket = async () => {
  try {
    // Check if bucket exists
    const headBucketCommand = new HeadBucketCommand({ 
      Bucket: process.env.S3_BUCKET_NAME 
    });
    await s3Client.send(headBucketCommand);
    
    // Create a placeholder object to ensure salesai folder exists
    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: 'salesai/.keep',
      Body: 'This file ensures the salesai folder exists',
      ContentType: 'text/plain'
    });
    
    await s3Client.send(putObjectCommand);
    console.log('S3 bucket initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing S3 bucket:', error);
    throw error;
  }
};

module.exports = {
  s3Client,
  upload,
  deleteFromS3,
  getSignedUrl: getSignedUrlForFile,
  initializeS3Bucket
};

const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client } = require('../config/s3Config');

// Set up pdfjs-dist for Node.js environment
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

// Configure worker for Node.js
const pdfjsWorker = require('pdfjs-dist/legacy/build/pdf.worker.js');

// Set up canvas for Node.js
const { createCanvas, createImageData } = require('canvas');

// Polyfill for Node.js environment
if (typeof globalThis !== 'undefined') {
  // Set up canvas factory for pdfjs
  globalThis.NodeCanvasFactory = class NodeCanvasFactory {
    create(width, height) {
      const canvas = createCanvas(width, height);
      const context = canvas.getContext('2d');
      return { canvas, context };
    }
    
    reset(canvasAndContext, width, height) {
      canvasAndContext.canvas.width = width;
      canvasAndContext.canvas.height = height;
    }
    
    destroy(canvasAndContext) {
      canvasAndContext.canvas.width = 0;
      canvasAndContext.canvas.height = 0;
      canvasAndContext.canvas = null;
      canvasAndContext.context = null;
    }
  };
}

class DocumentProcessorService {
  constructor() {
    this.chunkSize = 1000; // Characters per chunk
    this.chunkOverlap = 200; // Overlap between chunks
  }

  // Download document from S3
  async downloadDocumentFromS3(s3Key) {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key
      });

      const response = await s3Client.send(command);
      
      // Convert stream to buffer
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks);
    } catch (error) {
      console.error('❌ Error downloading document from S3:', error);
      throw error;
    }
  }

  // Extract text from different document types
  async extractTextFromDocument(buffer, mimeType, fileName) {
    try {
      console.log(`🔄 Extracting text from ${fileName} (${mimeType})`);
      
      let text = '';
      
      switch (mimeType) {
        case 'application/pdf':
          text = await this.extractTextFromPDF(buffer);
          break;
          
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          text = await this.extractTextFromWord(buffer);
          break;
          
        case 'text/plain':
          text = buffer.toString('utf-8');
          break;
          
        default:
          throw new Error(`Unsupported document type: ${mimeType}`);
      }

      console.log(`✅ Extracted ${text.length} characters from ${fileName}`);
      return text;
    } catch (error) {
      console.error('❌ Error extracting text from document:', error);
      throw error;
    }
  }

  // Extract text from PDF using pdfjs-dist
  async extractTextFromPDF(buffer) {
    try {
      console.log('🔄 Loading PDF document...');
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({
        data: buffer,
        verbosity: 0,
        isEvalSupported: false,
        disableFontFace: true,
        useSystemFonts: true
      });
      
      const pdfDocument = await loadingTask.promise;
      console.log(`📄 PDF loaded with ${pdfDocument.numPages} pages`);
      
      let fullText = '';
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
        try {
          console.log(`🔄 Processing page ${pageNum}/${pdfDocument.numPages}`);
          
          const page = await pdfDocument.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Combine all text items from the page
          const pageText = textContent.items
            .filter(item => item.str && item.str.trim())
            .map(item => item.str)
            .join(' ');
          
          if (pageText.trim()) {
            fullText += pageText + '\n\n';
          }
          
          // Clean up page resources
          page.cleanup();
        } catch (pageError) {
          console.warn(`⚠️ Error processing page ${pageNum}:`, pageError.message);
          // Continue with other pages
        }
      }
      
      // Clean up document resources
      pdfDocument.destroy();
      
      const extractedText = fullText.trim();
      console.log(`✅ Extracted ${extractedText.length} characters from PDF`);
      
      if (!extractedText) {
        throw new Error('No text content found in PDF document');
      }
      
      return extractedText;
    } catch (error) {
      console.error('❌ Error extracting text from PDF:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message || 'Unknown error'}`);
    }
  }

  // Extract text from Word documents
  async extractTextFromWord(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.error('❌ Error extracting text from Word document:', error);
      throw error;
    }
  }

  // Split text into chunks
  chunkText(text, metadata = {}) {
    try {
      console.log(`🔄 Chunking text (${text.length} characters)`);
      
      const chunks = [];
      let start = 0;
      let chunkIndex = 0;

      while (start < text.length) {
        let end = start + this.chunkSize;
        
        // If we're not at the end of the text, try to break at a sentence or word boundary
        if (end < text.length) {
          // Look for sentence boundaries first
          const sentenceEnd = text.lastIndexOf('.', end);
          const questionEnd = text.lastIndexOf('?', end);
          const exclamationEnd = text.lastIndexOf('!', end);
          
          const sentenceBoundary = Math.max(sentenceEnd, questionEnd, exclamationEnd);
          
          if (sentenceBoundary > start + this.chunkSize * 0.5) {
            end = sentenceBoundary + 1;
          } else {
            // Fall back to word boundary
            const wordBoundary = text.lastIndexOf(' ', end);
            if (wordBoundary > start + this.chunkSize * 0.5) {
              end = wordBoundary;
            }
          }
        }

        const chunkText = text.slice(start, end).trim();
        
        if (chunkText.length > 0) {
          chunks.push({
            text: chunkText,
            chunkIndex: chunkIndex,
            startChar: start,
            endChar: end,
            metadata: {
              ...metadata,
              chunkSize: chunkText.length,
              totalChunks: null // Will be set after all chunks are created
            }
          });
          chunkIndex++;
        }

        // Move start position with overlap
        start = Math.max(start + this.chunkSize - this.chunkOverlap, end);
      }

      // Update total chunks count in metadata
      chunks.forEach(chunk => {
        chunk.metadata.totalChunks = chunks.length;
      });

      console.log(`✅ Created ${chunks.length} text chunks`);
      return chunks;
    } catch (error) {
      console.error('❌ Error chunking text:', error);
      throw error;
    }
  }

  // Process complete document: download, extract, chunk
  async processDocument(document) {
    try {
      console.log(`🚀 Starting RAG processing for document: ${document.name}`);
      
      // Download document from S3
      const buffer = await this.downloadDocumentFromS3(document.key);
      
      // Extract text
      const text = await this.extractTextFromDocument(
        buffer, 
        document.mimeType, 
        document.name
      );

      // Validate extracted text
      if (!text || text.trim().length === 0) {
        throw new Error('No text content extracted from document');
      }

      // Create metadata for chunks
      const metadata = {
        documentId: document._id,
        documentName: document.name,
        documentSize: document.size,
        mimeType: document.mimeType,
        uploadedAt: document.uploadedAt,
        s3Key: document.key,
        s3Url: document.url,
        extractedAt: new Date().toISOString(),
        originalTextLength: text.length
      };

      // Chunk the text
      const chunks = this.chunkText(text, metadata);

      return {
        success: true,
        document: document,
        extractedText: text,
        chunks: chunks,
        stats: {
          originalLength: text.length,
          chunksCreated: chunks.length,
          avgChunkSize: Math.round(chunks.reduce((sum, chunk) => sum + chunk.text.length, 0) / chunks.length)
        }
      };
    } catch (error) {
      console.error(`❌ Error processing document ${document.name}:`, error);
      return {
        success: false,
        document: document,
        error: error.message,
        extractedText: null,
        chunks: []
      };
    }
  }

  // Get processing statistics
  getProcessingStats(processedDocuments) {
    const successful = processedDocuments.filter(doc => doc.success);
    const failed = processedDocuments.filter(doc => !doc.success);
    
    const totalChunks = successful.reduce((sum, doc) => sum + doc.chunks.length, 0);
    const totalTextLength = successful.reduce((sum, doc) => sum + (doc.extractedText?.length || 0), 0);

    return {
      totalDocuments: processedDocuments.length,
      successful: successful.length,
      failed: failed.length,
      totalChunks: totalChunks,
      totalTextLength: totalTextLength,
      avgChunksPerDocument: successful.length > 0 ? Math.round(totalChunks / successful.length) : 0,
      failedDocuments: failed.map(doc => ({
        name: doc.document.name,
        error: doc.error
      }))
    };
  }
}

module.exports = new DocumentProcessorService();

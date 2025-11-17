import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import agentService from '../services/agentService';
import documentService from '../services/documentService';
import ragService from '../services/ragService';

const ProductContainer = styled.div`
  padding: 0;
  max-width: 800px;
  margin: 0 auto;
`;

const HeaderSection = styled(motion.div)`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-family: var(--font-heading);
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  color: var(--text-secondary);
  font-size: 1.2rem;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
`;

const FormCard = styled(motion.div)`
  background: var(--gradient-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: 3rem;
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-lg);
  transition: var(--transition-normal);

  &:hover {
    border-color: var(--accent-cyan);
    box-shadow: var(--shadow-glow);
  }

  @media (max-width: 768px) {
    padding: 2rem;
    margin: 1rem;
  }
`;

const FormTitle = styled.h2`
  font-family: var(--font-heading);
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const FormDescription = styled.p`
  color: var(--text-secondary);
  margin-bottom: 2.5rem;
  line-height: 1.6;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Label = styled.label`
  color: var(--text-primary);
  font-weight: 600;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FileUploadArea = styled.div`
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-lg);
  padding: 2rem;
  text-align: center;
  transition: var(--transition-normal);
  cursor: pointer;
  position: relative;

  &:hover {
    border-color: var(--accent-cyan);
    background: rgba(0, 246, 255, 0.05);
  }

  &.dragover {
    border-color: var(--accent-cyan);
    background: rgba(0, 246, 255, 0.1);
  }

  &.error {
    border-color: var(--error-color);
  }
`;

const FileUploadContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const FileUploadIcon = styled.div`
  font-size: 3rem;
  color: var(--accent-cyan);
`;

const FileUploadText = styled.div`
  color: var(--text-secondary);
  
  .primary {
    color: var(--text-primary);
    font-weight: 600;
  }
  
  .secondary {
    font-size: 0.9rem;
    margin-top: 0.5rem;
  }
`;

const HiddenFileInput = styled.input`
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
`;

const SelectedFile = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 246, 255, 0.1);
  border: 1px solid var(--accent-cyan);
  border-radius: var(--radius-md);
  margin-top: 1rem;

  .file-info {
    flex: 1;
    
    .file-name {
      color: var(--text-primary);
      font-weight: 600;
    }
    
    .file-size {
      color: var(--text-muted);
      font-size: 0.9rem;
    }
  }

  .remove-btn {
    background: none;
    border: none;
    color: var(--error-color);
    cursor: pointer;
    font-size: 1.2rem;
    padding: 0.25rem;
    border-radius: var(--radius-sm);
    transition: var(--transition-fast);

    &:hover {
      background: rgba(255, 107, 107, 0.1);
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const Button = styled(motion.button)`
  font-family: var(--font-primary);
  font-weight: 600;
  padding: 1rem 2rem;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 140px;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.primary {
    background: var(--gradient-primary);
    color: var(--primary-bg);
    box-shadow: var(--shadow-md);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
  }

  &.secondary {
    background: transparent;
    color: var(--text-secondary);
    border: 2px solid var(--border-color);

    &:hover:not(:disabled) {
      color: var(--accent-cyan);
      border-color: var(--accent-cyan);
      box-shadow: var(--shadow-sm);
    }
  }
`;

const ErrorMessage = styled(motion.div)`
  background: rgba(255, 59, 48, 0.1);
  border: 1px solid rgba(255, 59, 48, 0.3);
  border-radius: var(--radius-md);
  padding: 1rem;
  margin-bottom: 1.5rem;
  color: #ff3b30;
  font-size: 0.9rem;
  font-family: var(--font-primary);
`;

const UploadProgress = styled.div`
  margin-top: 1rem;
  
  .progress-bar {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    
    .progress-fill {
      height: 100%;
      background: var(--gradient-primary);
      transition: width 0.3s ease;
      border-radius: 4px;
    }
  }
  
  .progress-text {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin-top: 0.5rem;
    text-align: center;
  }
`;

const UploadedDocumentsList = styled.div`
  margin-top: 1.5rem;
`;

const UploadedDocumentsTitle = styled.h4`
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DocumentItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(0, 246, 255, 0.05);
  border: 1px solid rgba(0, 246, 255, 0.2);
  border-radius: var(--radius-md);
  margin-bottom: 0.75rem;
  transition: var(--transition-normal);

  &:hover {
    background: rgba(0, 246, 255, 0.1);
    border-color: rgba(0, 246, 255, 0.3);
  }

  .document-header {
    display: flex;
    align-items: center;
    gap: 1rem;

    .document-icon {
      font-size: 1.5rem;
      color: var(--accent-cyan);
    }

    .document-info {
      flex: 1;
      
      .document-name {
        color: var(--text-primary);
        font-weight: 600;
        font-size: 0.95rem;
        margin-bottom: 0.25rem;
      }
      
      .document-meta {
        color: var(--text-muted);
        font-size: 0.85rem;
        display: flex;
        gap: 1rem;
      }
    }

    .document-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 1.1rem;
      padding: 0.5rem;
      border-radius: var(--radius-sm);
      transition: var(--transition-fast);

      &:hover {
        color: var(--accent-cyan);
        background: rgba(0, 246, 255, 0.1);
      }

      &.delete:hover {
        color: var(--error-color);
        background: rgba(255, 107, 107, 0.1);
      }
    }
  }
`;

const RAGStatus = styled.div`
  padding: 0.75rem;
  background: rgba(26, 26, 46, 0.6);
  border-radius: var(--radius-sm);
  border-left: 3px solid ${props => {
    switch (props.status) {
      case 'completed': return '#34c759';
      case 'processing': return '#ff9f0a';
      case 'failed': return '#ff453a';
      default: return '#8e8e93';
    }
  }};

  .rag-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;

    .rag-title {
      color: var(--text-primary);
      font-size: 0.9rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .rag-badge {
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      
      &.completed {
        background: rgba(52, 199, 89, 0.2);
        color: #34c759;
      }
      
      &.processing {
        background: rgba(255, 159, 10, 0.2);
        color: #ff9f0a;
      }
      
      &.failed {
        background: rgba(255, 69, 58, 0.2);
        color: #ff453a;
      }
      
      &.pending {
        background: rgba(142, 142, 147, 0.2);
        color: #8e8e93;
      }
    }
  }

  .rag-progress {
    margin-bottom: 0.5rem;
    
    .progress-bar {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
      
      .progress-fill {
        height: 100%;
        background: ${props => {
          switch (props.status) {
            case 'completed': return '#34c759';
            case 'processing': return '#ff9f0a';
            case 'failed': return '#ff453a';
            default: return '#8e8e93';
          }
        }};
        transition: width 0.3s ease;
        border-radius: 2px;
      }
    }
  }

  .rag-message {
    color: var(--text-secondary);
    font-size: 0.8rem;
    line-height: 1.4;
  }

  .rag-stats {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--text-muted);

    .stat {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
  }
`;

const ProductDescription = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [currentAgentId, setCurrentAgentId] = useState(null);
  const [ragStatuses, setRagStatuses] = useState(new Map());

  // Check if we're in update mode and load existing agent data
  useEffect(() => {
    const loadAgentData = async () => {
      try {
        setIsLoading(true);
        const agentId = sessionStorage.getItem('currentAgentId');
        const updateMode = sessionStorage.getItem('isUpdateMode') === 'true';
        
        setIsUpdateMode(updateMode);
        setCurrentAgentId(agentId);
        
        if (agentId) {
          // Always try to load existing documents
          loadExistingDocuments(agentId);
        }
      } catch (error) {
        console.error('Error loading agent data:', error);
        setError('Failed to load agent data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAgentData();
  }, []);

  // Separate function to load existing documents
  const loadExistingDocuments = async (agentId) => {
    try {
      console.log('🔍 Loading documents for agent:', agentId);
      const documentsResponse = await documentService.getDocuments(agentId);
      const documents = documentsResponse.data.documents || [];
      console.log('✅ Loaded documents:', documents.length, documents);
      setUploadedDocuments(documents);
      
      // Load RAG statuses for existing documents
      if (documents.length > 0) {
        await loadRAGStatuses(agentId, documents);
      }
    } catch (docError) {
      // Silently handle document loading errors for new agents
      console.warn('Could not load documents (this is normal for new agents):', docError.message);
      setUploadedDocuments([]);
    }
  };

  const handleFileSelect = async (file) => {
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('File size must be less than 5MB');
      return;
    }

    if (!currentAgentId) {
      setError('Agent ID not found. Please refresh the page and try again.');
      return;
    }

    console.log('🔍 Frontend - Uploading file for agent ID:', currentAgentId);
    console.log('🔍 Frontend - File details:', { name: file.name, size: file.size, type: file.type });

    setSelectedFile(file);
    setIsUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      const result = await documentService.uploadDocument(
        currentAgentId,
        file,
        (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      );

      // Refresh the documents list to get the latest data
      await loadExistingDocuments(currentAgentId);
      setSelectedFile(null);
      setUploadProgress(0);
      
      // Start polling for RAG processing status
      if (result.data.document._id) {
        startRAGStatusPolling(currentAgentId, result.data.document._id);
      }
      
      console.log('Document uploaded successfully:', result);
    } catch (error) {
      console.error('Error uploading document:', error);
      setError(error.response?.data?.message || 'Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const handleDeleteDocument = async (documentId) => {
    if (!currentAgentId) return;

    try {
      await documentService.deleteDocument(currentAgentId, documentId);
      // Refresh the documents list
      await loadExistingDocuments(currentAgentId);
    } catch (error) {
      console.error('Error deleting document:', error);
      setError(error.response?.data?.message || 'Failed to delete document. Please try again.');
    }
  };

  const handleDownloadDocument = async (documentId) => {
    if (!currentAgentId) return;

    try {
      await documentService.downloadDocument(currentAgentId, documentId);
    } catch (error) {
      console.error('Error downloading document:', error);
      setError(error.response?.data?.message || 'Failed to download document. Please try again.');
    }
  };

  // Start polling for RAG processing status
  const startRAGStatusPolling = (agentId, documentId) => {
    console.log('🔄 Starting RAG status polling for document:', documentId);
    
    ragService.pollProcessingStatus(
      agentId,
      documentId,
      (status) => {
        console.log('📊 RAG status update:', status);
        setRagStatuses(prev => new Map(prev.set(documentId, status)));
        
        // Stop polling when processing is complete
        if (ragService.isProcessingComplete(status)) {
          console.log('✅ RAG processing completed for document:', documentId);
        }
      }
    );
  };

  // Load RAG statuses for existing documents
  const loadRAGStatuses = async (agentId, documents) => {
    try {
      for (const document of documents) {
        // Check if document has RAG processing status
        if (document.ragProcessingStatus === 'processing') {
          startRAGStatusPolling(agentId, document._id);
        } else if (document.ragProcessed) {
          // Set completed status for already processed documents
          setRagStatuses(prev => new Map(prev.set(document._id, {
            status: 'completed',
            progress: 100,
            message: 'RAG processing completed'
          })));
        }
      }
    } catch (error) {
      console.warn('Error loading RAG statuses:', error);
    }
  };

  // Get RAG status for a document
  const getDocumentRAGStatus = (documentId) => {
    return ragStatuses.get(documentId) || null;
  };

  // Manually trigger RAG processing
  const handleReprocessDocument = async (documentId) => {
    if (!currentAgentId) return;

    try {
      await ragService.processDocument(currentAgentId, documentId);
      startRAGStatusPolling(currentAgentId, documentId);
    } catch (error) {
      console.error('Error triggering RAG processing:', error);
      setError(error.response?.data?.message || 'Failed to trigger RAG processing.');
    }
  };

  const handleNext = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const agentId = sessionStorage.getItem('currentAgentId');
      if (!agentId) {
        throw new Error('Agent ID not found. Please start from the Agent configuration page.');
      }
      
      navigate('/icp-selection');
    } catch (error) {
      console.error('Error proceeding to next step:', error);
      setError(error.message || 'Failed to continue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/agent');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <ProductContainer>
        <HeaderSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Title>Loading...</Title>
          <Subtitle>
            Loading agent data...
          </Subtitle>
        </HeaderSection>
      </ProductContainer>
    );
  }

  return (
    <ProductContainer>
      <HeaderSection
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Title>{isUpdateMode ? 'Update Product Description' : 'Product Description'}</Title>
        <Subtitle>
          {isUpdateMode 
            ? 'Review and update your product information to help your AI agent better understand what you\'re selling.'
            : 'Help your AI agent understand your product by providing detailed information. '
          }
        </Subtitle>
      </HeaderSection>

      <FormCard
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <FormTitle>
          {isUpdateMode ? ' Update Product Information' : ' Product Information'}
        </FormTitle>
        <FormDescription>
          {isUpdateMode 
            ? 'Review and update your product information. Changes will be saved when you proceed to the next step.'
            : 'Provide comprehensive details about your product or service. The more information you provide, the better your AI agent will understand and sell your offering.'
          }
        </FormDescription>

        <Form onSubmit={handleNext}>
          {error && (
            <ErrorMessage
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </ErrorMessage>
          )}
          
          <FormGroup>
            <Label>
               Upload Product Document
            </Label>
            <FileUploadArea
              className={`${dragOver ? 'dragover' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <HiddenFileInput
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
              />
              <FileUploadContent>
                <FileUploadIcon>📁</FileUploadIcon>
                <FileUploadText>
                  <div className="primary">
                    Drop your document here or click to browse
                  </div>
                  <div className="secondary">
                    Supports PDF, DOC, DOCX, TXT files (Max 5MB)
                  </div>
                </FileUploadText>
              </FileUploadContent>
            </FileUploadArea>
            
            {isUploading && (
              <UploadProgress>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="progress-text">
                  Uploading... {uploadProgress}%
                </div>
              </UploadProgress>
            )}

            {selectedFile && !isUploading && (
              <SelectedFile>
                <div className="file-info">
                  <div className="file-name">📄 {selectedFile.name}</div>
                  <div className="file-size">{formatFileSize(selectedFile.size)}</div>
                </div>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={removeFile}
                  title="Remove file"
                >
                  ✕
                </button>
              </SelectedFile>
            )}

            {uploadedDocuments.length > 0 && (
              <UploadedDocumentsList>
                <UploadedDocumentsTitle>
                   Uploaded Documents ({uploadedDocuments.length})
                </UploadedDocumentsTitle>
                {uploadedDocuments.map((document) => {
                  const ragStatus = getDocumentRAGStatus(document._id);
                  
                  return (
                    <DocumentItem key={document._id}>
                      <div className="document-header">
                        <div className="document-icon">
                          {document.mimeType?.includes('pdf') ? '📄' : 
                           document.mimeType?.includes('word') ? '📝' : 
                           document.mimeType?.includes('text') ? '📃' : '📄'}
                        </div>
                        <div className="document-info">
                          <div className="document-name">{document.name}</div>
                          <div className="document-meta">
                            <span>{formatFileSize(document.size)}</span>
                            <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="document-actions">
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() => handleDownloadDocument(document._id)}
                            title="Download document"
                          >
                            ⬇️
                          </button>
                          {ragStatus && !ragService.isProcessingSuccessful(ragStatus) && (
                            <button
                              type="button"
                              className="action-btn"
                              onClick={() => handleReprocessDocument(document._id)}
                              title="Reprocess with RAG"
                            >
                              🔄
                            </button>
                          )}
                          <button
                            type="button"
                            className="action-btn delete"
                            onClick={() => handleDeleteDocument(document._id)}
                            title="Delete document"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      
                      {/* RAG Processing Status */}
                      {(ragStatus || document.ragProcessed) && (
                        <RAGStatus status={ragStatus?.status || (document.ragProcessed ? 'completed' : 'pending')}>
                          <div className="rag-header">
                            <div className="rag-title">
                              🧠 RAG Processing
                            </div>
                            <div className={`rag-badge ${ragStatus?.status || (document.ragProcessed ? 'completed' : 'pending')}`}>
                              {ragStatus?.status || (document.ragProcessed ? 'completed' : 'pending')}
                            </div>
                          </div>
                          
                          {ragStatus && ragStatus.progress !== undefined && (
                            <div className="rag-progress">
                              <div className="progress-bar">
                                <div 
                                  className="progress-fill" 
                                  style={{ width: `${ragStatus.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                          
                          <div className="rag-message">
                            {ragStatus ? ragService.getStatusDisplayText(ragStatus) : 
                             document.ragProcessed ? 'Document has been processed and is ready for AI queries' :
                             'Document is queued for RAG processing'}
                          </div>
                          
                          {document.ragProcessed && document.vectorCount && (
                            <div className="rag-stats">
                              <div className="stat">
                                <span>📊</span>
                                <span>{document.vectorCount} vectors</span>
                              </div>
                              {document.chunkCount && (
                                <div className="stat">
                                  <span>📄</span>
                                  <span>{document.chunkCount} chunks</span>
                                </div>
                              )}
                              {document.textLength && (
                                <div className="stat">
                                  <span>📝</span>
                                  <span>{Math.round(document.textLength / 1000)}k chars</span>
                                </div>
                              )}
                            </div>
                          )}
                        </RAGStatus>
                      )}
                    </DocumentItem>
                  );
                })}
              </UploadedDocumentsList>
            )}
          </FormGroup>

          <ButtonGroup>
            <Button
              type="button"
              className="secondary"
              onClick={handleBack}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="primary"
              disabled={isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSubmitting ? (
                <>
                  <div className="loading" />
                  Processing...
                </>
              ) : (
                <>
                  Next Step
                  →
                </>
              )}
            </Button>
          </ButtonGroup>
        </Form>
      </FormCard>
    </ProductContainer>
  );
};

export default ProductDescription;

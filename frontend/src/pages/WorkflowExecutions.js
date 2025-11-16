import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import workflowService from '../services/workflowService';

const ExecutionsContainer = styled.div`
  min-height: 100vh;
  background: var(--primary-bg);
  color: var(--text-primary);
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
`;

const BackButton = styled.button`
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: var(--font-primary);
  font-weight: 500;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    border-color: var(--accent-cyan);
    color: var(--accent-cyan);
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
`;

const WorkflowInfo = styled.div`
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  margin-bottom: 2rem;
  backdrop-filter: blur(10px);
`;

const WorkflowName = styled.h2`
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
`;

const WorkflowStats = styled.div`
  display: flex;
  gap: 2rem;
  margin-top: 1rem;
`;

const Stat = styled.div`
  .label {
    color: var(--text-muted);
    font-size: 0.85rem;
    margin-bottom: 0.25rem;
  }
  
  .value {
    color: var(--text-primary);
    font-size: 1.1rem;
    font-weight: 600;
  }
`;

const ExecutionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ExecutionCard = styled(motion.div)`
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  overflow: hidden;
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: var(--transition-fast);

  &:hover {
    border-color: rgba(0, 246, 255, 0.3);
    background: rgba(26, 26, 46, 0.8);
  }
`;

const ExecutionHeader = styled.div`
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ExecutionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const StatusBadge = styled.div`
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  ${props => {
    switch (props.status) {
      case 'completed':
        return `
          background: rgba(52, 199, 89, 0.2);
          color: #34c759;
          border: 1px solid rgba(52, 199, 89, 0.3);
        `;
      case 'failed':
        return `
          background: rgba(255, 59, 48, 0.2);
          color: #ff3b30;
          border: 1px solid rgba(255, 59, 48, 0.3);
        `;
      case 'running':
        return `
          background: rgba(255, 149, 0, 0.2);
          color: #ff9500;
          border: 1px solid rgba(255, 149, 0, 0.3);
        `;
      default:
        return `
          background: rgba(142, 142, 147, 0.2);
          color: #8e8e93;
          border: 1px solid rgba(142, 142, 147, 0.3);
        `;
    }
  }}
`;

const ExecutionMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  
  .id {
    color: var(--text-muted);
    font-size: 0.85rem;
    font-family: var(--font-mono);
  }
  
  .time {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
  
  .duration {
    color: var(--text-muted);
    font-size: 0.85rem;
  }
`;

const ExpandIcon = styled.div`
  color: var(--text-secondary);
  font-size: 1.2rem;
  transition: var(--transition-fast);
  transform: ${props => props.expanded ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const ExecutionDetails = styled(motion.div)`
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0;
`;

const NodeExecutions = styled.div`
  padding: 1.5rem;
`;

const NodeExecutionCard = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
  padding: 1rem;
  margin-bottom: 1rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const NodeHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: between;
  margin-bottom: 1rem;
  gap: 1rem;
`;

const NodeInfo = styled.div`
  flex: 1;
  
  .name {
    color: var(--text-primary);
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 0.25rem;
  }
  
  .type {
    color: var(--text-muted);
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const NodeStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  .duration {
    color: var(--text-muted);
    font-size: 0.85rem;
  }
`;

const OutputSection = styled.div`
  .label {
    color: var(--text-secondary);
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const OutputContent = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-sm);
  padding: 1rem;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--text-secondary);
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
`;

const LeadsGrid = styled.div`
  display: grid;
  gap: 0.75rem;
  margin-top: 0.5rem;
`;

const LeadCard = styled.div`
  background: rgba(0, 246, 255, 0.05);
  border: 1px solid rgba(0, 246, 255, 0.1);
  border-radius: var(--radius-sm);
  padding: 0.75rem;
  
  .lead-name {
    color: var(--text-primary);
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  
  .lead-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    font-size: 0.85rem;
    
    .detail {
      color: var(--text-muted);
      
      .label {
        color: var(--text-secondary);
        font-weight: 500;
      }
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-muted);
  
  .icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  .message {
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
  }
  
  .submessage {
    font-size: 0.9rem;
    opacity: 0.7;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: var(--text-muted);
  
  .spinner {
    width: 2rem;
    height: 2rem;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-top: 2px solid var(--accent-cyan);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 1rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const WorkflowExecutions = () => {
  const { workflowId } = useParams();
  const navigate = useNavigate();
  
  const [workflow, setWorkflow] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedExecution, setExpandedExecution] = useState(null);

  useEffect(() => {
    loadWorkflowAndExecutions();
  }, [workflowId]);

  const loadWorkflowAndExecutions = async () => {
    try {
      setLoading(true);
      
      // Load workflow details and executions in parallel
      const [workflowResponse, executionsResponse] = await Promise.all([
        workflowService.getWorkflow(workflowId),
        workflowService.getWorkflowExecutions(workflowId)
      ]);
      
      if (workflowResponse.success) {
        setWorkflow(workflowResponse.data.workflow);
      }
      
      if (executionsResponse.success) {
        setExecutions(executionsResponse.data.executions || []);
      }
    } catch (error) {
      console.error('Error loading workflow executions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    const duration = new Date(endTime) - new Date(startTime);
    return `${(duration / 1000).toFixed(2)}s`;
  };

  const toggleExecution = (executionId) => {
    setExpandedExecution(expandedExecution === executionId ? null : executionId);
  };

  const renderNodeOutput = (nodeExecution) => {
    if (!nodeExecution.output) {
      return <OutputContent>No output data</OutputContent>;
    }

    // If it's leads data (array of lead objects)
    if (Array.isArray(nodeExecution.output) && nodeExecution.output.length > 0 && nodeExecution.output[0].first_name) {
      return (
        <LeadsGrid>
          {nodeExecution.output.map((lead, index) => (
            <LeadCard key={index}>
              <div className="lead-name">
                {lead.name || `${lead.first_name} ${lead.last_name}`}
              </div>
              <div className="lead-details">
                <div className="detail">
                  <span className="label">Title:</span> {lead.title || 'N/A'}
                </div>
                <div className="detail">
                  <span className="label">Company:</span> {lead.organization_name || 'N/A'}
                </div>
                <div className="detail">
                  <span className="label">Email:</span> {lead.email || 'N/A'}
                </div>
                <div className="detail">
                  <span className="label">Status:</span> {lead.email_status || 'N/A'}
                </div>
              </div>
            </LeadCard>
          ))}
        </LeadsGrid>
      );
    }

    // For other types of output, show as JSON
    return (
      <OutputContent>
        {typeof nodeExecution.output === 'object' 
          ? JSON.stringify(nodeExecution.output, null, 2)
          : String(nodeExecution.output)
        }
      </OutputContent>
    );
  };

  if (loading) {
    return (
      <ExecutionsContainer>
        <LoadingSpinner>
          <div className="spinner"></div>
          Loading executions...
        </LoadingSpinner>
      </ExecutionsContainer>
    );
  }

  return (
    <ExecutionsContainer>
      <Header>
        <BackButton onClick={() => navigate('/workflow')}>
          ← Back to Workflows
        </BackButton>
        <Title>Workflow Executions</Title>
      </Header>

      {workflow && (
        <WorkflowInfo>
          <WorkflowName>{workflow.name}</WorkflowName>
          <WorkflowStats>
            <Stat>
              <div className="label">Total Executions</div>
              <div className="value">{workflow.stats?.totalExecutions || 0}</div>
            </Stat>
            <Stat>
              <div className="label">Success Rate</div>
              <div className="value">{workflow.successRate || 0}%</div>
            </Stat>
            <Stat>
              <div className="label">Last Run</div>
              <div className="value">
                {workflow.stats?.lastExecutedAt 
                  ? formatDate(workflow.stats.lastExecutedAt)
                  : 'Never'
                }
              </div>
            </Stat>
            <Stat>
              <div className="label">Status</div>
              <div className="value">{workflow.status}</div>
            </Stat>
          </WorkflowStats>
        </WorkflowInfo>
      )}

      <ExecutionsList>
        {executions.length === 0 ? (
          <EmptyState>
            <div className="icon">📊</div>
            <div className="message">No executions found</div>
            <div className="submessage">This workflow hasn't been executed yet</div>
          </EmptyState>
        ) : (
          executions.map((execution) => (
            <ExecutionCard
              key={execution._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => toggleExecution(execution._id)}
            >
              <ExecutionHeader>
                <ExecutionInfo>
                  <StatusBadge status={execution.status}>
                    {execution.status}
                  </StatusBadge>
                  <ExecutionMeta>
                    <div className="id">ID: {execution._id}</div>
                    <div className="time">
                      Started: {formatDate(execution.startedAt)}
                    </div>
                    <div className="duration">
                      Duration: {formatDuration(execution.startedAt, execution.completedAt)}
                    </div>
                  </ExecutionMeta>
                </ExecutionInfo>
                <ExpandIcon expanded={expandedExecution === execution._id}>
                  ▼
                </ExpandIcon>
              </ExecutionHeader>

              <AnimatePresence>
                {expandedExecution === execution._id && (
                  <ExecutionDetails
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <NodeExecutions>
                      {execution.nodeExecutions?.map((nodeExecution, index) => (
                        <NodeExecutionCard key={index}>
                          <NodeHeader>
                            <NodeInfo>
                              <div className="name">{nodeExecution.nodeName}</div>
                              <div className="type">{nodeExecution.nodeType}</div>
                            </NodeInfo>
                            <NodeStatus>
                              <StatusBadge status={nodeExecution.status}>
                                {nodeExecution.status}
                              </StatusBadge>
                              <div className="duration">
                                {nodeExecution.duration ? `${nodeExecution.duration}ms` : 'N/A'}
                              </div>
                            </NodeStatus>
                          </NodeHeader>
                          
                          <OutputSection>
                            <div className="label">Output</div>
                            {renderNodeOutput(nodeExecution)}
                          </OutputSection>
                          
                          {nodeExecution.error && (
                            <OutputSection>
                              <div className="label">Error</div>
                              <OutputContent style={{ borderColor: 'rgba(255, 59, 48, 0.3)' }}>
                                {nodeExecution.error}
                              </OutputContent>
                            </OutputSection>
                          )}
                        </NodeExecutionCard>
                      ))}
                    </NodeExecutions>
                  </ExecutionDetails>
                )}
              </AnimatePresence>
            </ExecutionCard>
          ))
        )}
      </ExecutionsList>
    </ExecutionsContainer>
  );
};

export default WorkflowExecutions;

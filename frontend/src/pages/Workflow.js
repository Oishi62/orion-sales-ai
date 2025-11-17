import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import workflowService from '../services/workflowService';

const WorkflowContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-family: var(--font-heading);
  font-size: 2.5rem;
  font-weight: 700;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
`;

const CreateButton = styled(motion.button)`
  background: var(--gradient-primary);
  color: var(--primary-bg);
  border: none;
  padding: 1rem 2rem;
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: var(--shadow-lg);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-xl);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const WorkflowGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const WorkflowCard = styled(motion.div)`
  background: var(--gradient-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-xl);
    border-color: var(--accent-cyan);
  }
`;

const WorkflowHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const WorkflowName = styled.h3`
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  
  ${props => {
    switch (props.status) {
      case 'active':
        return `
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        `;
      case 'paused':
        return `
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
          border: 1px solid rgba(251, 191, 36, 0.3);
        `;
      case 'draft':
        return `
          background: rgba(107, 114, 128, 0.2);
          color: #9ca3af;
          border: 1px solid rgba(107, 114, 128, 0.3);
        `;
      default:
        return `
          background: rgba(107, 114, 128, 0.2);
          color: #9ca3af;
          border: 1px solid rgba(107, 114, 128, 0.3);
        `;
    }
  }}
`;

const WorkflowDescription = styled.p`
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const WorkflowStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin: 1rem 0;
`;

const StatItem = styled.div`
  text-align: center;
  padding: 0.75rem;
  background: rgba(0, 246, 255, 0.05);
  border-radius: var(--radius-md);
  border: 1px solid rgba(0, 246, 255, 0.1);

  .value {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--accent-cyan);
    display: block;
  }

  .label {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const WorkflowActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const ActionButton = styled(motion.button)`
  flex: 1;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: var(--accent-cyan);
    color: var(--primary-bg);
    border-color: var(--accent-cyan);
  }

  &.primary {
    background: var(--gradient-primary);
    color: var(--primary-bg);
    border-color: transparent;

    &:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }
  }

  &.danger {
    &:hover {
      background: #ef4444;
      border-color: #ef4444;
      color: white;
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-muted);

  .icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
  }

  .description {
    font-size: 1rem;
    line-height: 1.6;
    max-width: 400px;
    margin: 0 auto;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-color);
    border-top: 3px solid var(--accent-cyan);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Workflow = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await workflowService.getWorkflows();
      setWorkflows(response.data.workflows || []);
    } catch (error) {
      console.error('Error loading workflows:', error);
      setError(error.message || 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = () => {
    navigate('/workflow/builder');
  };

  const handleEditWorkflow = (workflowId) => {
    navigate(`/workflow/builder/${workflowId}`);
  };

  const handleActivateWorkflow = async (workflowId, event) => {
    event.stopPropagation();
    try {
      await workflowService.activateWorkflow(workflowId);
      await loadWorkflows(); // Refresh the list
    } catch (error) {
      console.error('Error activating workflow:', error);
      setError(error.message || 'Failed to activate workflow');
    }
  };

  const handlePauseWorkflow = async (workflowId, event) => {
    event.stopPropagation();
    try {
      await workflowService.pauseWorkflow(workflowId);
      await loadWorkflows(); // Refresh the list
    } catch (error) {
      console.error('Error pausing workflow:', error);
      setError(error.message || 'Failed to pause workflow');
    }
  };

  const handleExecuteWorkflow = async (workflowId, event) => {
    event.stopPropagation();
    try {
      await workflowService.executeWorkflow(workflowId);
      // Could show a success message or navigate to execution details
    } catch (error) {
      console.error('Error executing workflow:', error);
      setError(error.message || 'Failed to execute workflow');
    }
  };

  const handleDeleteWorkflow = async (workflowId, event) => {
    event.stopPropagation();
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      try {
        await workflowService.deleteWorkflow(workflowId);
        await loadWorkflows(); // Refresh the list
      } catch (error) {
        console.error('Error deleting workflow:', error);
        setError(error.message || 'Failed to delete workflow');
      }
    }
  };

  const handleViewExecutions = (workflowId, event) => {
    event.stopPropagation();
    navigate(`/workflow/${workflowId}/executions`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <WorkflowContainer>
        <LoadingSpinner>
          <div className="spinner"></div>
        </LoadingSpinner>
      </WorkflowContainer>
    );
  }

  return (
    <WorkflowContainer>
      <Header>
        <Title>Workflows</Title>
        <CreateButton
          onClick={handleCreateWorkflow}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>➕</span>
          Build Workflow
        </CreateButton>
      </Header>

      {error && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {workflows.length === 0 ? (
        <EmptyState>
          <div className="icon">🔄</div>
          <div className="title">No workflows yet</div>
          <div className="description">
            Create your first workflow to automate your sales processes. 
            Start with a simple schedule node to get familiar with the workflow builder.
          </div>
        </EmptyState>
      ) : (
        <WorkflowGrid>
          <AnimatePresence>
            {workflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                onClick={() => handleEditWorkflow(workflow.id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <WorkflowHeader>
                  <WorkflowName>{workflow.name}</WorkflowName>
                  <StatusBadge status={workflow.status}>
                    {workflow.status}
                  </StatusBadge>
                </WorkflowHeader>

                {workflow.description && (
                  <WorkflowDescription>
                    {workflow.description}
                  </WorkflowDescription>
                )}

                <WorkflowStats>
                  <StatItem>
                    <span className="value">{workflow.nodeCount}</span>
                    <span className="label">Nodes</span>
                  </StatItem>
                  <StatItem>
                    <span className="value">{workflow.successRate}%</span>
                    <span className="label">Success Rate</span>
                  </StatItem>
                </WorkflowStats>

                <div style={{ 
                  fontSize: '0.8rem', 
                  color: 'var(--text-muted)', 
                  marginBottom: '1rem' 
                }}>
                  <div>Executions: {workflow.totalExecutions}</div>
                  <div>Last run: {formatDate(workflow.lastExecutedAt)}</div>
                </div>

                <WorkflowActions>
                  {workflow.status === 'draft' || workflow.status === 'paused' ? (
                    <ActionButton
                      className="primary"
                      onClick={(e) => handleActivateWorkflow(workflow.id, e)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Activate
                    </ActionButton>
                  ) : (
                    <ActionButton
                      onClick={(e) => handlePauseWorkflow(workflow.id, e)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Pause
                    </ActionButton>
                  )}
                  
                  <ActionButton
                    onClick={(e) => handleExecuteWorkflow(workflow.id, e)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Run Now
                  </ActionButton>
                  
                  <ActionButton
                    onClick={(e) => handleViewExecutions(workflow.id, e)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Executions
                  </ActionButton>
                  
                  <ActionButton
                    className="danger"
                    onClick={(e) => handleDeleteWorkflow(workflow.id, e)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Delete
                  </ActionButton>
                </WorkflowActions>
              </WorkflowCard>
            ))}
          </AnimatePresence>
        </WorkflowGrid>
      )}
    </WorkflowContainer>
  );
};

export default Workflow;

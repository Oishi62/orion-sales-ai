import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import agentService from '../services/agentService';

const AgentContainer = styled.div`
  padding: 0;
  max-width: 1400px;
  margin: 0 auto;
`;

const MainLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;
  margin-top: 2rem;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr 350px;
    gap: 1.5rem;
  }

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const LeftPanel = styled.div`
  min-width: 0; /* Prevents grid overflow */
`;

const RightPanel = styled.div`
  min-width: 0; /* Prevents grid overflow */
  
  @media (max-width: 968px) {
    order: -1; /* Show existing agents first on mobile */
  }
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
  gap: 2rem;
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

const Input = styled.input`
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  color: var(--text-primary);
  font-size: 1rem;
  transition: var(--transition-normal);
  font-family: var(--font-primary);

  &:focus {
    outline: none;
    border-color: var(--accent-cyan);
    box-shadow: var(--shadow-glow);
    background: rgba(26, 26, 46, 0.9);
  }

  &::placeholder {
    color: var(--text-muted);
  }

  &.error {
    border-color: var(--error-color);
    box-shadow: 0 0 10px rgba(255, 107, 107, 0.3);
  }
`;

const TextArea = styled.textarea`
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  color: var(--text-primary);
  font-size: 1rem;
  transition: var(--transition-normal);
  font-family: var(--font-primary);
  min-height: 120px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: var(--accent-cyan);
    box-shadow: var(--shadow-glow);
    background: rgba(26, 26, 46, 0.9);
  }

  &::placeholder {
    color: var(--text-muted);
  }

  &.error {
    border-color: var(--error-color);
    box-shadow: 0 0 10px rgba(255, 107, 107, 0.3);
  }
`;

const Select = styled.select`
  background: rgba(26, 26, 46, 0.85);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1rem;
  color: var(--text-primary);
  font-size: 1rem;
  transition: var(--transition-normal);
  font-family: var(--font-primary);
  appearance: none;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: var(--accent-cyan);
    box-shadow: var(--shadow-glow);
    background: rgba(26, 26, 46, 0.95);
  }

  &.error {
    border-color: var(--error-color);
    box-shadow: 0 0 10px rgba(255, 107, 107, 0.3);
  }
`;


const FormErrorMessage = styled.span`
  color: var(--error-color);
  font-size: 0.9rem;
  margin-top: 0.25rem;
`;

const CharacterCount = styled.span`
  color: var(--text-muted);
  font-size: 0.85rem;
  text-align: right;
  margin-top: 0.25rem;
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

const WorkflowPreview = styled(motion.div)`
  background: rgba(26, 26, 46, 0.5);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  margin-top: 2rem;
`;

const WorkflowTitle = styled.h3`
  font-family: var(--font-heading);
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--accent-cyan);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const WorkflowSteps = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const WorkflowStep = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(0, 246, 255, 0.05);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--accent-cyan);
`;

const StepNumber = styled.div`
  width: 24px;
  height: 24px;
  background: var(--gradient-primary);
  color: var(--primary-bg);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  font-family: var(--font-mono);
  flex-shrink: 0;
`;

const StepText = styled.span`
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.4;
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

const ExistingAgentsSection = styled(motion.div)`
  position: sticky;
  top: 2rem;
  height: fit-content;
`;

const ExistingAgentsCard = styled(motion.div)`
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  height: fit-content;
  max-height: calc(100vh - 4rem);
  display: flex;
  flex-direction: column;
`;

const ExistingAgentsTitle = styled.h2`
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AgentsList = styled.div`
  display: grid;
  gap: 0.75rem;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  
  /* Hide scrollbars */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
`;

const AgentItem = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  transition: var(--transition-normal);
  cursor: pointer;

  ${props => props.isSelected && `
    background: rgba(0, 246, 255, 0.1);
    border-color: var(--accent-cyan);
    box-shadow: 0 0 20px rgba(0, 246, 255, 0.2);
  `}

  &:hover {
    background: ${props => props.isSelected ? 'rgba(0, 246, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)'};
    border-color: var(--accent-cyan);
    transform: translateY(-1px);
  }
`;

const AgentItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
`;

const AgentName = styled.h3`
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
  line-height: 1.3;
`;

const AgentStatus = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  font-family: var(--font-mono);
  text-transform: uppercase;
  
  ${props => {
    switch (props.status) {
      case 'active':
        return `
          background: rgba(52, 199, 89, 0.2);
          color: #34c759;
          border: 1px solid rgba(52, 199, 89, 0.3);
        `;
      case 'draft':
        return `
          background: rgba(255, 159, 10, 0.2);
          color: #ff9f0a;
          border: 1px solid rgba(255, 159, 10, 0.3);
        `;
      case 'paused':
        return `
          background: rgba(255, 69, 58, 0.2);
          color: #ff453a;
          border: 1px solid rgba(255, 69, 58, 0.3);
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

const AgentDescription = styled.p`
  font-family: var(--font-primary);
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0.5rem 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const AgentMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--text-muted);
`;


const AgentDate = styled.span`
  font-family: var(--font-primary);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
  font-family: var(--font-primary);
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  
  &::after {
    content: '';
    width: 20px;
    height: 20px;
    border: 2px solid rgba(0, 246, 255, 0.3);
    border-top-color: var(--accent-cyan);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const Agent = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [descriptionLength, setDescriptionLength] = useState(0);
  const [error, setError] = useState('');
  const [existingAgents, setExistingAgents] = useState([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue
  } = useForm();

  const watchDescription = watch('description', '');

  React.useEffect(() => {
    setDescriptionLength(watchDescription.length);
  }, [watchDescription]);

  // Fetch existing agents on component mount
  React.useEffect(() => {
    const fetchExistingAgents = async () => {
      try {
        setIsLoadingAgents(true);
        const response = await agentService.getUserAgents();
        setExistingAgents(response.data.agents || []);
      } catch (error) {
        console.error('Error fetching existing agents:', error);
        // Don't show error for this, just log it
      } finally {
        setIsLoadingAgents(false);
      }
    };

    fetchExistingAgents();
  }, []);

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Handle clicking on an existing agent
  const handleAgentClick = (agent) => {
    setSelectedAgent(agent);
    setIsUpdateMode(true);
    
    // Populate form with agent data
    setValue('name', agent.name);
    setValue('description', agent.description);
    
    // Clear any existing errors
    setError('');
  };

  // Handle creating a new agent (reset form)
  const handleCreateNew = () => {
    setSelectedAgent(null);
    setIsUpdateMode(false);
    reset();
    setError('');
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError('');
    
    try {
      if (isUpdateMode && selectedAgent) {
        // Update existing agent
        const response = await agentService.updateAgent(selectedAgent.id, {
          name: data.name,
          description: data.description
        });

        console.log('Agent updated successfully:', response.data.agent);
        
        // Store agent ID in sessionStorage for the next steps
        sessionStorage.setItem('currentAgentId', selectedAgent.id);
        sessionStorage.setItem('isUpdateMode', 'true');
        
        // Navigate to the product description page to continue the update flow
        navigate('/product-description');
      } else {
        // Create new agent
        const response = await agentService.createAgent({
          name: data.name,
          description: data.description
        });

        console.log('Agent created successfully:', response.data.agent);
        
        // Store agent ID in sessionStorage for the next steps
        sessionStorage.setItem('currentAgentId', response.data.agent.id);
        sessionStorage.removeItem('isUpdateMode');
        
        // Navigate to the product description page
        navigate('/product-description');
      }
    } catch (error) {
      console.error('Error with agent:', error);
      setError(error.message || `Failed to ${isUpdateMode ? 'update' : 'create'} agent. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const workflowSteps = [
    'Product Description',
    'ICP Selection',
    'Lead Research',
    'Message Generation'
  ];

  return (
    <AgentContainer>
      <HeaderSection
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Title>Create Your AI Sales Agent</Title>
        <Subtitle>
          Build an intelligent sales assistant that understands your product, 
          identifies perfect prospects, and crafts personalized outreach messages 
          that convert leads into customers.
        </Subtitle>
      </HeaderSection>

      <MainLayout>
        <LeftPanel>

      <FormCard
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <FormTitle>
          {isUpdateMode ? '✏️ Update Agent Details' : '🤖 Agent Configuration'}
        </FormTitle>
        <FormDescription>
          {isUpdateMode 
            ? 'Update your AI agent\'s information. Changes will be saved immediately.'
            : 'Give your AI agent a name and describe its purpose. This helps the AI understand your business context and create more targeted sales strategies.'
          }
        </FormDescription>

        <Form onSubmit={handleSubmit(onSubmit)}>
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
            <Label htmlFor="name">
              🏷️ Agent Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., SaaS Sales Pro, B2B Lead Hunter, Enterprise Closer"
              className={errors.name ? 'error' : ''}
              {...register('name', {
                required: 'Agent name is required',
                minLength: {
                  value: 3,
                  message: 'Agent name must be at least 3 characters'
                },
                maxLength: {
                  value: 50,
                  message: 'Agent name cannot exceed 50 characters'
                }
              })}
            />
            {errors.name && <FormErrorMessage>{errors.name.message}</FormErrorMessage>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="description">
              📝 Agent Description
            </Label>
            <TextArea
              id="description"
              placeholder="Describe what your agent should focus on. For example: 'An AI sales agent specialized in selling project management software to mid-size tech companies. Focuses on pain points around team collaboration and productivity.'"
              className={errors.description ? 'error' : ''}
              {...register('description', {
                required: 'Agent description is required',
                minLength: {
                  value: 20,
                  message: 'Description must be at least 20 characters'
                },
                maxLength: {
                  value: 500,
                  message: 'Description cannot exceed 500 characters'
                }
              })}
            />
            <CharacterCount>
              {descriptionLength}/500 characters
            </CharacterCount>
            {errors.description && <FormErrorMessage>{errors.description.message}</FormErrorMessage>}
          </FormGroup>


          <ButtonGroup>
            <Button
              type="button"
              className="secondary"
              onClick={isUpdateMode ? handleCreateNew : undefined}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isUpdateMode ? 'Create New Agent' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              className="primary"
              disabled={isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSubmitting ? (isUpdateMode ? 'Updating...' : 'Creating...') : (isUpdateMode ? 'Update Agent' : 'Next Step')}
            </Button>
          </ButtonGroup>
        </Form>

        <WorkflowPreview
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <WorkflowTitle>
            ⚡ What happens next?
          </WorkflowTitle>
          <WorkflowSteps>
            {workflowSteps.map((step, index) => (
              <WorkflowStep key={index}>
                <StepNumber>{index + 1}</StepNumber>
                <StepText>{step}</StepText>
              </WorkflowStep>
            ))}
          </WorkflowSteps>
        </WorkflowPreview>
      </FormCard>
        </LeftPanel>

        <RightPanel>
          {/* Existing Agents Section */}
          {!isLoadingAgents && existingAgents.length > 0 && (
            <ExistingAgentsSection
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <ExistingAgentsCard>
                <ExistingAgentsTitle>
                  🤖 Your Agents ({existingAgents.length})
                </ExistingAgentsTitle>
                
                <AgentsList>
                  {existingAgents.map((agent, index) => (
                    <AgentItem
                      key={agent.id}
                      isSelected={selectedAgent?.id === agent.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                      onClick={() => handleAgentClick(agent)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <AgentItemHeader>
                        <AgentName>{agent.name}</AgentName>
                        <AgentStatus status={agent.status}>
                          {agent.status}
                        </AgentStatus>
                      </AgentItemHeader>
                      
                      <AgentDescription>
                        {agent.description}
                      </AgentDescription>
                      
                      <AgentMeta>
                        <AgentDate>
                          {formatDate(agent.createdAt)}
                        </AgentDate>
                      </AgentMeta>
                    </AgentItem>
                  ))}
                </AgentsList>
              </ExistingAgentsCard>
            </ExistingAgentsSection>
          )}

          {/* Loading State for Existing Agents */}
          {isLoadingAgents && (
            <ExistingAgentsSection
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <ExistingAgentsCard>
                <ExistingAgentsTitle>
                  🤖 Your Agents
                </ExistingAgentsTitle>
                <LoadingSpinner />
              </ExistingAgentsCard>
            </ExistingAgentsSection>
          )}

          {/* Empty State for No Agents */}
          {!isLoadingAgents && existingAgents.length === 0 && (
            <ExistingAgentsSection
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <ExistingAgentsCard>
                <ExistingAgentsTitle>
                  🤖 Your Agents
                </ExistingAgentsTitle>
                <EmptyState>
                  <p>No agents created yet.</p>
                  <p>Create your first AI sales agent using the form on the left!</p>
                </EmptyState>
              </ExistingAgentsCard>
            </ExistingAgentsSection>
          )}
        </RightPanel>
      </MainLayout>
    </AgentContainer>
  );
};

export default Agent;

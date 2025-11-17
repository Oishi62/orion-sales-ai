import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import workflowService from '../services/workflowService';

// Custom Node Components
const ScheduleNode = ({ data, selected, id }) => {
  return (
    <NodeContainer selected={selected} nodeType="schedule">
      {/* Connection Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          background: '#10b981',
          border: '2px solid #fff',
          width: '12px',
          height: '12px',
        }}
      />
      
      <NodeHeader>
        <NodeIcon>⏰</NodeIcon>
        <NodeTitle>Schedule</NodeTitle>
        <NodeBadge nodeType="schedule">SCHEDULE</NodeBadge>
        <DeleteButton onClick={(e) => {
          e.stopPropagation();
          data.onDelete?.(id);
        }}>
          ×
        </DeleteButton>
      </NodeHeader>
      <NodeContent>
        <NodeDescription>
          {data.config?.frequency && data.config?.unit 
            ? `${data.config.frequency} time${data.config.frequency > 1 ? 's' : ''} per ${String(data.config.unit).slice(0, -1)}`
            : 'Not configured'
          }
        </NodeDescription>
      </NodeContent>
    </NodeContainer>
  );
};

const AgentNode = ({ data, selected, id }) => {
  return (
    <NodeContainer selected={selected} nodeType="agent">
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{
          background: '#f59e0b',
          border: '2px solid #fff',
          width: '12px',
          height: '12px',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          background: '#10b981',
          border: '2px solid #fff',
          width: '12px',
          height: '12px',
        }}
      />
      
      <NodeHeader>
        <NodeIcon>⚙️</NodeIcon>
        <NodeTitle>{data.name || 'Agent'}</NodeTitle>
        <NodeBadge nodeType="agent">AGENT</NodeBadge>
        <DeleteButton onClick={(e) => {
          e.stopPropagation();
          data.onDelete?.(id);
        }}>
          ×
        </DeleteButton>
      </NodeHeader>
      <NodeContent>
        <NodeDescription>
          {data.config?.agentId 
            ? `Fetch ${data.config.leadCount || 25} leads using ${data.name}`
            : 'Not configured'
          }
        </NodeDescription>
      </NodeContent>
    </NodeContainer>
  );
};

const LeadResearchNode = ({ data, selected, id }) => {
  return (
    <NodeContainer selected={selected} nodeType="lead_research">
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{
          background: '#f59e0b',
          border: '2px solid #fff',
          width: '12px',
          height: '12px',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          background: '#10b981',
          border: '2px solid #fff',
          width: '12px',
          height: '12px',
        }}
      />
      
      <NodeHeader>
        <NodeIcon>🔍</NodeIcon>
        <NodeTitle>Lead Research</NodeTitle>
        <NodeBadge nodeType="lead_research">RESEARCH</NodeBadge>
        <DeleteButton onClick={(e) => {
          e.stopPropagation();
          data.onDelete?.(id);
        }}>
          ×
        </DeleteButton>
      </NodeHeader>
      <NodeContent>
        <NodeDescription>
          {data.config?.ragLimit 
            ? `Research leads with ${data.config.ragLimit} RAG results`
            : 'Research leads using AI and documentation'
          }
        </NodeDescription>
      </NodeContent>
    </NodeContainer>
  );
};

const DraftEmailNode = ({ data, selected, id }) => {
  return (
    <NodeContainer selected={selected} nodeType="draft_email">
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{
          background: '#f59e0b',
          border: '2px solid #fff',
          width: '12px',
          height: '12px',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          background: '#10b981',
          border: '2px solid #fff',
          width: '12px',
          height: '12px',
        }}
      />
      
      <NodeHeader>
        <NodeIcon>📧</NodeIcon>
        <NodeTitle>Draft Email</NodeTitle>
        <NodeBadge nodeType="draft_email">EMAIL</NodeBadge>
        <DeleteButton onClick={(e) => {
          e.stopPropagation();
          data.onDelete?.(id);
        }}>
          ×
        </DeleteButton>
      </NodeHeader>
      <NodeContent>
        <NodeDescription>
          Draft personalized emails using Gemini AI based on lead insights
        </NodeDescription>
      </NodeContent>
    </NodeContainer>
  );
};

// Node types for ReactFlow
const nodeTypes = {
  schedule: ScheduleNode,
  agent: AgentNode,
  lead_research: LeadResearchNode,
  draft_email: DraftEmailNode,
};

const WorkflowBuilder = () => {
  const { workflowId } = useParams();
  const navigate = useNavigate();
  
  // ReactFlow states
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // UI states
  const [workflow, setWorkflow] = useState({
    name: 'Untitled Workflow',
    description: '',
    status: 'draft'
  });
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedNodeForConfig, setSelectedNodeForConfig] = useState(null);
  const [scheduleConfig, setScheduleConfig] = useState({
    frequency: 1,
    unit: 'days'
  });
  const [agentConfig, setAgentConfig] = useState({
    agentId: '',
    leadCount: 25
  });
  const [leadResearchConfig, setLeadResearchConfig] = useState({
    ragLimit: 5,
    ragThreshold: 0.3,
    maxConcurrent: 2
  });
  const [availableAgents, setAvailableAgents] = useState([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempWorkflowName, setTempWorkflowName] = useState('');

  // Available node types for the palette
  const nodeLibrary = [
    {
      type: 'schedule',
      icon: '⏰',
      name: 'Schedule',
      description: 'Trigger workflow at specific times or intervals',
      category: 'TRIGGERS'
    },
    {
      type: 'lead_research',
      icon: '🔍',
      name: 'Lead Research',
      description: 'Research leads using AI and RAG system',
      category: 'ACTIONS'
    },
    {
      type: 'draft_email',
      icon: '📧',
      name: 'Draft Email',
      description: 'Draft personalized emails using Gemini AI',
      category: 'ACTIONS'
    }
  ];

  // Load workflow data
  useEffect(() => {
    if (workflowId) {
      loadWorkflow();
    }
    loadAgents();
  }, [workflowId]);

  const loadWorkflow = async () => {
    try {
      console.log('🔄 Loading workflow with ID:', workflowId);
      const response = await workflowService.getWorkflow(workflowId);
      console.log('📥 Workflow response:', response);
      
      if (response.success) {
        const workflowData = response.data.workflow; // Fix: Access nested workflow object
        console.log('📊 Workflow data:', workflowData);
        console.log('🔗 Nodes:', workflowData.nodes);
        console.log('🔗 Connections:', workflowData.connections);
        
        setWorkflow(workflowData);
        
        // Convert workflow nodes to ReactFlow format
        const reactFlowNodes = workflowData.nodes?.map(node => ({
          id: node.id,
          type: node.type,
          position: node.position || { x: 100, y: 100 },
          data: {
            name: node.name,
            config: node.config,
            onDelete: deleteNode,
            ...node.data
          }
        })) || [];
        
        console.log('⚛️ ReactFlow nodes:', reactFlowNodes);
        
        // Convert workflow connections to ReactFlow edges
        const reactFlowEdges = workflowData.connections?.map(conn => ({
          id: conn.id,
          source: conn.source,
          target: conn.target,
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#8b5cf6',
          },
          style: {
            stroke: '#8b5cf6',
            strokeWidth: 2,
          },
        })) || [];
        
        console.log('⚛️ ReactFlow edges:', reactFlowEdges);
        
        setNodes(reactFlowNodes);
        setEdges(reactFlowEdges);
        
        console.log('✅ Workflow loaded successfully');
      } else {
        console.error('❌ Failed to load workflow:', response.error);
      }
    } catch (error) {
      console.error('❌ Error loading workflow:', error);
    }
  };

  const loadAgents = async () => {
    try {
      const response = await workflowService.getAgentsForWorkflow();
      if (response.success) {
        setAvailableAgents(response.data.agents);
      }
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  // Handle connection creation
  const onConnect = useCallback((params) => {
    const newEdge = {
      ...params,
      type: 'smoothstep',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#8b5cf6',
      },
      style: {
        stroke: '#8b5cf6',
        strokeWidth: 2,
      },
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges]);

  // Handle node click for configuration
  const onNodeClick = useCallback((event, node) => {
    // Don't open config modal for Lead Research and Draft Email nodes - they don't need user input
    if (node.type === 'lead_research' || node.type === 'draft_email') {
      return;
    }
    
    setSelectedNodeForConfig(node);
    
    if (node.type === 'schedule') {
      const config = node.data.config || {};
      setScheduleConfig({
        frequency: config.frequency || 1,
        unit: config.unit || 'days'
      });
    } else if (node.type === 'agent') {
      const config = node.data.config || {};
      setAgentConfig({
        agentId: config.agentId || '',
        leadCount: config.leadCount || 25
      });
    }
    
    setShowConfigModal(true);
  }, []);

  // Handle edge click for deletion
  const onEdgeClick = useCallback((event, edge) => {
    event.stopPropagation();
    if (window.confirm('Delete this connection?')) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }
  }, [setEdges]);

  // Add new node to canvas
  const addNode = (nodeType, agentData = null) => {
    let nodeName = nodeType.charAt(0).toUpperCase() + nodeType.slice(1);
    let nodeConfig = {};
    
    if (agentData) {
      nodeName = agentData.name;
      nodeConfig = { agentId: agentData.id, leadCount: 25 };
    } else if (nodeType === 'lead_research') {
      nodeName = 'Lead Research';
      nodeConfig = { ragLimit: 5, ragThreshold: 0.3, maxConcurrent: 2 };
    } else if (nodeType === 'draft_email') {
      nodeName = 'Draft Email';
      nodeConfig = { maxConcurrent: 3 };
    }
    
    const newNode = {
      id: `${nodeType}_${Date.now()}`,
      type: nodeType,
      position: { x: 250, y: 250 },
      data: {
        name: nodeName,
        config: nodeConfig,
        onDelete: deleteNode
      }
    };
    
    setNodes((nds) => nds.concat(newNode));
  };

  // Delete node from canvas
  const deleteNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  }, [setNodes, setEdges]);

  // Handle workflow name editing
  const handleNameClick = () => {
    setTempWorkflowName(workflow.name);
    setIsEditingName(true);
  };

  const handleNameSave = () => {
    if (tempWorkflowName.trim()) {
      setWorkflow(prev => ({ ...prev, name: tempWorkflowName.trim() }));
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setTempWorkflowName('');
    setIsEditingName(false);
  };

  const handleNameKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };

  // Save node configuration
  const saveNodeConfig = () => {
    if (!selectedNodeForConfig) return;
    
    let config;
    if (selectedNodeForConfig.type === 'schedule') {
      config = scheduleConfig;
    } else if (selectedNodeForConfig.type === 'agent') {
      config = agentConfig;
    } else if (selectedNodeForConfig.type === 'lead_research') {
      config = leadResearchConfig;
    }
    
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNodeForConfig.id
          ? {
              ...node,
              data: {
                ...node.data,
                config,
                onDelete: deleteNode
              }
            }
          : node
      )
    );
    
    setShowConfigModal(false);
    setSelectedNodeForConfig(null);
  };

  // Save workflow
  const saveWorkflow = async () => {
    try {
      // Convert ReactFlow format back to our workflow format
      const workflowData = {
        ...workflow,
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          name: node.data.name,
          position: node.position,
          data: node.data,
          config: node.data.config
        })),
        connections: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: 'output',
          targetHandle: 'input'
        }))
      };

      let response;
      if (workflowId) {
        response = await workflowService.updateWorkflow(workflowId, workflowData);
      } else {
        response = await workflowService.createWorkflow(workflowData);
      }

      if (response.success) {
        alert('Workflow saved successfully!');
        if (!workflowId) {
          navigate(`/workflow/builder/${response.data._id}`);
        }
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Failed to save workflow');
    }
  };

  return (
    <BuilderContainer>
      <Header>
        <BackButton onClick={() => navigate('/workflow')}>
          ← Back
        </BackButton>
        <Title>Workflow</Title>
        <SaveButton onClick={saveWorkflow}>
          Save
        </SaveButton>
      </Header>

      <BuilderContent>
        <NodePalette>
          <PaletteHeader>
            <PaletteIcon>🧩</PaletteIcon>
            <PaletteTitle>Node Library</PaletteTitle>
          </PaletteHeader>

          <NodeCategory>
            <CategoryTitle>TOOLS</CategoryTitle>
            {nodeLibrary.map((nodeType) => (
              <PaletteNode
                key={nodeType.type}
                onClick={() => addNode(nodeType.type)}
              >
                <NodeIcon>{nodeType.icon}</NodeIcon>
                <div>
                  <NodeName>{nodeType.name}</NodeName>
                  <NodeDesc>{nodeType.description}</NodeDesc>
                </div>
              </PaletteNode>
            ))}
          </NodeCategory>

          <NodeCategory>
            <CategoryTitle>AGENTS</CategoryTitle>
            {availableAgents.map((agent) => (
              <PaletteNode
                key={agent.id}
                onClick={() => addNode('agent', agent)}
                disabled={!agent.hasApolloConfig}
              >
                <NodeIcon>➜</NodeIcon>
                <div>
                  <NodeName>{agent.name}</NodeName>
                  <NodeDesc>
                    {agent.hasApolloConfig 
                      ? `Fetch leads using ${agent.name} configuration`
                      : 'No Apollo ICP configuration'
                    }
                  </NodeDesc>
                </div>
              </PaletteNode>
            ))}
          </NodeCategory>
        </NodePalette>

        <FlowContainer>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Controls />
            <MiniMap />
            <Background variant="dots" gap={12} size={1} />
            <Panel position="top-center">
              {isEditingName ? (
                <WorkflowNameInput
                  type="text"
                  value={tempWorkflowName}
                  onChange={(e) => setTempWorkflowName(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={handleNameKeyPress}
                  autoFocus
                  placeholder="Enter workflow name"
                />
              ) : (
                <WorkflowTitle onClick={handleNameClick} title="Click to edit">
                  {workflow.name}
                </WorkflowTitle>
              )}
            </Panel>
          </ReactFlow>
        </FlowContainer>
      </BuilderContent>

      {/* Configuration Modal */}
      {showConfigModal && selectedNodeForConfig && (
        <Modal>
          <ModalOverlay onClick={() => setShowConfigModal(false)} />
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                Configure {
                  selectedNodeForConfig.type === 'schedule' ? 'Schedule' : 
                  selectedNodeForConfig.type === 'agent' ? 'Agent' : 
                  'Lead Research'
                } Node
              </ModalTitle>
              <CloseButton onClick={() => setShowConfigModal(false)}>×</CloseButton>
            </ModalHeader>

            <ModalBody>
              {selectedNodeForConfig.type === 'schedule' && (
                <ConfigSection>
                  <ConfigLabel>Schedule Frequency</ConfigLabel>
                  <ConfigRow>
                    <ConfigInput
                      type="number"
                      min="1"
                      max="10"
                      value={scheduleConfig.frequency}
                      onChange={(e) => setScheduleConfig(prev => ({
                        ...prev,
                        frequency: parseInt(e.target.value)
                      }))}
                    />
                    <ConfigSelect
                      value={scheduleConfig.unit}
                      onChange={(e) => setScheduleConfig(prev => ({
                        ...prev,
                        unit: e.target.value
                      }))}
                    >
                      <option value="days">time(s) per day</option>
                      <option value="weeks">time(s) per week</option>
                      <option value="months">time(s) per month</option>
                    </ConfigSelect>
                  </ConfigRow>
                  <ConfigDescription>
                    This will execute {scheduleConfig.frequency} time{scheduleConfig.frequency > 1 ? 's' : ''} per {String(scheduleConfig.unit || 'day').slice(0, -1)}
                  </ConfigDescription>
                </ConfigSection>
              )}

              {selectedNodeForConfig.type === 'agent' && (
                <ConfigSection>
                  <ConfigLabel>Select Agent</ConfigLabel>
                  <ConfigSelect
                    value={agentConfig.agentId}
                    onChange={(e) => setAgentConfig(prev => ({
                      ...prev,
                      agentId: e.target.value
                    }))}
                  >
                    <option value="">Select an agent...</option>
                    {availableAgents
                      .filter(agent => agent.hasApolloConfig)
                      .map(agent => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name}
                        </option>
                      ))
                    }
                  </ConfigSelect>

                  <ConfigLabel>Number of Leads to Fetch</ConfigLabel>
                  <ConfigInput
                    type="number"
                    min="1"
                    max="100"
                    value={agentConfig.leadCount}
                    onChange={(e) => setAgentConfig(prev => ({
                      ...prev,
                      leadCount: parseInt(e.target.value)
                    }))}
                  />
                  <ConfigDescription>
                    This will fetch {agentConfig.leadCount} leads from Apollo using the selected agent's ICP configuration
                  </ConfigDescription>
                </ConfigSection>
              )}

              {selectedNodeForConfig.type === 'lead_research' && (
                <ConfigSection>
                  <ConfigLabel>RAG Results Limit</ConfigLabel>
                  <ConfigInput
                    type="number"
                    min="1"
                    max="20"
                    value={leadResearchConfig.ragLimit}
                    onChange={(e) => setLeadResearchConfig(prev => ({
                      ...prev,
                      ragLimit: parseInt(e.target.value)
                    }))}
                  />
                  <ConfigDescription>
                    Number of relevant documentation pieces to retrieve for each lead
                  </ConfigDescription>

                  <ConfigLabel>RAG Similarity Threshold</ConfigLabel>
                  <ConfigInput
                    type="number"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={leadResearchConfig.ragThreshold}
                    onChange={(e) => setLeadResearchConfig(prev => ({
                      ...prev,
                      ragThreshold: parseFloat(e.target.value)
                    }))}
                  />
                  <ConfigDescription>
                    Minimum similarity score for RAG results (0.1 = loose, 1.0 = exact match)
                  </ConfigDescription>

                  <ConfigLabel>Max Concurrent Requests</ConfigLabel>
                  <ConfigInput
                    type="number"
                    min="1"
                    max="5"
                    value={leadResearchConfig.maxConcurrent}
                    onChange={(e) => setLeadResearchConfig(prev => ({
                      ...prev,
                      maxConcurrent: parseInt(e.target.value)
                    }))}
                  />
                  <ConfigDescription>
                    Number of leads to research simultaneously (higher = faster but more resource intensive)
                  </ConfigDescription>
                </ConfigSection>
              )}
            </ModalBody>

            <ModalFooter>
              <CancelButton onClick={() => setShowConfigModal(false)}>
                Cancel
              </CancelButton>
              <SaveConfigButton onClick={saveNodeConfig}>
                Save Configuration
              </SaveConfigButton>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </BuilderContainer>
  );
};

// Styled Components
const BuilderContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--primary-bg);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: var(--secondary-bg);
  border-bottom: 1px solid var(--border-color);
`;

const BackButton = styled.button`
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--hover-bg);
  }
`;

const Title = styled.h1`
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
`;

const SaveButton = styled.button`
  background: var(--accent-cyan);
  border: none;
  color: var(--primary-bg);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: #00d4dd;
  }
`;

const BuilderContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const NodePalette = styled.div`
  width: 350px;
  background: var(--secondary-bg);
  border-right: 1px solid var(--border-color);
  padding: 1rem;
  overflow-y: auto;
`;

const PaletteHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const PaletteIcon = styled.span`
  font-size: 1.2rem;
`;

const PaletteTitle = styled.h3`
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
`;

const NodeCategory = styled.div`
  margin-bottom: 2rem;
`;

const CategoryTitle = styled.h4`
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
`;

const PaletteNode = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: ${props => props.disabled ? 0.5 : 1};
  pointer-events: ${props => props.disabled ? 'none' : 'auto'};

  &:hover {
    background: var(--hover-bg);
    border-color: var(--accent-cyan);
  }
`;

const NodeIcon = styled.span`
  font-size: 1.2rem;
  flex-shrink: 0;
`;

const NodeName = styled.div`
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.9rem;
`;

const NodeDesc = styled.div`
  color: var(--text-secondary);
  font-size: 0.75rem;
  margin-top: 0.25rem;
`;

const FlowContainer = styled.div`
  flex: 1;
  height: 100%;
  
  .react-flow__node {
    cursor: pointer;
  }
  
  .react-flow__edge {
    cursor: pointer;
  }
  
  .react-flow__edge-path {
    stroke-width: 3;
    transition: stroke-width 0.2s ease;
  }
  
  .react-flow__edge:hover .react-flow__edge-path {
    stroke-width: 5;
    stroke: #a855f7;
  }
  
  .react-flow__controls {
    background: var(--secondary-bg);
    border: 1px solid var(--border-color);
  }
  
  .react-flow__controls-button {
    background: var(--secondary-bg);
    border-bottom: 1px solid var(--border-color);
    color: var(--text-primary);
    
    &:hover {
      background: var(--hover-bg);
    }
  }
  
  .react-flow__minimap {
    background: var(--secondary-bg);
    border: 1px solid var(--border-color);
  }
`;

const WorkflowTitle = styled.div`
  background: var(--secondary-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0.5rem 1rem;
  color: var(--text-primary);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--accent-cyan);
    background: rgba(0, 246, 255, 0.05);
  }
`;

const WorkflowNameInput = styled.input`
  background: var(--secondary-bg);
  border: 2px solid var(--accent-cyan);
  border-radius: 6px;
  padding: 0.5rem 1rem;
  color: var(--text-primary);
  font-weight: 500;
  font-family: inherit;
  font-size: inherit;
  outline: none;
  min-width: 200px;

  &::placeholder {
    color: var(--text-muted);
  }
`;

// Node Components Styling
const NodeContainer = styled.div`
  background: var(--secondary-bg);
  border: 2px solid ${props => props.selected ? 'var(--accent-cyan)' : 'var(--border-color)'};
  border-radius: 8px;
  min-width: 200px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--accent-cyan);
    box-shadow: 0 6px 20px rgba(0, 246, 255, 0.2);
  }
`;

const NodeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-bottom: 1px solid var(--border-color);
  position: relative;
`;

const NodeTitle = styled.span`
  color: var(--text-primary);
  font-weight: 500;
  flex: 1;
`;

const NodeBadge = styled.span`
  background: ${props => 
    props.nodeType === 'schedule' ? '#8b5cf6' : 
    props.nodeType === 'agent' ? '#10b981' : 
    props.nodeType === 'lead_research' ? '#f59e0b' : '#6b7280'
  };
  color: white;
  font-size: 0.6rem;
  font-weight: 600;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  letter-spacing: 0.05em;
`;

const NodeContent = styled.div`
  padding: 0.75rem;
`;

const NodeDescription = styled.div`
  color: var(--text-secondary);
  font-size: 0.8rem;
  line-height: 1.4;
`;

const DeleteButton = styled.button`
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ef4444;
  border: 2px solid var(--secondary-bg);
  color: white;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 10;

  &:hover {
    background: #dc2626;
    transform: scale(1.1);
  }

  ${NodeContainer}:hover & {
    opacity: 1;
  }
`;

// Modal Components
const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
`;

const ModalContent = styled.div`
  background: var(--secondary-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  width: 500px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  position: relative;
  z-index: 1001;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
`;

const ModalTitle = styled.h3`
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: var(--hover-bg);
    color: var(--text-primary);
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const ConfigSection = styled.div`
  margin-bottom: 1.5rem;
`;

const ConfigLabel = styled.label`
  display: block;
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: 0.5rem;
`;

const ConfigRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const ConfigInput = styled.input`
  background: var(--primary-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0.5rem;
  color: var(--text-primary);
  font-size: 0.9rem;
  width: 80px;

  &:focus {
    outline: none;
    border-color: var(--accent-cyan);
  }
`;

const ConfigSelect = styled.select`
  background: var(--primary-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0.5rem;
  color: var(--text-primary);
  font-size: 0.9rem;
  flex: 1;

  &:focus {
    outline: none;
    border-color: var(--accent-cyan);
  }
`;

const ConfigDescription = styled.div`
  color: var(--text-secondary);
  font-size: 0.8rem;
  margin-top: 0.5rem;
  font-style: italic;
`;

const ModalFooter = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
`;

const CancelButton = styled.button`
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--hover-bg);
  }
`;

const SaveConfigButton = styled.button`
  background: var(--accent-cyan);
  border: none;
  color: var(--primary-bg);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: #00d4dd;
  }
`;

export default WorkflowBuilder;
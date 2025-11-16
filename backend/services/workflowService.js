const Workflow = require('../models/Workflow');
const Execution = require('../models/Execution');
const Agent = require('../models/Agent');
const apolloService = require('./apolloService');
const leadResearchService = require('./leadResearchService');

class WorkflowService {
  // Create a new workflow
  async createWorkflow(workflowData) {
    try {
      const workflow = new Workflow(workflowData);
      return await workflow.save();
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }

  // Get workflows by user
  async getWorkflowsByUser(userId, options = {}) {
    try {
      const { status, page = 1, limit = 10 } = options;
      const query = { userId, isActive: true };
      
      if (status) {
        query.status = status;
      }

      const workflows = await Workflow.find(query)
        .sort({ updatedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      return workflows;
    } catch (error) {
      console.error('Error fetching workflows:', error);
      throw error;
    }
  }

  // Get workflow by ID
  async getWorkflowById(workflowId, userId) {
    try {
      return await Workflow.findOne({ 
        _id: workflowId, 
        userId, 
        isActive: true 
      });
    } catch (error) {
      console.error('Error fetching workflow:', error);
      throw error;
    }
  }

  // Update workflow
  async updateWorkflow(workflowId, userId, updateData) {
    try {
      const workflow = await Workflow.findOne({ 
        _id: workflowId, 
        userId, 
        isActive: true 
      });

      if (!workflow) {
        return null;
      }

      // Update allowed fields
      const allowedFields = ['name', 'description', 'nodes', 'connections', 'settings'];
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          workflow[field] = updateData[field];
        }
      });

      return await workflow.save();
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw error;
    }
  }

  // Delete workflow (soft delete)
  async deleteWorkflow(workflowId, userId) {
    try {
      const workflow = await Workflow.findOne({ 
        _id: workflowId, 
        userId, 
        isActive: true 
      });

      if (!workflow) {
        return false;
      }

      workflow.isActive = false;
      workflow.status = 'inactive';
      await workflow.save();

      return true;
    } catch (error) {
      console.error('Error deleting workflow:', error);
      throw error;
    }
  }

  // Activate workflow
  async activateWorkflow(workflowId, userId) {
    try {
      const workflow = await Workflow.findOne({ 
        _id: workflowId, 
        userId, 
        isActive: true 
      });

      if (!workflow) {
        return null;
      }

      // Validate workflow has required nodes
      const validation = this.validateWorkflow(workflow);
      if (!validation.isValid) {
        throw new Error(`Workflow validation failed: ${validation.errors.join(', ')}`);
      }

      workflow.status = 'active';
      
      // Set next scheduled time for schedule nodes
      const scheduleNodes = workflow.getScheduleNodes();
      if (scheduleNodes.length > 0) {
        const nextRun = this.calculateNextScheduledTime(scheduleNodes);
        workflow.stats.nextScheduledAt = nextRun;
      }

      return await workflow.save();
    } catch (error) {
      console.error('Error activating workflow:', error);
      throw error;
    }
  }

  // Pause workflow
  async pauseWorkflow(workflowId, userId) {
    try {
      const workflow = await Workflow.findOne({ 
        _id: workflowId, 
        userId, 
        isActive: true 
      });

      if (!workflow) {
        return null;
      }

      workflow.status = 'paused';
      return await workflow.save();
    } catch (error) {
      console.error('Error pausing workflow:', error);
      throw error;
    }
  }

  // Execute workflow
  async executeWorkflow(workflowId, userId, executionOptions = {}) {
    try {
      const workflow = await Workflow.findOne({ 
        _id: workflowId, 
        userId, 
        isActive: true 
      });

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      // Create execution record
      const execution = new Execution({
        workflowId: workflow._id,
        workflowName: workflow.name,
        userId,
        triggerType: executionOptions.triggerType || 'manual',
        input: executionOptions.input || {},
        status: 'pending'
      });

      await execution.save();

      // Start execution asynchronously
      setImmediate(async () => {
        try {
          await this.runWorkflowExecution(workflow, execution);
        } catch (error) {
          console.error('Error in workflow execution:', error);
          await execution.fail(error);
        }
      });

      return execution;
    } catch (error) {
      console.error('Error executing workflow:', error);
      throw error;
    }
  }

  // Run workflow execution
  async runWorkflowExecution(workflow, execution) {
    try {
      await execution.start();

      // For now, we'll implement a simple execution for schedule nodes
      const scheduleNodes = workflow.nodes.filter(node => node.type === 'schedule');
      
      if (scheduleNodes.length === 0) {
        throw new Error('No executable nodes found in workflow');
      }

      // Execute all nodes in the workflow
      const allNodes = workflow.nodes;
      let previousNodeOutput = execution.input; // Start with initial input
      
      for (const node of allNodes) {
        const nodeExecution = {
          nodeId: node.id,
          nodeName: node.name,
          nodeType: node.type,
          status: 'running',
          startedAt: new Date(),
          input: previousNodeOutput
        };

        await execution.addNodeExecution(nodeExecution);

        try {
          // Execute node based on type
          let output;
          switch (node.type) {
            case 'schedule':
              output = await this.executeScheduleNode(node, previousNodeOutput);
              break;
            case 'agent':
              output = await this.executeAgentNode(node, previousNodeOutput);
              break;
            case 'lead_research':
              output = await this.executeLeadResearchNode(node, previousNodeOutput);
              break;
            default:
              throw new Error(`Unsupported node type: ${node.type}`);
          }
          
          nodeExecution.status = 'success';
          nodeExecution.completedAt = new Date();
          nodeExecution.duration = nodeExecution.completedAt - nodeExecution.startedAt;
          nodeExecution.output = output;

          await execution.updateNodeExecution(node.id, nodeExecution);
          
          // Pass output to next node as input
          previousNodeOutput = { 
            ...previousNodeOutput, 
            leads: output.leads || previousNodeOutput.leads,
            researchResults: output.researchResults || previousNodeOutput.researchResults,
            agentId: output.agentId || previousNodeOutput.agentId
          };
        } catch (nodeError) {
          nodeExecution.status = 'failed';
          nodeExecution.completedAt = new Date();
          nodeExecution.duration = nodeExecution.completedAt - nodeExecution.startedAt;
          nodeExecution.error = {
            message: nodeError.message,
            stack: nodeError.stack
          };

          await execution.updateNodeExecution(node.id, nodeExecution);
          throw nodeError;
        }
      }

      // Complete execution
      await execution.complete({ message: 'Workflow executed successfully' });

      // Update workflow stats
      workflow.stats.totalExecutions += 1;
      workflow.stats.successfulExecutions += 1;
      workflow.stats.lastExecutedAt = new Date();
      
      // Calculate next scheduled time
      const nextRun = this.calculateNextScheduledTime(scheduleNodes);
      if (nextRun) {
        workflow.stats.nextScheduledAt = nextRun;
      }

      await workflow.save();

    } catch (error) {
      await execution.fail(error);
      
      // Update workflow stats
      workflow.stats.totalExecutions += 1;
      workflow.stats.failedExecutions += 1;
      workflow.stats.lastExecutedAt = new Date();
      await workflow.save();

      throw error;
    }
  }

  // Execute schedule node
  async executeScheduleNode(node, input) {
    // For now, just return a success message
    // In the future, this will trigger actual scheduled actions
    return {
      message: `Schedule node '${node.name}' executed successfully`,
      scheduledAt: new Date(),
      config: node.config,
      input
    };
  }

  // Execute agent node
  async executeAgentNode(node, input) {
    try {
      const { agentId, leadCount = 25 } = node.config || {};
      
      if (!agentId) {
        throw new Error('Agent node is not configured with an agent ID');
      }

      // Fetch the agent with ICP data
      const agent = await Agent.findById(agentId);
      if (!agent) {
        throw new Error(`Agent with ID ${agentId} not found`);
      }

      if (!agent.apollo) {
        throw new Error(`Agent ${agent.agent.name} does not have Apollo ICP configuration`);
      }

      console.log(`🤖 Executing agent node: ${node.name} (Agent: ${agent.agent.name})`);
      console.log(`📊 Fetching ${leadCount} leads using Apollo API`);

      // Fetch leads from Apollo
      const leads = await apolloService.fetchLeadsForAgent(agent, leadCount);

      return {
        message: `Agent node '${node.name}' executed successfully`,
        agentId: agentId,
        agentName: agent.agent.name,
        leadCount: leads.length,
        requestedCount: leadCount,
        leads: leads,
        executedAt: new Date(),
        config: node.config,
        input
      };
    } catch (error) {
      console.error(`❌ Error executing agent node '${node.name}':`, error);
      throw error;
    }
  }

  // Execute lead research node
  async executeLeadResearchNode(node, input) {
    try {
      console.log(`🔬 Executing lead research node: ${node.name}`);

      // Get leads from previous node execution (typically from an agent node)
      // For now, we'll expect leads to be passed in the input
      const leads = input.leads || [];
      const agentId = input.agentId; // Extract agentId from previous agent node
      
      if (!leads || leads.length === 0) {
        throw new Error('Lead research node requires leads from previous node');
      }

      console.log(`📊 Processing ${leads.length} leads for research`);
      
      if (agentId) {
        console.log(`🎯 Using agentId: ${agentId} for RAG filtering`);
      }

      // Get configuration from node
      const config = node.config || {};
      
      const leadResearchConfig = {
        ragLimit: config.ragLimit || 5,
        ragThreshold: config.ragThreshold || 0.3, // Lowered from 0.7 to 0.5
        maxConcurrent: config.maxConcurrent || 2,
        agentId: agentId // Pass agentId to lead research service
      };
      
      console.log('🔍 Lead Research Config from workflow:', leadResearchConfig);
      console.log('🔍 Node config:', config);
      
      // Perform lead research
      const researchResults = await leadResearchService.performBulkLeadResearch(leads, leadResearchConfig);

      return {
        message: `Lead research node '${node.name}' executed successfully`,
        nodeId: node.id,
        nodeName: node.name,
        processedLeads: researchResults.successCount,
        failedLeads: researchResults.failureCount,
        totalLeads: researchResults.total,
        researchResults: researchResults.successful,
        failures: researchResults.failed,
        executedAt: new Date(),
        config: node.config,
        input
      };
    } catch (error) {
      console.error(`❌ Error executing lead research node '${node.name}':`, error);
      throw error;
    }
  }

  // Validate workflow
  validateWorkflow(workflow) {
    const errors = [];
    
    if (!workflow.nodes || workflow.nodes.length === 0) {
      errors.push('Workflow must have at least one node');
    }

    // Check for schedule nodes
    const scheduleNodes = workflow.nodes.filter(node => node.type === 'schedule');
    if (scheduleNodes.length === 0) {
      errors.push('Workflow must have at least one schedule node');
    }

    // Validate schedule node configurations
    scheduleNodes.forEach(node => {
      if (!node.config || !node.config.schedule) {
        errors.push(`Schedule node '${node.name}' must have schedule configuration`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Calculate next scheduled time
  calculateNextScheduledTime(scheduleNodes) {
    if (!scheduleNodes || scheduleNodes.length === 0) {
      return null;
    }

    // For now, return 1 hour from now for any schedule node
    // In the future, this will parse cron expressions and intervals
    const now = new Date();
    return new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
  }

  // Get workflow executions
  async getWorkflowExecutions(workflowId, userId, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      
      // Verify workflow ownership
      const workflow = await Workflow.findOne({ 
        _id: workflowId, 
        userId, 
        isActive: true 
      });

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      const executions = await Execution.find({ workflowId })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      return executions;
    } catch (error) {
      console.error('Error fetching workflow executions:', error);
      throw error;
    }
  }
}

module.exports = new WorkflowService();

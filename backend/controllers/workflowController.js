const { validationResult } = require('express-validator');
const workflowService = require('../services/workflowService');
const Execution = require('../models/Execution');

// @desc    Create new workflow
// @route   POST /api/workflows
// @access  Private
const createWorkflow = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description, nodes = [], connections = [] } = req.body;
    const userId = req.user.userId;

    const workflowData = {
      userId,
      name: name.trim(),
      description: description?.trim() || '',
      nodes,
      connections,
      status: 'draft'
    };

    const workflow = await workflowService.createWorkflow(workflowData);

    res.status(201).json({
      success: true,
      message: 'Workflow created successfully',
      data: {
        workflow: {
          id: workflow._id,
          name: workflow.name,
          description: workflow.description,
          status: workflow.status,
          nodes: workflow.nodes,
          connections: workflow.connections,
          createdAt: workflow.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during workflow creation'
    });
  }
};

// @desc    Get all workflows for user
// @route   GET /api/workflows
// @access  Private
const getWorkflows = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, page = 1, limit = 10 } = req.query;

    const workflows = await workflowService.getWorkflowsByUser(userId, {
      status,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    // Get actual execution counts from the database
    const workflowsWithExecutionCounts = await Promise.all(
      workflows.map(async (workflow) => {
        const totalExecutions = await Execution.countDocuments({ workflowId: workflow._id });
        return {
          id: workflow._id,
          name: workflow.name,
          description: workflow.description,
          status: workflow.status,
          nodeCount: workflow.nodes.length,
          connectionCount: workflow.connections.length,
          successRate: workflow.successRate,
          totalExecutions,
          lastExecutedAt: workflow.stats.lastExecutedAt,
          nextScheduledAt: workflow.stats.nextScheduledAt,
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt
        };
      })
    );

    res.json({
      success: true,
      data: {
        workflows: workflowsWithExecutionCounts,
        total: workflows.length
      }
    });

  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching workflows'
    });
  }
};

// @desc    Get workflow by ID
// @route   GET /api/workflows/:id
// @access  Private
const getWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const workflow = await workflowService.getWorkflowById(id, userId);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      data: {
        workflow: {
          id: workflow._id,
          name: workflow.name,
          description: workflow.description,
          status: workflow.status,
          nodes: workflow.nodes,
          connections: workflow.connections,
          settings: workflow.settings,
          stats: workflow.stats,
          successRate: workflow.successRate,
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching workflow'
    });
  }
};

// @desc    Update workflow
// @route   PUT /api/workflows/:id
// @access  Private
const updateWorkflow = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.user.userId;
    const updateData = req.body;

    const workflow = await workflowService.updateWorkflow(id, userId, updateData);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      message: 'Workflow updated successfully',
      data: {
        workflow: {
          id: workflow._id,
          name: workflow.name,
          description: workflow.description,
          status: workflow.status,
          nodes: workflow.nodes,
          connections: workflow.connections,
          settings: workflow.settings,
          updatedAt: workflow.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating workflow'
    });
  }
};

// @desc    Delete workflow
// @route   DELETE /api/workflows/:id
// @access  Private
const deleteWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const deleted = await workflowService.deleteWorkflow(id, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      message: 'Workflow deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting workflow'
    });
  }
};

// @desc    Activate workflow
// @route   POST /api/workflows/:id/activate
// @access  Private
const activateWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const workflow = await workflowService.activateWorkflow(id, userId);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      message: 'Workflow activated successfully',
      data: {
        workflow: {
          id: workflow._id,
          name: workflow.name,
          status: workflow.status,
          nextScheduledAt: workflow.stats.nextScheduledAt
        }
      }
    });

  } catch (error) {
    console.error('Error activating workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while activating workflow'
    });
  }
};

// @desc    Pause workflow
// @route   POST /api/workflows/:id/pause
// @access  Private
const pauseWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const workflow = await workflowService.pauseWorkflow(id, userId);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      message: 'Workflow paused successfully',
      data: {
        workflow: {
          id: workflow._id,
          name: workflow.name,
          status: workflow.status
        }
      }
    });

  } catch (error) {
    console.error('Error pausing workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while pausing workflow'
    });
  }
};

// @desc    Execute workflow manually
// @route   POST /api/workflows/:id/execute
// @access  Private
const executeWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { input = {} } = req.body;

    const execution = await workflowService.executeWorkflow(id, userId, {
      triggerType: 'manual',
      input
    });

    res.json({
      success: true,
      message: 'Workflow execution started',
      data: {
        execution: {
          id: execution._id,
          workflowId: execution.workflowId,
          status: execution.status,
          startedAt: execution.startedAt
        }
      }
    });

  } catch (error) {
    console.error('Error executing workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while executing workflow'
    });
  }
};

// @desc    Get workflow executions
// @route   GET /api/workflows/:id/executions
// @access  Private
const getWorkflowExecutions = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;

    const executions = await workflowService.getWorkflowExecutions(id, userId, { page, limit });

    res.json({
      success: true,
      data: {
        executions
      }
    });

  } catch (error) {
    console.error('Error fetching workflow executions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error while fetching executions'
    });
  }
};

module.exports = {
  createWorkflow,
  getWorkflows,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  activateWorkflow,
  pauseWorkflow,
  executeWorkflow,
  getWorkflowExecutions
};

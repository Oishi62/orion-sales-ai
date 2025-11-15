const { validationResult } = require('express-validator');
const Agent = require('../models/Agent');
const agentService = require('../services/agentService');

// @desc    Create new agent (Step 1: Agent Configuration)
// @route   POST /api/agents
// @access  Private
const createAgent = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description, frequencyValue, frequencyUnit } = req.body;
    const userId = req.user.userId;

    // Create agent with initial configuration
    const agentData = {
      userId,
      agent: {
        name: name.trim(),
        description: description.trim(),
        frequency: {
          value: parseInt(frequencyValue),
          unit: frequencyUnit
        }
      },
      status: 'draft'
    };

    const agent = await agentService.createAgent(agentData);

    res.status(201).json({
      success: true,
      message: 'Agent created successfully',
      data: {
        agent: {
          id: agent._id,
          name: agent.agent.name,
          description: agent.agent.description,
          frequency: agent.agent.frequency,
          status: agent.status
        }
      }
    });

  } catch (error) {
    const { sanitizeError } = require('../utils/sanitizeMiddleware');
    const sanitizedError = sanitizeError(error);
    console.error('❌ Create agent error:', sanitizedError);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error during agent creation'
    });
  }
};

// @desc    Update agent basic information (name, description, frequency)
// @route   PUT /api/agents/:id
// @access  Private
const updateAgent = async (req, res) => {
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
    const { name, description, frequencyValue, frequencyUnit } = req.body;
    const userId = req.user.userId;

    // Find agent and verify ownership
    const agent = await Agent.findOne({ _id: id, userId });
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Update agent basic information
    agent.agent.name = name.trim();
    agent.agent.description = description.trim();
    agent.agent.frequency.value = parseInt(frequencyValue);
    agent.agent.frequency.unit = frequencyUnit;

    const updatedAgent = await agent.save();

    res.json({
      success: true,
      message: 'Agent updated successfully',
      data: {
        agent: {
          id: updatedAgent._id,
          name: updatedAgent.agent.name,
          description: updatedAgent.agent.description,
          frequency: updatedAgent.agent.frequency,
          status: updatedAgent.status,
          createdAt: updatedAgent.createdAt,
          updatedAt: updatedAgent.updatedAt
        }
      }
    });

  } catch (error) {
    const { sanitizeError } = require('../utils/sanitizeMiddleware');
    const sanitizedError = sanitizeError(error);
    console.error('❌ Update agent error:', sanitizedError);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error during agent update'
    });
  }
};

// @desc    Update agent with product description (Step 2)
// @route   PUT /api/agents/:id/product
// @access  Private
const updateAgentProduct = async (req, res) => {
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
    const { description, url } = req.body;
    const userId = req.user.userId;

    // Find agent and verify ownership
    const agent = await Agent.findOne({ _id: id, userId });
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Update product information
    const productData = {
      description: description?.trim(),
      url: url?.trim()
    };

    const updatedAgent = await agentService.updateAgentProduct(id, productData);

    res.json({
      success: true,
      message: 'Product information updated successfully',
      data: {
        agent: {
          id: updatedAgent._id,
          product: updatedAgent.product,
          status: updatedAgent.status
        }
      }
    });

  } catch (error) {
    const { sanitizeError } = require('../utils/sanitizeMiddleware');
    const sanitizedError = sanitizeError(error);
    console.error('❌ Update agent product error:', sanitizedError);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error during product update'
    });
  }
};

// @desc    Update agent with ICP configuration (Step 3)
// @route   PUT /api/agents/:id/icp
// @access  Private
const updateAgentICP = async (req, res) => {
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
    const { 
      jobTitles, 
      companies, 
      locations, 
      revenueType, 
      revenueMin, 
      revenueMax,
      employeeRange,
      fundingStages,
      companyTypes,
      jobTitlesTab,
      includeSimilarTitles
    } = req.body;
    const userId = req.user.userId;

    // Find agent and verify ownership
    const agent = await Agent.findOne({ _id: id, userId });
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Prepare ICP data
    const icpData = {
      jobTitles: Array.isArray(jobTitles) ? jobTitles.filter(Boolean) : [],
      companies: Array.isArray(companies) ? companies.filter(Boolean) : [],
      locations: Array.isArray(locations) ? locations.filter(Boolean) : [],
      revenue: {
        type: revenueType || 'is between',
        min: revenueMin ? parseFloat(revenueMin) : undefined,
        max: revenueMax ? parseFloat(revenueMax) : undefined
      },
      employeeRange,
      fundingStages: Array.isArray(fundingStages) ? fundingStages.filter(Boolean) : [],
      companyTypes: {
        private: Boolean(companyTypes?.private),
        public: Boolean(companyTypes?.public)
      },
      jobTitleSettings: {
        tab: jobTitlesTab || 'simple',
        includeSimilarTitles: Boolean(includeSimilarTitles)
      }
    };

    const updatedAgent = await agentService.updateAgentICP(id, icpData);

    res.json({
      success: true,
      message: 'ICP configuration updated successfully',
      data: {
        agent: {
          id: updatedAgent._id,
          apollo: updatedAgent.apollo,
          status: updatedAgent.status
        }
      }
    });

  } catch (error) {
    const { sanitizeError } = require('../utils/sanitizeMiddleware');
    const sanitizedError = sanitizeError(error);
    console.error('❌ Update agent ICP error:', sanitizedError);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error during ICP update'
    });
  }
};

// @desc    Activate agent (Final step)
// @route   PUT /api/agents/:id/activate
// @access  Private
const activateAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Find agent and verify ownership
    const agent = await Agent.findOne({ _id: id, userId });
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Validate agent is ready for activation
    const hasProductInfo = agent.product?.description || 
                          (agent.product?.documents && agent.product.documents.length > 0) ||
                          agent.product?.url;
    
    if (!agent.agent.name || !hasProductInfo) {
      return res.status(400).json({
        success: false,
        message: 'Agent configuration is incomplete. Please provide agent name and product information (description, document, or URL).'
      });
    }

    const activatedAgent = await agent.activate();

    res.json({
      success: true,
      message: 'Agent activated successfully',
      data: {
        agent: {
          id: activatedAgent._id,
          name: activatedAgent.agent.name,
          status: activatedAgent.status,
          nextRunAt: activatedAgent.nextRunAt,
          frequency: `${activatedAgent.agent.frequency.value} ${activatedAgent.agent.frequency.unit}`
        }
      }
    });

  } catch (error) {
    const { sanitizeError } = require('../utils/sanitizeMiddleware');
    const sanitizedError = sanitizeError(error);
    console.error('❌ Activate agent error:', sanitizedError);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error during agent activation'
    });
  }
};

// @desc    Get all agents for user
// @route   GET /api/agents
// @access  Private
const getUserAgents = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, active } = req.query;

    let query = { userId };
    
    if (status) {
      query.status = status;
    }
    
    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    const agents = await Agent.find(query)
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      data: {
        agents: agents.map(agent => ({
          id: agent._id,
          name: agent.agent.name,
          description: agent.agent.description,
          status: agent.status,
          frequency: agent.agent.frequency,
          lastRunAt: agent.lastRunAt,
          nextRunAt: agent.nextRunAt,
          metrics: agent.metrics,
          createdAt: agent.createdAt,
          updatedAt: agent.updatedAt
        })),
        total: agents.length
      }
    });

  } catch (error) {
    const { sanitizeError } = require('../utils/sanitizeMiddleware');
    const sanitizedError = sanitizeError(error);
    console.error('❌ Get user agents error:', sanitizedError);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching agents'
    });
  }
};

// @desc    Get single agent by ID
// @route   GET /api/agents/:id
// @access  Private
const getAgentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const agent = await Agent.findOne({ _id: id, userId }).select('-__v');
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    res.json({
      success: true,
      data: {
        agent
      }
    });

  } catch (error) {
    const { sanitizeError } = require('../utils/sanitizeMiddleware');
    const sanitizedError = sanitizeError(error);
    console.error('❌ Get agent by ID error:', sanitizedError);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching agent'
    });
  }
};

// @desc    Delete agent
// @route   DELETE /api/agents/:id
// @access  Private
const deleteAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const agent = await Agent.findOneAndDelete({ _id: id, userId });
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    res.json({
      success: true,
      message: 'Agent deleted successfully'
    });

  } catch (error) {
    const { sanitizeError } = require('../utils/sanitizeMiddleware');
    const sanitizedError = sanitizeError(error);
    console.error('❌ Delete agent error:', sanitizedError);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error during agent deletion'
    });
  }
};

module.exports = {
  createAgent,
  updateAgent,
  updateAgentProduct,
  updateAgentICP,
  activateAgent,
  getUserAgents,
  getAgentById,
  deleteAgent
};

const Agent = require('../models/Agent');

class AgentService {
  /**
   * Create a new agent
   * @param {Object} agentData - Agent data object
   * @returns {Promise<Object>} Created agent object
   */
  async createAgent(agentData) {
    try {
      const agent = new Agent(agentData);
      const savedAgent = await agent.save();
      return savedAgent;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Agent with similar configuration already exists');
      }
      throw error;
    }
  }

  /**
   * Update agent with product information
   * @param {string} agentId - Agent ID
   * @param {Object} productData - Product data object
   * @returns {Promise<Object>} Updated agent object
   */
  async updateAgentProduct(agentId, productData) {
    try {
      const agent = await Agent.findByIdAndUpdate(
        agentId,
        { 
          $set: { 
            'product.description': productData.description,
            'product.url': productData.url,
            updatedAt: new Date()
          }
        },
        { new: true, runValidators: true }
      );

      if (!agent) {
        throw new Error('Agent not found');
      }

      return agent;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update agent with ICP (Apollo) configuration
   * @param {string} agentId - Agent ID
   * @param {Object} icpData - ICP data object
   * @returns {Promise<Object>} Updated agent object
   */
  async updateAgentICP(agentId, icpData) {
    try {
      // First get the current agent to preserve existing apollo fields
      const currentAgent = await Agent.findById(agentId);
      if (!currentAgent) {
        throw new Error('Agent not found');
      }

      // Merge existing apollo data with new ICP data
      const existingApollo = currentAgent.apollo?.toObject?.() || currentAgent.apollo || {};
      const mergedApolloData = {
        ...existingApollo,
        ...icpData
      };

      const agent = await Agent.findByIdAndUpdate(
        agentId,
        { 
          $set: { 
            apollo: mergedApolloData,
            updatedAt: new Date()
          }
        },
        { new: true, runValidators: true }
      );

      return agent;
    } catch (error) {
      console.error('❌ AgentService - Error updating agent ICP:', error);
      throw error;
    }
  }

  /**
   * Get agent by ID and user ID
   * @param {string} agentId - Agent ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Agent object or null
   */
  async getAgentByIdAndUser(agentId, userId) {
    try {
      return await Agent.findOne({ _id: agentId, userId });
    } catch (error) {
      throw new Error('Error finding agent');
    }
  }

  /**
   * Get all agents for a user
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of agent objects
   */
  async getUserAgents(userId, filters = {}) {
    try {
      let query = { userId };
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      return await Agent.find(query)
        .sort({ createdAt: -1 })
        .select('-__v');
    } catch (error) {
      throw new Error('Error fetching user agents');
    }
  }

  /**
   * Activate an agent
   * @param {string} agentId - Agent ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Activated agent object
   */
  async activateAgent(agentId, userId) {
    try {
      const agent = await Agent.findOne({ _id: agentId, userId });
      
      if (!agent) {
        throw new Error('Agent not found');
      }

      // Validate agent has required data
      const hasProductInfo = agent.product?.description || 
                            (agent.product?.documents && agent.product.documents.length > 0) ||
                            agent.product?.url;
      
      if (!agent.agent.name || !agent.agent.description || !hasProductInfo) {
        throw new Error('Agent configuration is incomplete. Please provide agent name, description, and product information.');
      }

      return await agent.activate();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Pause an agent
   * @param {string} agentId - Agent ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Paused agent object
   */
  async pauseAgent(agentId, userId) {
    try {
      const agent = await Agent.findOneAndUpdate(
        { _id: agentId, userId },
        { 
          $set: { 
            status: 'paused',
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      if (!agent) {
        throw new Error('Agent not found');
      }

      return agent;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete an agent
   * @param {string} agentId - Agent ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteAgent(agentId, userId) {
    try {
      const result = await Agent.findOneAndDelete({ _id: agentId, userId });
      return !!result;
    } catch (error) {
      throw new Error('Error deleting agent');
    }
  }

  /**
   * Get agents ready to run
   * @returns {Promise<Array>} Array of agents ready to run
   */
  async getAgentsReadyToRun() {
    try {
      return await Agent.findReadyToRun();
    } catch (error) {
      throw new Error('Error fetching agents ready to run');
    }
  }

  /**
   * Update agent run statistics
   * @param {string} agentId - Agent ID
   * @param {Object} runData - Run data object
   * @returns {Promise<Object>} Updated agent object
   */
  async updateAgentRunStats(agentId, runData = {}) {
    try {
      const updateData = {
        $set: {
          lastRunAt: new Date(),
          nextRunAt: null, // Will be calculated by pre-save middleware
          updatedAt: new Date()
        },
        $inc: {
          totalRuns: 1
        }
      };

      // Update metrics if provided
      if (runData.leadsGenerated) {
        updateData.$inc['metrics.leadsGenerated'] = runData.leadsGenerated;
      }
      
      if (runData.emailsSent) {
        updateData.$inc['metrics.emailsSent'] = runData.emailsSent;
      }

      if (runData.responseRate !== undefined) {
        updateData.$set['metrics.responseRate'] = runData.responseRate;
      }

      const agent = await Agent.findByIdAndUpdate(
        agentId,
        updateData,
        { new: true }
      );

      if (!agent) {
        throw new Error('Agent not found');
      }

      // Recalculate next run time
      agent.nextRunAt = agent.calculateNextRun();
      await agent.save();

      return agent;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get agent statistics for dashboard
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Agent statistics
   */
  async getAgentStats(userId) {
    try {
      const stats = await Agent.aggregate([
        { $match: { userId: new require('mongoose').Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            totalAgents: { $sum: 1 },
            activeAgents: {
              $sum: {
                $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
              }
            },
            draftAgents: {
              $sum: {
                $cond: [{ $eq: ['$status', 'draft'] }, 1, 0]
              }
            },
            pausedAgents: {
              $sum: {
                $cond: [{ $eq: ['$status', 'paused'] }, 1, 0]
              }
            },
            totalLeads: { $sum: '$metrics.leadsGenerated' },
            totalEmails: { $sum: '$metrics.emailsSent' },
            totalRuns: { $sum: '$totalRuns' }
          }
        }
      ]);

      return stats[0] || {
        totalAgents: 0,
        activeAgents: 0,
        draftAgents: 0,
        pausedAgents: 0,
        totalLeads: 0,
        totalEmails: 0,
        totalRuns: 0
      };
    } catch (error) {
      throw new Error('Error fetching agent statistics');
    }
  }

  /**
   * Validate agent configuration completeness
   * @param {Object} agent - Agent object
   * @returns {Object} Validation result
   */
  validateAgentConfiguration(agent) {
    const validation = {
      isValid: true,
      missingFields: [],
      warnings: []
    };

    // Check required agent fields
    if (!agent.agent?.name) {
      validation.missingFields.push('Agent name');
      validation.isValid = false;
    }

    if (!agent.agent?.description) {
      validation.missingFields.push('Agent description');
      validation.isValid = false;
    }


    // Check product information
    if (!agent.product?.description && !agent.product?.url) {
      validation.warnings.push('No product information provided');
    }

    // Check ICP configuration
    const apollo = agent.apollo;
    if (apollo) {
      const hasJobTitles = apollo.jobTitles && apollo.jobTitles.length > 0;
      const hasCompanies = apollo.companies && apollo.companies.length > 0;
      const hasLocations = apollo.locations && apollo.locations.length > 0;
      const hasEmployeeRange = apollo.employeeRange;
      const hasFunding = apollo.fundingStages && apollo.fundingStages.length > 0;

      if (!hasJobTitles && !hasCompanies && !hasLocations && !hasEmployeeRange && !hasFunding) {
        validation.warnings.push('No ICP filters configured');
      }
    } else {
      validation.warnings.push('No ICP configuration provided');
    }

    return validation;
  }

}

module.exports = new AgentService();

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const {
  createAgent,
  updateAgent,
  updateAgentProduct,
  updateAgentICP,
  activateAgent,
  getUserAgents,
  getAgentById,
  deleteAgent
} = require('../controllers/agentController');

const authMiddleware = require('../utils/authMiddleware');

// Validation middleware
const validateAgentCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Agent name must be between 1 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Agent description must be between 1 and 1000 characters'),
];

const validateProductUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Invalid agent ID'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Product description cannot exceed 5000 characters'),
  body('url')
    .optional({ checkFalsy: true })
    .trim()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('URL must be a valid HTTP/HTTPS URL')
];

const validateICPUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Invalid agent ID'),
  body('jobTitles')
    .optional()
    .isArray()
    .withMessage('Job titles must be an array'),
  body('jobTitles.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Each job title must be between 1 and 100 characters'),
  body('companies')
    .optional()
    .isArray()
    .withMessage('Companies must be an array'),
  body('companies.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Each company must be between 1 and 100 characters'),
  body('locations')
    .optional()
    .isArray()
    .withMessage('Locations must be an array'),
  body('locations.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Each location must be between 1 and 100 characters'),
  body('revenueType')
    .optional()
    .isIn(['is between', 'is known', 'is unknown'])
    .withMessage('Revenue type must be "is between", "is known", or "is unknown"'),
  body('revenueMin')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Revenue minimum must be a positive number'),
  body('revenueMax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Revenue maximum must be a positive number'),
  body('employeeRange')
    .optional()
    .isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10000+'])
    .withMessage('Invalid employee range'),
  body('fundingStages')
    .optional()
    .isArray()
    .withMessage('Funding stages must be an array'),
  body('fundingStages.*')
    .optional()
    .isIn(['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D+', 'IPO', 'Acquired', 'Private Equity'])
    .withMessage('Invalid funding stage'),
  body('companyTypes.private')
    .optional()
    .isBoolean()
    .withMessage('Company type private must be boolean'),
  body('companyTypes.public')
    .optional()
    .isBoolean()
    .withMessage('Company type public must be boolean'),
  body('jobTitlesTab')
    .optional()
    .isIn(['simple', 'advanced'])
    .withMessage('Job titles tab must be "simple" or "advanced"'),
  body('includeSimilarTitles')
    .optional()
    .isBoolean()
    .withMessage('Include similar titles must be boolean')
];

const validateAgentId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid agent ID')
];

const validateQueryParams = [
  query('status')
    .optional()
    .isIn(['draft', 'active', 'paused', 'completed'])
    .withMessage('Invalid status filter'),
  query('active')
    .optional()
    .isBoolean()
    .withMessage('Active filter must be boolean')
];

// Apply authentication middleware to all routes
router.use(authMiddleware);

// @route   POST /api/agents
// @desc    Create new agent (Step 1: Agent Configuration)
// @access  Private
router.post('/', validateAgentCreation, createAgent);

// @route   PUT /api/agents/:id
// @desc    Update agent basic information (name, description)
// @access  Private
router.put('/:id', validateAgentCreation.concat([validateAgentId[0]]), updateAgent);

// @route   PUT /api/agents/:id/product
// @desc    Update agent with product description (Step 2)
// @access  Private
router.put('/:id/product', validateProductUpdate, updateAgentProduct);

// @route   PUT /api/agents/:id/icp
// @desc    Update agent with ICP configuration (Step 3)
// @access  Private
router.put('/:id/icp', validateICPUpdate, updateAgentICP);

// @route   PUT /api/agents/:id/activate
// @desc    Activate agent (Final step)
// @access  Private
router.put('/:id/activate', validateAgentId, activateAgent);

// @route   GET /api/agents
// @desc    Get all agents for user
// @access  Private
router.get('/', validateQueryParams, getUserAgents);

// @route   GET /api/agents/:id
// @desc    Get single agent by ID
// @access  Private
router.get('/:id', validateAgentId, getAgentById);

// @route   DELETE /api/agents/:id
// @desc    Delete agent
// @access  Private
router.delete('/:id', validateAgentId, deleteAgent);

module.exports = router;

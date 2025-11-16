const express = require('express');
const { body, param } = require('express-validator');
const {
  createWorkflow,
  getWorkflows,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  activateWorkflow,
  pauseWorkflow,
  executeWorkflow,
  getWorkflowExecutions
} = require('../controllers/workflowController');
const authMiddleware = require('../utils/authMiddleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Validation rules
const validateWorkflowCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Workflow name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Workflow description cannot exceed 500 characters'),
  body('nodes')
    .optional()
    .isArray()
    .withMessage('Nodes must be an array'),
  body('connections')
    .optional()
    .isArray()
    .withMessage('Connections must be an array')
];

const validateWorkflowUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Invalid workflow ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Workflow name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Workflow description cannot exceed 500 characters'),
  body('nodes')
    .optional()
    .isArray()
    .withMessage('Nodes must be an array'),
  body('connections')
    .optional()
    .isArray()
    .withMessage('Connections must be an array')
];

const validateWorkflowId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid workflow ID')
];

const validateWorkflowExecution = [
  param('id')
    .isMongoId()
    .withMessage('Invalid workflow ID'),
  body('input')
    .optional()
    .isObject()
    .withMessage('Input must be an object')
];

// Routes

// @route   POST /api/workflows
// @desc    Create new workflow
// @access  Private
router.post('/', validateWorkflowCreation, createWorkflow);

// @route   GET /api/workflows
// @desc    Get all workflows for user
// @access  Private
router.get('/', getWorkflows);

// @route   GET /api/workflows/:id
// @desc    Get workflow by ID
// @access  Private
router.get('/:id', validateWorkflowId, getWorkflow);

// @route   PUT /api/workflows/:id
// @desc    Update workflow
// @access  Private
router.put('/:id', validateWorkflowUpdate, updateWorkflow);

// @route   DELETE /api/workflows/:id
// @desc    Delete workflow
// @access  Private
router.delete('/:id', validateWorkflowId, deleteWorkflow);

// @route   POST /api/workflows/:id/activate
// @desc    Activate workflow
// @access  Private
router.post('/:id/activate', validateWorkflowId, activateWorkflow);

// @route   POST /api/workflows/:id/pause
// @desc    Pause workflow
// @access  Private
router.post('/:id/pause', validateWorkflowId, pauseWorkflow);

// @route   POST /api/workflows/:id/execute
// @desc    Execute workflow manually
// @access  Private
router.post('/:id/execute', validateWorkflowExecution, executeWorkflow);

// @route   GET /api/workflows/:id/executions
// @desc    Get workflow executions
// @access  Private
router.get('/:id/executions', validateWorkflowId, getWorkflowExecutions);

module.exports = router;

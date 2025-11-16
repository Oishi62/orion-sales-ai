const mongoose = require('mongoose');

// Node execution result schema
const nodeExecutionSchema = new mongoose.Schema({
  nodeId: {
    type: String,
    required: true
  },
  nodeName: {
    type: String,
    required: true
  },
  nodeType: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'success', 'failed', 'skipped'],
    default: 'pending'
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  duration: {
    type: Number, // in milliseconds
    default: 0
  },
  input: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  output: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  error: {
    message: String,
    stack: String,
    code: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { _id: false });

// Main execution schema
const executionSchema = new mongoose.Schema({
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true,
    index: true
  },
  workflowName: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'success', 'failed', 'cancelled', 'timeout'],
    default: 'pending',
    index: true
  },
  triggerType: {
    type: String,
    enum: ['manual', 'schedule', 'webhook', 'event'],
    required: true
  },
  // Execution timing
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  duration: {
    type: Number, // in milliseconds
    default: 0
  },
  // Node executions
  nodeExecutions: [nodeExecutionSchema],
  // Overall execution data
  input: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  output: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Error information
  error: {
    message: String,
    stack: String,
    code: String,
    nodeId: String // Which node caused the error
  },
  // Execution context
  context: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Retry information
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  // Execution metadata
  metadata: {
    version: String,
    environment: String,
    triggeredBy: String,
    parentExecutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Execution'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
executionSchema.index({ workflowId: 1, createdAt: -1 });
executionSchema.index({ userId: 1, createdAt: -1 });
executionSchema.index({ status: 1, createdAt: -1 });
executionSchema.index({ startedAt: 1 });
executionSchema.index({ workflowId: 1, status: 1 });

// Virtual for execution success
executionSchema.virtual('isSuccess').get(function() {
  return this.status === 'success';
});

// Virtual for execution failure
executionSchema.virtual('isFailed').get(function() {
  return this.status === 'failed';
});

// Virtual for execution completion
executionSchema.virtual('isCompleted').get(function() {
  return ['success', 'failed', 'cancelled', 'timeout'].includes(this.status);
});

// Method to start execution
executionSchema.methods.start = function() {
  this.status = 'running';
  this.startedAt = new Date();
  return this.save();
};

// Method to complete execution successfully
executionSchema.methods.complete = function(output = {}) {
  this.status = 'success';
  this.completedAt = new Date();
  this.duration = this.completedAt - this.startedAt;
  this.output = output;
  return this.save();
};

// Method to fail execution
executionSchema.methods.fail = function(error) {
  this.status = 'failed';
  this.completedAt = new Date();
  this.duration = this.completedAt - this.startedAt;
  this.error = {
    message: error.message,
    stack: error.stack,
    code: error.code,
    nodeId: error.nodeId
  };
  return this.save();
};

// Method to add node execution result
executionSchema.methods.addNodeExecution = function(nodeExecution) {
  this.nodeExecutions.push(nodeExecution);
  return this.save();
};

// Method to update node execution
executionSchema.methods.updateNodeExecution = function(nodeId, updates) {
  const nodeExecution = this.nodeExecutions.find(ne => ne.nodeId === nodeId);
  if (nodeExecution) {
    Object.assign(nodeExecution, updates);
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to find executions by workflow
executionSchema.statics.findByWorkflow = function(workflowId, limit = 50) {
  return this.find({ workflowId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('workflowId', 'name');
};

// Static method to find recent executions for user
executionSchema.statics.findRecentByUser = function(userId, limit = 20) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('workflowId', 'name');
};

// Static method to get execution statistics
executionSchema.statics.getStats = function(workflowId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        workflowId: new mongoose.Types.ObjectId(workflowId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgDuration: { $avg: '$duration' }
      }
    }
  ]);
};

const Execution = mongoose.model('Execution', executionSchema);

module.exports = Execution;

const mongoose = require('mongoose');

// Node schema for workflow nodes
const nodeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['schedule', 'agent', 'lead_research', 'trigger']
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    x: {
      type: Number,
      required: true
    },
    y: {
      type: Number,
      required: true
    }
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Configuration specific to node type
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { _id: false });

// Connection schema for node connections
const connectionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true
  },
  target: {
    type: String,
    required: true
  },
  sourceHandle: {
    type: String,
    default: 'output'
  },
  targetHandle: {
    type: String,
    default: 'input'
  }
}, { _id: false });

// Main workflow schema
const workflowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Workflow name is required'],
    trim: true,
    maxlength: [100, 'Workflow name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Workflow description cannot exceed 500 characters']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'inactive'],
    default: 'draft'
  },
  nodes: [nodeSchema],
  connections: [connectionSchema],
  // Workflow settings
  settings: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    errorHandling: {
      type: String,
      enum: ['stop', 'continue', 'retry'],
      default: 'stop'
    },
    maxRetries: {
      type: Number,
      default: 3,
      min: 0,
      max: 10
    }
  },
  // Execution statistics
  stats: {
    totalExecutions: {
      type: Number,
      default: 0
    },
    successfulExecutions: {
      type: Number,
      default: 0
    },
    failedExecutions: {
      type: Number,
      default: 0
    },
    lastExecutedAt: {
      type: Date
    },
    nextScheduledAt: {
      type: Date
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
workflowSchema.index({ userId: 1, status: 1 });
workflowSchema.index({ userId: 1, isActive: 1 });
workflowSchema.index({ 'stats.nextScheduledAt': 1, status: 1 });

// Virtual for success rate
workflowSchema.virtual('successRate').get(function() {
  if (this.stats.totalExecutions === 0) return 0;
  return Math.round((this.stats.successfulExecutions / this.stats.totalExecutions) * 100);
});

// Method to activate workflow
workflowSchema.methods.activate = function() {
  this.status = 'active';
  return this.save();
};

// Method to pause workflow
workflowSchema.methods.pause = function() {
  this.status = 'paused';
  return this.save();
};

// Method to get schedule nodes
workflowSchema.methods.getScheduleNodes = function() {
  return this.nodes.filter(node => node.type === 'schedule');
};

// Static method to find active workflows for a user
workflowSchema.statics.findActiveByUser = function(userId) {
  return this.find({ 
    userId, 
    status: 'active',
    isActive: true 
  });
};

// Static method to find workflows ready for execution
workflowSchema.statics.findReadyForExecution = function() {
  return this.find({
    status: 'active',
    isActive: true,
    'stats.nextScheduledAt': { $lte: new Date() }
  });
};

const Workflow = mongoose.model('Workflow', workflowSchema);

module.exports = Workflow;

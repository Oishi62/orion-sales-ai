const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Agent Configuration (from Agent page)
  agent: {
    name: {
      type: String,
      required: [true, 'Agent name is required'],
      trim: true,
      maxlength: [100, 'Agent name cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Agent description is required'],
      trim: true,
      maxlength: [1000, 'Agent description cannot exceed 1000 characters']
    },
    frequency: {
      value: {
        type: Number,
        required: [true, 'Frequency value is required'],
        min: [1, 'Frequency value must be at least 1'],
        max: [5, 'Frequency value cannot exceed 5']
      },
      unit: {
        type: String,
        required: [true, 'Frequency unit is required'],
        enum: ['days', 'weeks', 'months']
      }
    }
  },

  // Product Information (from Product Description page)
  product: {
    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Product description cannot exceed 5000 characters']
    },
    url: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true; // Optional field
          return /^https?:\/\/.+/.test(v);
        },
        message: 'URL must be a valid HTTP/HTTPS URL'
      }
    },
    // Document upload fields
    documents: [{
      name: {
        type: String,
        trim: true
      },
      url: {
        type: String,
        trim: true
      },
      key: {
        type: String,
        trim: true
      },
      size: {
        type: Number
      },
      mimeType: {
        type: String,
        trim: true
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      },
      // RAG processing fields
      ragProcessed: {
        type: Boolean,
        default: false
      },
      ragProcessingStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
      },
      ragProcessingProgress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      ragProcessingError: {
        type: String
      },
      ragLastUpdated: {
        type: Date
      },
      vectorCount: {
        type: Number,
        default: 0
      },
      textLength: {
        type: Number,
        default: 0
      },
      chunkCount: {
        type: Number,
        default: 0
      },
      processedAt: {
        type: Date
      },
      embeddingModel: {
        type: String,
        default: 'text-embedding-3-small'
      },
      stats: {
        originalLength: Number,
        chunksCreated: Number,
        avgChunkSize: Number
      }
    }]
  },

  // ICP (Ideal Customer Profile) Configuration
  apollo: {
    jobTitles: [{
      type: String,
      trim: true
    }],
    companies: [{
      type: String,
      trim: true
    }],
    locations: [{
      type: String,
      trim: true
    }],
    revenue: {
      type: {
        type: String,
        enum: ['is between', 'is known', 'is unknown'],
        default: 'is between'
      },
      min: {
        type: Number,
        min: 0
      },
      max: {
        type: Number,
        min: 0
      }
    },
    employeeRange: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10000+']
    },
    fundingStages: [{
      type: String,
      enum: ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D+', 'IPO', 'Acquired', 'Private Equity']
    }],
    companyTypes: {
      private: {
        type: Boolean,
        default: false
      },
      public: {
        type: Boolean,
        default: false
      }
    },
    // Advanced job title options
    jobTitleSettings: {
      tab: {
        type: String,
        enum: ['simple', 'advanced'],
        default: 'simple'
      },
      includeSimilarTitles: {
        type: Boolean,
        default: false
      }
    }
  },

  // Agent Status and Metadata
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed'],
    default: 'draft'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },

  // Tracking fields
  lastRunAt: {
    type: Date
  },
  
  nextRunAt: {
    type: Date
  },

  totalRuns: {
    type: Number,
    default: 0
  },

  // Performance metrics (for future use)
  metrics: {
    leadsGenerated: {
      type: Number,
      default: 0
    },
    emailsSent: {
      type: Number,
      default: 0
    },
    responseRate: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
agentSchema.index({ userId: 1, status: 1 });
agentSchema.index({ userId: 1, isActive: 1 });
agentSchema.index({ nextRunAt: 1, status: 1 });

// Virtual for agent summary
agentSchema.virtual('summary').get(function() {
  return {
    id: this._id,
    name: this.agent.name,
    status: this.status,
    frequency: `${this.agent.frequency.value} ${this.agent.frequency.unit}`,
    lastRun: this.lastRunAt,
    nextRun: this.nextRunAt
  };
});

// Method to calculate next run time
agentSchema.methods.calculateNextRun = function() {
  if (!this.agent.frequency) return null;
  
  const now = new Date();
  const { value, unit } = this.agent.frequency;
  
  switch (unit) {
    case 'days':
      return new Date(now.getTime() + (value * 24 * 60 * 60 * 1000));
    case 'weeks':
      return new Date(now.getTime() + (value * 7 * 24 * 60 * 60 * 1000));
    case 'months':
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + value);
      return nextMonth;
    default:
      return null;
  }
};

// Method to activate agent
agentSchema.methods.activate = function() {
  this.status = 'active';
  this.nextRunAt = this.calculateNextRun();
  return this.save();
};

// Static method to find active agents for a user
agentSchema.statics.findActiveByUser = function(userId) {
  return this.find({ 
    userId, 
    status: 'active', 
    isActive: true 
  }).sort({ createdAt: -1 });
};

// Static method to find agents ready to run
agentSchema.statics.findReadyToRun = function() {
  return this.find({
    status: 'active',
    isActive: true,
    nextRunAt: { $lte: new Date() }
  });
};

// Pre-save middleware to set next run time
agentSchema.pre('save', function(next) {
  if (this.isModified('agent.frequency') && this.status === 'active') {
    this.nextRunAt = this.calculateNextRun();
  }
  next();
});

const Agent = mongoose.model('Agent', agentSchema);

module.exports = Agent;

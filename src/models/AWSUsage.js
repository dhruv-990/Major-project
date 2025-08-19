const mongoose = require('mongoose');

const awsUsageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  awsAccountId: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  service: {
    type: String,
    required: true,
    enum: ['EC2', 'S3', 'RDS', 'CloudWatch', 'CostExplorer', 'Lambda', 'EBS', 'ELB'],
    index: true
  },
  region: {
    type: String,
    required: true,
    index: true
  },
  resourceId: {
    type: String,
    required: true,
    index: true
  },
  resourceType: {
    type: String,
    required: true
  },
  metrics: {
    // EC2 Metrics
    cpuUtilization: {
      average: Number,
      maximum: Number,
      minimum: Number,
      unit: String
    },
    memoryUtilization: {
      average: Number,
      maximum: Number,
      minimum: Number,
      unit: String
    },
    networkIn: {
      total: Number,
      average: Number,
      unit: String
    },
    networkOut: {
      total: Number,
      average: Number,
      unit: String
    },
    diskReadOps: {
      total: Number,
      average: Number,
      unit: String
    },
    diskWriteOps: {
      total: Number,
      average: Number,
      unit: String
    },
    // S3 Metrics
    storageSize: {
      value: Number,
      unit: String
    },
    objectCount: Number,
    // RDS Metrics
    databaseConnections: {
      average: Number,
      maximum: Number,
      unit: String
    },
    freeableMemory: {
      average: Number,
      minimum: Number,
      unit: String
    },
    // Cost Metrics
    cost: {
      amount: {
        type: Number,
        required: true
      },
      currency: {
        type: String,
        default: 'USD'
      },
      unit: {
        type: String,
        default: 'per-hour'
      }
    }
  },
  tags: [{
    key: String,
    value: String
  }],
  instanceType: String, // For EC2/RDS
  storageClass: String, // For S3
  status: String, // running, stopped, terminated, etc.
  isOptimized: {
    type: Boolean,
    default: false
  },
  optimizationRecommendations: [{
    type: {
      type: String,
      enum: ['downgrade', 'upgrade', 'stop', 'delete', 'storage-class-change', 'reserved-instance']
    },
    description: String,
    estimatedSavings: {
      amount: Number,
      currency: String,
      period: String
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    actionRequired: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    dataSource: String, // CloudWatch, Cost Explorer, etc.
    samplingPeriod: Number, // in seconds
    retentionPeriod: Number // in days
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
awsUsageSchema.index({ userId: 1, service: 1, date: -1 });
awsUsageSchema.index({ userId: 1, awsAccountId: 1, date: -1 });
awsUsageSchema.index({ service: 1, region: 1, date: -1 });
awsUsageSchema.index({ resourceId: 1, date: -1 });

// Virtual for total cost in USD
awsUsageSchema.virtual('totalCostUSD').get(function() {
  if (this.metrics.cost && this.metrics.cost.currency === 'USD') {
    return this.metrics.cost.amount;
  }
  return 0;
});

// Static method to get usage summary for a user
awsUsageSchema.statics.getUsageSummary = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          service: '$service',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
        },
        totalCost: { $sum: '$metrics.cost.amount' },
        resourceCount: { $sum: 1 },
        avgCpuUtilization: { $avg: '$metrics.cpuUtilization.average' },
        avgMemoryUtilization: { $avg: '$metrics.memoryUtilization.average' }
      }
    },
    {
      $sort: { '_id.date': 1 }
    }
  ]);
};

// Static method to get cost trends
awsUsageSchema.statics.getCostTrends = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          service: '$service',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
        },
        dailyCost: { $sum: '$metrics.cost.amount' }
      }
    },
    {
      $sort: { '_id.date': 1 }
    }
  ]);
};

module.exports = mongoose.model('AWSUsage', awsUsageSchema); 
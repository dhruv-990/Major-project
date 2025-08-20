import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema({
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
  resourceId: {
    type: String,
    required: true,
    index: true
  },
  service: {
    type: String,
    required: true,
    enum: ['EC2', 'S3', 'RDS', 'Lambda', 'EBS', 'ELB', 'CloudFront'],
    index: true
  },
  region: {
    type: String,
    required: true,
    index: true
  },
  recommendationType: {
    type: String,
    required: true,
    enum: [
      'instance-downgrade',
      'instance-upgrade',
      'instance-stop',
      'instance-delete',
      'storage-class-change',
      'reserved-instance',
      'spot-instance',
      'auto-scaling',
      'backup-optimization',
      'network-optimization'
    ],
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  currentState: {
    instanceType: String,
    storageClass: String,
    status: String,
    cost: {
      amount: Number,
      currency: String,
      period: String
    },
    utilization: {
      cpu: Number,
      memory: Number,
      storage: Number
    }
  },
  recommendedState: {
    instanceType: String,
    storageClass: String,
    action: String,
    estimatedCost: {
      amount: Number,
      currency: String,
      period: String
    }
  },
  estimatedSavings: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    period: {
      type: String,
      default: 'monthly'
    },
    percentage: Number
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  implementationTime: {
    type: Number, // in minutes
    default: 30
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  prerequisites: [String],
  steps: [{
    order: Number,
    description: String,
    command: String,
    estimatedTime: Number
  }],
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'implemented', 'dismissed', 'failed'],
    default: 'pending',
    index: true
  },
  implementedAt: Date,
  implementedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dismissedAt: Date,
  dismissedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dismissalReason: String,
  tags: [{
    key: String,
    value: String
  }],
  metadata: {
    source: String, // AI, rule-based, manual
    confidence: Number, // 0-1
    lastCalculated: {
      type: Date,
      default: Date.now
    },
    dataPoints: Number,
    algorithm: String
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
recommendationSchema.index({ userId: 1, status: 1, priority: -1 });
recommendationSchema.index({ userId: 1, service: 1, createdAt: -1 });
recommendationSchema.index({ priority: 1, estimatedSavings: -1 });
recommendationSchema.index({ status: 1, createdAt: -1 });

// Virtual for total savings in USD
recommendationSchema.virtual('totalSavingsUSD').get(function() {
  if (this.estimatedSavings.currency === 'USD') {
    return this.estimatedSavings.amount;
  }
  return 0;
});

// Static method to get recommendations summary
recommendationSchema.statics.getRecommendationsSummary = function(userId) {
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        status: { $in: ['pending', 'in-progress'] }
      }
    },
    {
      $group: {
        _id: {
          service: '$service',
          priority: '$priority'
        },
        count: { $sum: 1 },
        totalSavings: { $sum: '$estimatedSavings.amount' }
      }
    },
    {
      $sort: { '_id.priority': 1, totalSavings: -1 }
    }
  ]);
};

// Static method to get top savings recommendations
recommendationSchema.statics.getTopSavingsRecommendations = function(userId, limit = 10) {
  return this.find({
    userId: mongoose.Types.ObjectId(userId),
    status: { $in: ['pending', 'in-progress'] }
  })
  .sort({ 'estimatedSavings.amount': -1 })
  .limit(limit)
  .populate('implementedBy', 'firstName lastName email');
};

// Instance method to mark as implemented
recommendationSchema.methods.markAsImplemented = function(userId) {
  this.status = 'implemented';
  this.implementedAt = new Date();
  this.implementedBy = userId;
  return this.save();
};

// Instance method to dismiss recommendation
recommendationSchema.methods.dismiss = function(userId, reason) {
  this.status = 'dismissed';
  this.dismissedAt = new Date();
  this.dismissedBy = userId;
  this.dismissalReason = reason;
  return this.save();
};

export default mongoose.model('Recommendation', recommendationSchema); 
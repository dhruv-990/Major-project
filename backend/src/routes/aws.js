const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { validateQuery } = require('../middleware/validationMiddleware');
const { asyncHandler } = require('../middleware/errorMiddleware');
const AWSUsage = require('../models/AWSUsage');
const Recommendation = require('../models/Recommendation');
const { 
  getEC2Client, 
  getS3Client, 
  getRDSClient, 
  getCloudWatchClient, 
  getCostExplorerClient 
} = require('../config/aws');
const {
  syncEC2DataEnhanced,
  syncS3DataEnhanced,
  syncRDSDataEnhanced,
  generateRecommendations
} = require('../utils/enhancedAwsDataSync');
const User = require('../models/User');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @desc    Get AWS usage summary
// @route   GET /api/aws/usage/summary
// @access  Private
router.get('/usage/summary', validateQuery('awsUsageQuery'), asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const userId = req.user._id;

  // Default to last 30 days if no dates provided
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

  try {
    const summary = await AWSUsage.getUsageSummary(userId, start, end);
    
    res.json({
      success: true,
      data: {
        summary,
        period: {
          start: start,
          end: end
        },
        totalResources: summary.reduce((acc, item) => acc + item.resourceCount, 0),
        totalCost: summary.reduce((acc, item) => acc + item.totalCost, 0)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage summary',
      error: error.message
    });
  }
}));

// @desc    Get AWS cost trends
// @route   GET /api/aws/usage/costs
// @access  Private
router.get('/usage/costs', validateQuery('awsUsageQuery'), asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const userId = req.user._id;

  try {
    const costTrends = await AWSUsage.getCostTrends(userId, parseInt(days));
    
    res.json({
      success: true,
      data: {
        trends: costTrends,
        period: `${days} days`,
        totalCost: costTrends.reduce((acc, item) => acc + item.dailyCost, 0)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cost trends',
      error: error.message
    });
  }
}));

// @desc    Get EC2 instances usage
// @route   GET /api/aws/usage/ec2
// @access  Private
router.get('/usage/ec2', validateQuery('awsUsageQuery'), asyncHandler(async (req, res) => {
  const { region, limit = 100, page = 1 } = req.query;
  const userId = req.user._id;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const query = { userId, service: 'EC2' };
    if (region && region !== 'all') {
      query.region = region;
    }

    const ec2Usage = await AWSUsage.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'firstName lastName email');

    const total = await AWSUsage.countDocuments(query);

    res.json({
      success: true,
      data: {
        instances: ec2Usage,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          hasNext: skip + ec2Usage.length < total,
          hasPrev: parseInt(page) > 1
        },
        summary: {
          totalInstances: total,
          runningInstances: ec2Usage.filter(instance => instance.status === 'running').length,
          stoppedInstances: ec2Usage.filter(instance => instance.status === 'stopped').length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch EC2 usage data',
      error: error.message
    });
  }
}));

// @desc    Get S3 buckets usage
// @route   GET /api/aws/usage/s3
// @access  Private
router.get('/usage/s3', validateQuery('awsUsageQuery'), asyncHandler(async (req, res) => {
  const { region, limit = 100, page = 1 } = req.query;
  const userId = req.user._id;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const query = { userId, service: 'S3' };
    if (region && region !== 'all') {
      query.region = region;
    }

    const s3Usage = await AWSUsage.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'firstName lastName email');

    const total = await AWSUsage.countDocuments(query);

    // Calculate storage summary
    const storageSummary = s3Usage.reduce((acc, bucket) => {
      const size = bucket.metrics.storageSize?.value || 0;
      const storageClass = bucket.storageClass || 'Standard';
      
      if (!acc[storageClass]) {
        acc[storageClass] = { totalSize: 0, bucketCount: 0 };
      }
      
      acc[storageClass].totalSize += size;
      acc[storageClass].bucketCount += 1;
      
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        buckets: s3Usage,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          hasNext: skip + s3Usage.length < total,
          hasPrev: parseInt(page) > 1
        },
        summary: {
          totalBuckets: total,
          totalStorage: s3Usage.reduce((acc, bucket) => acc + (bucket.metrics.storageSize?.value || 0), 0),
          storageByClass: storageSummary
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch S3 usage data',
      error: error.message
    });
  }
}));

// @desc    Get RDS instances usage
// @route   GET /api/aws/usage/rds
// @access  Private
router.get('/usage/rds', validateQuery('awsUsageQuery'), asyncHandler(async (req, res) => {
  const { region, limit = 100, page = 1 } = req.query;
  const userId = req.user._id;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const query = { userId, service: 'RDS' };
    if (region && region !== 'all') {
      query.region = region;
    }

    const rdsUsage = await AWSUsage.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'firstName lastName email');

    const total = await AWSUsage.countDocuments(query);

    res.json({
      success: true,
      data: {
        instances: rdsUsage,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          hasNext: skip + rdsUsage.length < total,
          hasPrev: parseInt(page) > 1
        },
        summary: {
          totalInstances: total,
          runningInstances: rdsUsage.filter(instance => instance.status === 'available').length,
          stoppedInstances: rdsUsage.filter(instance => instance.status === 'stopped').length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch RDS usage data',
      error: error.message
    });
  }
}));

// @desc    Get cost optimization recommendations
// @route   GET /api/aws/recommendations
// @access  Private
router.get('/recommendations', validateQuery('recommendationQuery'), asyncHandler(async (req, res) => {
  const { service, priority, status, limit = 20, page = 1 } = req.query;
  const userId = req.user._id;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const query = { userId };
    
    if (service && service !== 'all') {
      query.service = service;
    }
    
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }

    const recommendations = await Recommendation.find(query)
      .sort({ priority: 1, estimatedSavings: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('implementedBy', 'firstName lastName email');

    const total = await Recommendation.countDocuments(query);

    // Get recommendations summary
    const summary = await Recommendation.getRecommendationsSummary(userId);

    res.json({
      success: true,
      data: {
        recommendations,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          hasNext: skip + recommendations.length < total,
          hasPrev: parseInt(page) > 1
        },
        summary: {
          total: total,
          pending: recommendations.filter(rec => rec.status === 'pending').length,
          inProgress: recommendations.filter(rec => rec.status === 'in-progress').length,
          implemented: recommendations.filter(rec => rec.status === 'implemented').length,
          totalSavings: recommendations.reduce((acc, rec) => acc + rec.estimatedSavings.amount, 0),
          byPriority: summary
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations',
      error: error.message
    });
  }
}));

// @desc    Get top savings recommendations
// @route   GET /api/aws/recommendations/top-savings
// @access  Private
router.get('/recommendations/top-savings', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const userId = req.user._id;

  try {
    const topRecommendations = await Recommendation.getTopSavingsRecommendations(userId, parseInt(limit));

    res.json({
      success: true,
      data: {
        recommendations: topRecommendations,
        totalPotentialSavings: topRecommendations.reduce((acc, rec) => acc + rec.estimatedSavings.amount, 0)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top savings recommendations',
      error: error.message
    });
  }
}));

// @desc    Mark recommendation as implemented
// @route   PUT /api/aws/recommendations/:id/implement
// @access  Private
router.put('/recommendations/:id/implement', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const recommendation = await Recommendation.findById(id);

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    if (recommendation.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this recommendation'
      });
    }

    await recommendation.markAsImplemented(userId);

    res.json({
      success: true,
      message: 'Recommendation marked as implemented',
      data: recommendation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update recommendation',
      error: error.message
    });
  }
}));

// @desc    Dismiss recommendation
// @route   PUT /api/aws/recommendations/:id/dismiss
// @access  Private
router.put('/recommendations/:id/dismiss', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user._id;

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: 'Dismissal reason is required'
    });
  }

  try {
    const recommendation = await Recommendation.findById(id);

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    if (recommendation.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this recommendation'
      });
    }

    await recommendation.dismiss(userId, reason);

    res.json({
      success: true,
      message: 'Recommendation dismissed',
      data: recommendation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to dismiss recommendation',
      error: error.message
    });
  }
}));

// @desc    Sync AWS data with real metrics and costs
// @route   POST /api/aws/sync
// @access  Private
router.post('/sync', asyncHandler(async (req, res) => {
  const { awsAccountId, services = ['EC2', 'S3', 'RDS'] } = req.body;
  const userId = req.user._id;

  if (!awsAccountId) {
    return res.status(400).json({
      success: false,
      message: 'AWS account ID is required'
    });
  }

  try {
    // Find user's AWS account
    const user = await User.findById(userId);
    const awsAccount = user.awsAccounts.find(account => account._id.toString() === awsAccountId);

    if (!awsAccount) {
      return res.status(404).json({
        success: false,
        message: 'AWS account not found'
      });
    }

    // Prepare AWS credentials
    const credentials = {
      accessKeyId: awsAccount.accessKeyId,
      secretAccessKey: awsAccount.secretAccessKey,
      region: awsAccount.region || 'us-east-1'
    };

    const syncResults = {
      success: true,
      message: 'AWS data sync completed',
      data: {
        awsAccountId,
        syncedServices: [],
        errors: [],
        totalResourcesSynced: 0
      }
    };

    // Sync EC2 data
    if (services.includes('EC2')) {
      try {
        const ec2Result = await syncEC2DataEnhanced(credentials, userId, awsAccountId);
        syncResults.data.syncedServices.push({
          service: 'EC2',
          ...ec2Result
        });
        syncResults.data.totalResourcesSynced += ec2Result.instancesSynced || 0;
      } catch (ec2Error) {
        console.error('EC2 sync error:', ec2Error);
        syncResults.data.errors.push({
          service: 'EC2',
          error: ec2Error.message
        });
      }
    }

    // Sync S3 data
    if (services.includes('S3')) {
      try {
        const s3Result = await syncS3DataEnhanced(credentials, userId, awsAccountId);
        syncResults.data.syncedServices.push({
          service: 'S3',
          ...s3Result
        });
        syncResults.data.totalResourcesSynced += s3Result.bucketsSynced || 0;
      } catch (s3Error) {
        console.error('S3 sync error:', s3Error);
        syncResults.data.errors.push({
          service: 'S3',
          error: s3Error.message
        });
      }
    }

    // Sync RDS data
    if (services.includes('RDS')) {
      try {
        const rdsResult = await syncRDSDataEnhanced(credentials, userId, awsAccountId);
        syncResults.data.syncedServices.push({
          service: 'RDS',
          ...rdsResult
        });
        syncResults.data.totalResourcesSynced += rdsResult.instancesSynced || 0;
      } catch (rdsError) {
        console.error('RDS sync error:', rdsError);
        syncResults.data.errors.push({
          service: 'RDS',
          error: rdsError.message
        });
      }
    }

    // Generate recommendations after sync
    try {
      const recommendationsResult = await generateRecommendations(userId, awsAccountId);
      syncResults.data.recommendationsGenerated = recommendationsResult.recommendationsGenerated;
    } catch (recError) {
      console.error('Recommendations generation error:', recError);
      syncResults.data.errors.push({
        service: 'Recommendations',
        error: recError.message
      });
    }

    // Update sync status based on results
    if (syncResults.data.errors.length > 0 && syncResults.data.syncedServices.length === 0) {
      syncResults.success = false;
      syncResults.message = 'AWS data sync failed for all services';
    } else if (syncResults.data.errors.length > 0) {
      syncResults.message = 'AWS data sync completed with some errors';
    }

    res.json(syncResults);
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync AWS data',
      error: error.message
    });
  }
}));

// @desc    Sync specific AWS service
// @route   POST /api/aws/sync/:service
// @access  Private
router.post('/sync/:service', asyncHandler(async (req, res) => {
  const { service } = req.params;
  const { awsAccountId } = req.body;
  const userId = req.user._id;

  const validServices = ['EC2', 'S3', 'RDS'];
  if (!validServices.includes(service.toUpperCase())) {
    return res.status(400).json({
      success: false,
      message: `Invalid service. Valid services are: ${validServices.join(', ')}`
    });
  }

  if (!awsAccountId) {
    return res.status(400).json({
      success: false,
      message: 'AWS account ID is required'
    });
  }

  try {
    // Find user's AWS account
    const user = await User.findById(userId);
    const awsAccount = user.awsAccounts.find(account => account._id.toString() === awsAccountId);

    if (!awsAccount) {
      return res.status(404).json({
        success: false,
        message: 'AWS account not found'
      });
    }

    // Prepare AWS credentials
    const credentials = {
      accessKeyId: awsAccount.accessKeyId,
      secretAccessKey: awsAccount.secretAccessKey,
      region: awsAccount.region || 'us-east-1'
    };

    let result;
    const serviceUpper = service.toUpperCase();

    switch (serviceUpper) {
      case 'EC2':
        result = await syncEC2DataEnhanced(credentials, userId, awsAccountId);
        break;
      case 'S3':
        result = await syncS3DataEnhanced(credentials, userId, awsAccountId);
        break;
      case 'RDS':
        result = await syncRDSDataEnhanced(credentials, userId, awsAccountId);
        break;
    }

    res.json({
      success: true,
      message: `${serviceUpper} data sync completed`,
      data: {
        service: serviceUpper,
        awsAccountId,
        ...result
      }
    });
  } catch (error) {
    console.error(`${service} sync error:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to sync ${service} data`,
      error: error.message
    });
  }
}));

module.exports = router;
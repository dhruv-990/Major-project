const { 
  getEC2Client, 
  getS3Client, 
  getRDSClient, 
  getCloudWatchClient, 
  getCostExplorerClient 
} = require('../config/aws');
const AWSUsage = require('../models/AWSUsage');
const Recommendation = require('../models/Recommendation');

/**
 * Sync EC2 instances data from AWS
 * @param {Object} credentials - AWS credentials
 * @param {string} userId - User ID
 * @param {string} awsAccountId - AWS account ID
 * @returns {Promise<Object>} Sync results
 */
const syncEC2Data = async (credentials, userId, awsAccountId) => {
  try {
    const ec2Client = getEC2Client(credentials);
    
    // Get EC2 instances
    const instancesData = await ec2Client.describeInstances().promise();
    
    const instances = [];
    const reservations = instancesData.Reservations || [];
    
    for (const reservation of reservations) {
      for (const instance of reservation.Instances) {
        // Get CloudWatch metrics for the instance
        const cloudWatchClient = getCloudWatchClient(credentials);
        
        // Get CPU utilization for the last 24 hours
        const cpuMetrics = await cloudWatchClient.getMetricStatistics({
          Namespace: 'AWS/EC2',
          MetricName: 'CPUUtilization',
          Dimensions: [{ Name: 'InstanceId', Value: instance.InstanceId }],
          StartTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
          EndTime: new Date(),
          Period: 3600, // 1 hour
          Statistics: ['Average', 'Maximum', 'Minimum']
        }).promise();

        // Calculate average CPU utilization
        const cpuDataPoints = cpuMetrics.Datapoints || [];
        const avgCpu = cpuDataPoints.length > 0 
          ? cpuDataPoints.reduce((sum, dp) => sum + dp.Average, 0) / cpuDataPoints.length 
          : 0;

        // Get instance cost (placeholder - would need Cost Explorer integration)
        const estimatedHourlyCost = estimateEC2Cost(instance.InstanceType, instance.State.Name === 'running');

        const instanceData = {
          userId,
          awsAccountId,
          date: new Date(),
          service: 'EC2',
          region: instance.Placement.AvailabilityZone.replace(/[a-z]$/, ''),
          resourceId: instance.InstanceId,
          resourceType: 'EC2 Instance',
          metrics: {
            cpuUtilization: {
              average: avgCpu,
              maximum: cpuDataPoints.length > 0 ? Math.max(...cpuDataPoints.map(dp => dp.Maximum)) : 0,
              minimum: cpuDataPoints.length > 0 ? Math.min(...cpuDataPoints.map(dp => dp.Minimum)) : 0,
              unit: 'Percent'
            },
            cost: {
              amount: estimatedHourlyCost,
              currency: 'USD',
              unit: 'per-hour'
            }
          },
          tags: instance.Tags || [],
          instanceType: instance.InstanceType,
          status: instance.State.Name,
          isOptimized: false
        };

        instances.push(instanceData);
      }
    }

    // Save to database
    if (instances.length > 0) {
      await AWSUsage.insertMany(instances);
    }

    return {
      success: true,
      instancesSynced: instances.length,
      message: `Successfully synced ${instances.length} EC2 instances`
    };

  } catch (error) {
    console.error('EC2 sync error:', error);
    throw new Error(`Failed to sync EC2 data: ${error.message}`);
  }
};

/**
 * Sync S3 buckets data from AWS
 * @param {Object} credentials - AWS credentials
 * @param {string} userId - User ID
 * @param {string} awsAccountId - AWS account ID
 * @returns {Promise<Object>} Sync results
 */
const syncS3Data = async (credentials, userId, awsAccountId) => {
  try {
    const s3Client = getS3Client(credentials);
    
    // List all buckets
    const bucketsData = await s3Client.listBuckets().promise();
    
    const buckets = [];
    
    for (const bucket of bucketsData.Buckets) {
      try {
        // Get bucket location
        const locationData = await s3Client.getBucketLocation({ Bucket: bucket.Name }).promise();
        const region = locationData.LocationConstraint || 'us-east-1';
        
        // Get bucket metrics (placeholder - would need CloudWatch integration)
        const storageSize = await getS3BucketSize(s3Client, bucket.Name);
        
        const bucketData = {
          userId,
          awsAccountId,
          date: new Date(),
          service: 'S3',
          region,
          resourceId: bucket.Name,
          resourceType: 'S3 Bucket',
          metrics: {
            storageSize: {
              value: storageSize,
              unit: 'Bytes'
            },
            objectCount: 0, // Would need to implement object counting
            cost: {
              amount: estimateS3Cost(storageSize, 'Standard'),
              currency: 'USD',
              unit: 'per-month'
            }
          },
          tags: [], // Would need to implement tag retrieval
          storageClass: 'Standard',
          status: 'active',
          isOptimized: false
        };

        buckets.push(bucketData);
      } catch (bucketError) {
        console.error(`Error processing bucket ${bucket.Name}:`, bucketError);
        // Continue with other buckets
      }
    }

    // Save to database
    if (buckets.length > 0) {
      await AWSUsage.insertMany(buckets);
    }

    return {
      success: true,
      bucketsSynced: buckets.length,
      message: `Successfully synced ${buckets.length} S3 buckets`
    };

  } catch (error) {
    console.error('S3 sync error:', error);
    throw new Error(`Failed to sync S3 data: ${error.message}`);
  }
};

/**
 * Sync RDS instances data from AWS
 * @param {Object} credentials - AWS credentials
 * @param {string} userId - User ID
 * @param {string} awsAccountId - AWS account ID
 * @returns {Promise<Object>} Sync results
 */
const syncRDSData = async (credentials, userId, awsAccountId) => {
  try {
    const rdsClient = getRDSClient(credentials);
    
    // Get RDS instances
    const instancesData = await rdsClient.describeDBInstances().promise();
    
    const instances = [];
    
    for (const instance of instancesData.DBInstances) {
      // Get CloudWatch metrics for the instance
      const cloudWatchClient = getCloudWatchClient(credentials);
      
      // Get database connections for the last 24 hours
      const connectionMetrics = await cloudWatchClient.getMetricStatistics({
        Namespace: 'AWS/RDS',
        MetricName: 'DatabaseConnections',
        Dimensions: [{ Name: 'DBInstanceIdentifier', Value: instance.DBInstanceIdentifier }],
        StartTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        EndTime: new Date(),
        Period: 3600, // 1 hour
        Statistics: ['Average', 'Maximum']
      }).promise();

      const connectionDataPoints = connectionMetrics.Datapoints || [];
      const avgConnections = connectionDataPoints.length > 0 
        ? connectionDataPoints.reduce((sum, dp) => sum + dp.Average, 0) / connectionDataPoints.length 
        : 0;

      const instanceData = {
        userId,
        awsAccountId,
        date: new Date(),
        service: 'RDS',
        region: instance.AvailabilityZone.replace(/[a-z]$/, ''),
        resourceId: instance.DBInstanceIdentifier,
        resourceType: 'RDS Instance',
        metrics: {
          databaseConnections: {
            average: avgConnections,
            maximum: connectionDataPoints.length > 0 ? Math.max(...connectionDataPoints.map(dp => dp.Maximum)) : 0,
            unit: 'Count'
          },
          cost: {
            amount: estimateRDSCost(instance.DBInstanceClass, instance.Engine, instance.State === 'available'),
            currency: 'USD',
            unit: 'per-hour'
          }
        },
        tags: [], // Would need to implement tag retrieval
        instanceType: instance.DBInstanceClass,
        status: instance.State,
        isOptimized: false
      };

      instances.push(instanceData);
    }

    // Save to database
    if (instances.length > 0) {
      await AWSUsage.insertMany(instances);
    }

    return {
      success: true,
      instancesSynced: instances.length,
      message: `Successfully synced ${instances.length} RDS instances`
    };

  } catch (error) {
    console.error('RDS sync error:', error);
    throw new Error(`Failed to sync RDS data: ${error.message}`);
  }
};

/**
 * Generate cost optimization recommendations
 * @param {string} userId - User ID
 * @param {string} awsAccountId - AWS account ID
 * @returns {Promise<Object>} Recommendations results
 */
const generateRecommendations = async (userId, awsAccountId) => {
  try {
    // Get recent usage data
    const recentUsage = await AWSUsage.find({
      userId,
      awsAccountId,
      date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });

    const recommendations = [];

    // Analyze EC2 instances
    const ec2Instances = recentUsage.filter(usage => usage.service === 'EC2');
    for (const instance of ec2Instances) {
      if (instance.metrics.cpuUtilization?.average < 20 && instance.status === 'running') {
        recommendations.push({
          userId,
          awsAccountId,
          resourceId: instance.resourceId,
          service: 'EC2',
          region: instance.region,
          recommendationType: 'instance-downgrade',
          title: `Downgrade underutilized EC2 instance ${instance.resourceId}`,
          description: `Instance ${instance.resourceId} has average CPU utilization of ${instance.metrics.cpuUtilization.average.toFixed(1)}%, which is below the recommended 20% threshold. Consider downgrading to a smaller instance type.`,
          currentState: {
            instanceType: instance.instanceType,
            status: instance.status,
            cost: instance.metrics.cost,
            utilization: {
              cpu: instance.metrics.cpuUtilization?.average || 0,
              memory: 0,
              storage: 0
            }
          },
          recommendedState: {
            action: 'Downgrade to smaller instance type',
            estimatedCost: {
              amount: instance.metrics.cost.amount * 0.5, // Rough estimate
              currency: 'USD',
              period: 'per-hour'
            }
          },
          estimatedSavings: {
            amount: instance.metrics.cost.amount * 0.5,
            currency: 'USD',
            period: 'monthly',
            percentage: 50
          },
          priority: 'medium',
          difficulty: 'medium',
          implementationTime: 30,
          riskLevel: 'low',
          prerequisites: ['Stop instance', 'Create AMI backup'],
          steps: [
            {
              order: 1,
              description: 'Stop the EC2 instance',
              command: `aws ec2 stop-instances --instance-ids ${instance.resourceId}`,
              estimatedTime: 5
            },
            {
              order: 2,
              description: 'Create AMI backup',
              command: `aws ec2 create-image --instance-id ${instance.resourceId} --name "backup-${instance.resourceId}"`,
              estimatedTime: 10
            },
            {
              order: 3,
              description: 'Launch new smaller instance',
              command: 'aws ec2 run-instances --image-id <ami-id> --instance-type t3.small',
              estimatedTime: 15
            }
          ]
        });
      }
    }

    // Analyze S3 buckets
    const s3Buckets = recentUsage.filter(usage => usage.service === 'S3');
    for (const bucket of s3Buckets) {
      const storageSize = bucket.metrics.storageSize?.value || 0;
      const storageGB = storageSize / (1024 * 1024 * 1024);
      
      if (storageGB > 100 && bucket.storageClass === 'Standard') {
        recommendations.push({
          userId,
          awsAccountId,
          resourceId: bucket.resourceId,
          service: 'S3',
          region: bucket.region,
          recommendationType: 'storage-class-change',
          title: `Move large bucket ${bucket.resourceId} to S3-IA`,
          description: `Bucket ${bucket.resourceId} contains ${storageGB.toFixed(2)} GB of data in Standard storage class. Consider moving to S3-IA for cost savings on infrequently accessed data.`,
          currentState: {
            storageClass: bucket.storageClass,
            cost: bucket.metrics.cost
          },
          recommendedState: {
            storageClass: 'S3-IA',
            action: 'Change storage class to S3-IA',
            estimatedCost: {
              amount: bucket.metrics.cost.amount * 0.6, // S3-IA is cheaper
              currency: 'USD',
              period: 'per-month'
            }
          },
          estimatedSavings: {
            amount: bucket.metrics.cost.amount * 0.4,
            currency: 'USD',
            period: 'monthly',
            percentage: 40
          },
          priority: 'low',
          difficulty: 'easy',
          implementationTime: 15,
          riskLevel: 'low',
          prerequisites: ['Verify data access patterns'],
          steps: [
            {
              order: 1,
              description: 'Verify data access patterns',
              command: 'Check CloudWatch metrics for access patterns',
              estimatedTime: 5
            },
            {
              order: 2,
              description: 'Change storage class',
              command: `aws s3 cp s3://${bucket.resourceId} s3://${bucket.resourceId} --storage-class STANDARD_IA --recursive`,
              estimatedTime: 10
            }
          ]
        });
      }
    }

    // Save recommendations to database
    if (recommendations.length > 0) {
      await Recommendation.insertMany(recommendations);
    }

    return {
      success: true,
      recommendationsGenerated: recommendations.length,
      message: `Generated ${recommendations.length} cost optimization recommendations`
    };

  } catch (error) {
    console.error('Recommendations generation error:', error);
    throw new Error(`Failed to generate recommendations: ${error.message}`);
  }
};

// Helper functions (placeholders)
const estimateEC2Cost = (instanceType, isRunning) => {
  // This would integrate with AWS Pricing API or use a pricing database
  const baseCosts = {
    't3.micro': 0.0104,
    't3.small': 0.0208,
    't3.medium': 0.0416,
    'm5.large': 0.096,
    'c5.large': 0.085
  };
  
  return isRunning ? (baseCosts[instanceType] || 0.1) : 0;
};

const estimateS3Cost = (storageSize, storageClass) => {
  // This would integrate with AWS Pricing API
  const costPerGB = {
    'Standard': 0.023,
    'S3-IA': 0.0125,
    'Glacier': 0.004
  };
  
  const storageGB = storageSize / (1024 * 1024 * 1024);
  return storageGB * (costPerGB[storageClass] || 0.023);
};

const estimateRDSCost = (instanceClass, engine, isRunning) => {
  // This would integrate with AWS Pricing API
  const baseCosts = {
    'db.t3.micro': 0.017,
    'db.t3.small': 0.034,
    'db.m5.large': 0.171
  };
  
  return isRunning ? (baseCosts[instanceClass] || 0.1) : 0;
};

const getS3BucketSize = async (s3Client, bucketName) => {
  try {
    // This is a simplified implementation
    // In production, you'd want to use CloudWatch metrics or S3 Inventory
    let totalSize = 0;
    let continuationToken = null;
    
    do {
      const listParams = {
        Bucket: bucketName,
        ContinuationToken: continuationToken
      };
      
      const response = await s3Client.listObjectsV2(listParams).promise();
      
      for (const object of response.Contents || []) {
        totalSize += object.Size || 0;
      }
      
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);
    
    return totalSize;
  } catch (error) {
    console.error(`Error getting bucket size for ${bucketName}:`, error);
    return 0;
  }
};

module.exports = {
  syncEC2Data,
  syncS3Data,
  syncRDSData,
  generateRecommendations
}; 
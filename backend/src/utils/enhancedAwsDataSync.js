import {
  getEC2Client,
  getS3Client,
  getRDSClient,
  getCloudWatchClient,
  getCostExplorerClient
} from '../config/aws.js';
import AWSUsage from '../models/AWSUsage.js';
import Recommendation from '../models/Recommendation.js';

/**
 * Enhanced AWS data synchronization with real CloudWatch metrics and Cost Explorer integration
 */

/**
 * Get comprehensive CloudWatch metrics for EC2 instances
 * @param {Object} cloudWatchClient - CloudWatch client
 * @param {string} instanceId - EC2 instance ID
 * @param {number} hours - Hours to look back (default 24)
 * @returns {Promise<Object>} Metrics data
 */
const getEC2CloudWatchMetrics = async (cloudWatchClient, instanceId, hours = 24) => {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);
  
  const metricsToFetch = [
    { MetricName: 'CPUUtilization', Unit: 'Percent' },
    { MetricName: 'NetworkIn', Unit: 'Bytes' },
    { MetricName: 'NetworkOut', Unit: 'Bytes' },
    { MetricName: 'DiskReadBytes', Unit: 'Bytes' },
    { MetricName: 'DiskWriteBytes', Unit: 'Bytes' }
  ];

  const metrics = {};

  for (const metric of metricsToFetch) {
    try {
      const result = await cloudWatchClient.getMetricStatistics({
        Namespace: 'AWS/EC2',
        MetricName: metric.MetricName,
        Dimensions: [{ Name: 'InstanceId', Value: instanceId }],
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600, // 1 hour intervals
        Statistics: ['Average', 'Maximum', 'Minimum']
      }).promise();

      const dataPoints = result.Datapoints || [];
      if (dataPoints.length > 0) {
        metrics[metric.MetricName.toLowerCase()] = {
          average: dataPoints.reduce((sum, dp) => sum + dp.Average, 0) / dataPoints.length,
          maximum: Math.max(...dataPoints.map(dp => dp.Maximum)),
          minimum: Math.min(...dataPoints.map(dp => dp.Minimum)),
          unit: metric.Unit,
          dataPoints: dataPoints.length
        };
      } else {
        metrics[metric.MetricName.toLowerCase()] = {
          average: 0,
          maximum: 0,
          minimum: 0,
          unit: metric.Unit,
          dataPoints: 0
        };
      }
    } catch (error) {
      console.error(`Error fetching ${metric.MetricName} for ${instanceId}:`, error.message);
      metrics[metric.MetricName.toLowerCase()] = {
        average: 0,
        maximum: 0,
        minimum: 0,
        unit: metric.Unit,
        dataPoints: 0,
        error: error.message
      };
    }
  }

  return metrics;
};

/**
 * Get S3 bucket metrics from CloudWatch
 * @param {Object} cloudWatchClient - CloudWatch client
 * @param {string} bucketName - S3 bucket name
 * @returns {Promise<Object>} S3 metrics
 */
const getS3CloudWatchMetrics = async (cloudWatchClient, bucketName) => {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours

  try {
    // Get bucket size metrics
    const bucketSizeResult = await cloudWatchClient.getMetricStatistics({
      Namespace: 'AWS/S3',
      MetricName: 'BucketSizeBytes',
      Dimensions: [
        { Name: 'BucketName', Value: bucketName },
        { Name: 'StorageType', Value: 'StandardStorage' }
      ],
      StartTime: startTime,
      EndTime: endTime,
      Period: 86400, // Daily
      Statistics: ['Average']
    }).promise();

    // Get number of objects
    const objectCountResult = await cloudWatchClient.getMetricStatistics({
      Namespace: 'AWS/S3',
      MetricName: 'NumberOfObjects',
      Dimensions: [
        { Name: 'BucketName', Value: bucketName },
        { Name: 'StorageType', Value: 'AllStorageTypes' }
      ],
      StartTime: startTime,
      EndTime: endTime,
      Period: 86400, // Daily
      Statistics: ['Average']
    }).promise();

    const bucketSizeData = bucketSizeResult.Datapoints || [];
    const objectCountData = objectCountResult.Datapoints || [];

    return {
      bucketSize: bucketSizeData.length > 0 ? bucketSizeData[0].Average : 0,
      objectCount: objectCountData.length > 0 ? objectCountData[0].Average : 0
    };
  } catch (error) {
    console.error(`Error fetching S3 metrics for ${bucketName}:`, error.message);
    return { bucketSize: 0, objectCount: 0, error: error.message };
  }
};

/**
 * Get RDS CloudWatch metrics
 * @param {Object} cloudWatchClient - CloudWatch client
 * @param {string} dbInstanceId - RDS instance identifier
 * @returns {Promise<Object>} RDS metrics
 */
const getRDSCloudWatchMetrics = async (cloudWatchClient, dbInstanceId) => {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

  const metricsToFetch = [
    { MetricName: 'CPUUtilization', Unit: 'Percent' },
    { MetricName: 'DatabaseConnections', Unit: 'Count' },
    { MetricName: 'FreeableMemory', Unit: 'Bytes' },
    { MetricName: 'ReadLatency', Unit: 'Seconds' },
    { MetricName: 'WriteLatency', Unit: 'Seconds' }
  ];

  const metrics = {};

  for (const metric of metricsToFetch) {
    try {
      const result = await cloudWatchClient.getMetricStatistics({
        Namespace: 'AWS/RDS',
        MetricName: metric.MetricName,
        Dimensions: [{ Name: 'DBInstanceIdentifier', Value: dbInstanceId }],
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600,
        Statistics: ['Average', 'Maximum', 'Minimum']
      }).promise();

      const dataPoints = result.Datapoints || [];
      if (dataPoints.length > 0) {
        metrics[metric.MetricName.toLowerCase()] = {
          average: dataPoints.reduce((sum, dp) => sum + dp.Average, 0) / dataPoints.length,
          maximum: Math.max(...dataPoints.map(dp => dp.Maximum)),
          minimum: Math.min(...dataPoints.map(dp => dp.Minimum)),
          unit: metric.Unit,
          dataPoints: dataPoints.length
        };
      }
    } catch (error) {
      console.error(`Error fetching ${metric.MetricName} for ${dbInstanceId}:`, error.message);
    }
  }

  return metrics;
};

/**
 * Get real cost data from Cost Explorer
 * @param {Object} costExplorerClient - Cost Explorer client
 * @param {string} service - AWS service (EC2, S3, RDS)
 * @param {string} resourceId - Resource identifier
 * @returns {Promise<Object>} Cost data
 */
const getRealCostData = async (costExplorerClient, service, resourceId = null) => {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    const params = {
      TimePeriod: {
        Start: startDate.toISOString().split('T')[0],
        End: endDate.toISOString().split('T')[0]
      },
      Granularity: 'DAILY',
      Metrics: ['BlendedCost', 'UsageQuantity'],
      GroupBy: [
        {
          Type: 'DIMENSION',
          Key: 'SERVICE'
        }
      ]
    };

    // Add filter for specific service
    if (service) {
      params.Filter = {
        Dimensions: {
          Key: 'SERVICE',
          Values: [service === 'EC2' ? 'Amazon Elastic Compute Cloud - Compute' : 
                   service === 'S3' ? 'Amazon Simple Storage Service' :
                   service === 'RDS' ? 'Amazon Relational Database Service' : service]
        }
      };
    }

    const result = await costExplorerClient.getCostAndUsage(params).promise();
    
    let totalCost = 0;
    let dailyCosts = [];

    if (result.ResultsByTime) {
      for (const timeResult of result.ResultsByTime) {
        let dayCost = 0;
        for (const group of timeResult.Groups || []) {
          const cost = parseFloat(group.Metrics.BlendedCost.Amount);
          dayCost += cost;
        }
        totalCost += dayCost;
        dailyCosts.push({
          date: timeResult.TimePeriod.Start,
          cost: dayCost
        });
      }
    }

    return {
      totalCost30Days: totalCost,
      averageDailyCost: totalCost / 30,
      dailyCosts,
      currency: 'USD'
    };
  } catch (error) {
    console.error(`Error fetching cost data for ${service}:`, error.message);
    return {
      totalCost30Days: 0,
      averageDailyCost: 0,
      dailyCosts: [],
      currency: 'USD',
      error: error.message
    };
  }
};

/**
 * Enhanced EC2 data sync with real metrics and costs
 */
const syncEC2DataEnhanced = async (credentials, userId, awsAccountId) => {
  try {
    const ec2Client = getEC2Client(credentials);
    const cloudWatchClient = getCloudWatchClient(credentials);
    const costExplorerClient = getCostExplorerClient(credentials);

    // Get EC2 instances
    const instancesData = await ec2Client.describeInstances().promise();
    const instances = [];

    // Get cost data for EC2 service
    const costData = await getRealCostData(costExplorerClient, 'EC2');

    for (const reservation of instancesData.Reservations || []) {
      for (const instance of reservation.Instances) {
        try {
          // Get comprehensive CloudWatch metrics
          const metrics = await getEC2CloudWatchMetrics(cloudWatchClient, instance.InstanceId);

          // Get instance tags
          const tags = instance.Tags || [];

          const instanceData = {
            userId,
            awsAccountId,
            date: new Date(),
            service: 'EC2',
            region: instance.Placement.AvailabilityZone.replace(/[a-z]$/, ''),
            resourceId: instance.InstanceId,
            resourceType: 'EC2 Instance',
            metrics: {
              ...metrics,
              realCostData: costData,
              estimatedHourlyCost: estimateEC2Cost(instance.InstanceType, instance.State.Name === 'running')
            },
            tags,
            instanceType: instance.InstanceType,
            status: instance.State.Name,
            launchTime: instance.LaunchTime,
            vpcId: instance.VpcId,
            subnetId: instance.SubnetId,
            securityGroups: instance.SecurityGroups,
            isOptimized: false
          };

          instances.push(instanceData);
        } catch (instanceError) {
          console.error(`Error processing instance ${instance.InstanceId}:`, instanceError);
        }
      }
    }

    // Save to database
    if (instances.length > 0) {
      await AWSUsage.insertMany(instances);
    }

    return {
      success: true,
      instancesSynced: instances.length,
      message: `Successfully synced ${instances.length} EC2 instances with real metrics`
    };

  } catch (error) {
    console.error('Enhanced EC2 sync error:', error);
    throw new Error(`Failed to sync EC2 data: ${error.message}`);
  }
};

/**
 * Enhanced S3 data sync with real metrics and costs
 */
const syncS3DataEnhanced = async (credentials, userId, awsAccountId) => {
  try {
    const s3Client = getS3Client(credentials);
    const cloudWatchClient = getCloudWatchClient(credentials);
    const costExplorerClient = getCostExplorerClient(credentials);

    // List all buckets
    const bucketsData = await s3Client.listBuckets().promise();
    const buckets = [];

    // Get cost data for S3 service
    const costData = await getRealCostData(costExplorerClient, 'S3');

    for (const bucket of bucketsData.Buckets) {
      try {
        // Get bucket location
        const locationData = await s3Client.getBucketLocation({ Bucket: bucket.Name }).promise();
        const region = locationData.LocationConstraint || 'us-east-1';

        // Get real CloudWatch metrics
        const s3Metrics = await getS3CloudWatchMetrics(cloudWatchClient, bucket.Name);

        // Get bucket tagging
        let tags = [];
        try {
          const taggingData = await s3Client.getBucketTagging({ Bucket: bucket.Name }).promise();
          tags = taggingData.TagSet || [];
        } catch (tagError) {
          // Bucket might not have tags
        }

        // Get bucket versioning status
        let versioningStatus = 'Disabled';
        try {
          const versioningData = await s3Client.getBucketVersioning({ Bucket: bucket.Name }).promise();
          versioningStatus = versioningData.Status || 'Disabled';
        } catch (versionError) {
          // Default to disabled
        }

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
              value: s3Metrics.bucketSize,
              unit: 'Bytes'
            },
            objectCount: {
              value: s3Metrics.objectCount,
              unit: 'Count'
            },
            realCostData: costData,
            estimatedMonthlyCost: estimateS3Cost(s3Metrics.bucketSize, 'Standard')
          },
          tags,
          storageClass: 'Standard',
          status: 'active',
          creationDate: bucket.CreationDate,
          versioningStatus,
          isOptimized: false
        };

        buckets.push(bucketData);
      } catch (bucketError) {
        console.error(`Error processing bucket ${bucket.Name}:`, bucketError);
      }
    }

    // Save to database
    if (buckets.length > 0) {
      await AWSUsage.insertMany(buckets);
    }

    return {
      success: true,
      bucketsSynced: buckets.length,
      message: `Successfully synced ${buckets.length} S3 buckets with real metrics`
    };

  } catch (error) {
    console.error('Enhanced S3 sync error:', error);
    throw new Error(`Failed to sync S3 data: ${error.message}`);
  }
};

/**
 * Enhanced RDS data sync with real metrics and costs
 */
const syncRDSDataEnhanced = async (credentials, userId, awsAccountId) => {
  try {
    const rdsClient = getRDSClient(credentials);
    const cloudWatchClient = getCloudWatchClient(credentials);
    const costExplorerClient = getCostExplorerClient(credentials);

    // Get RDS instances
    const instancesData = await rdsClient.describeDBInstances().promise();
    const instances = [];

    // Get cost data for RDS service
    const costData = await getRealCostData(costExplorerClient, 'RDS');

    for (const instance of instancesData.DBInstances) {
      try {
        // Get comprehensive RDS metrics
        const metrics = await getRDSCloudWatchMetrics(cloudWatchClient, instance.DBInstanceIdentifier);

        // Get DB instance tags
        let tags = [];
        try {
          const tagsData = await rdsClient.listTagsForResource({
            ResourceName: instance.DBInstanceArn
          }).promise();
          tags = tagsData.TagList || [];
        } catch (tagError) {
          // Instance might not have tags
        }

        const instanceData = {
          userId,
          awsAccountId,
          date: new Date(),
          service: 'RDS',
          region: instance.AvailabilityZone.replace(/[a-z]$/, ''),
          resourceId: instance.DBInstanceIdentifier,
          resourceType: 'RDS Instance',
          metrics: {
            ...metrics,
            realCostData: costData,
            estimatedHourlyCost: estimateRDSCost(instance.DBInstanceClass, instance.Engine, instance.DBInstanceStatus === 'available')
          },
          tags,
          instanceType: instance.DBInstanceClass,
          status: instance.DBInstanceStatus,
          engine: instance.Engine,
          engineVersion: instance.EngineVersion,
          allocatedStorage: instance.AllocatedStorage,
          storageType: instance.StorageType,
          multiAZ: instance.MultiAZ,
          publiclyAccessible: instance.PubliclyAccessible,
          vpcId: instance.DBSubnetGroup?.VpcId,
          isOptimized: false
        };

        instances.push(instanceData);
      } catch (instanceError) {
        console.error(`Error processing RDS instance ${instance.DBInstanceIdentifier}:`, instanceError);
      }
    }

    // Save to database
    if (instances.length > 0) {
      await AWSUsage.insertMany(instances);
    }

    return {
      success: true,
      instancesSynced: instances.length,
      message: `Successfully synced ${instances.length} RDS instances with real metrics`
    };

  } catch (error) {
    console.error('Enhanced RDS sync error:', error);
    throw new Error(`Failed to sync RDS data: ${error.message}`);
  }
};

// Helper functions for cost estimation (fallback when Cost Explorer fails)
const estimateEC2Cost = (instanceType, isRunning) => {
  const baseCosts = {
    't3.nano': 0.0052,
    't3.micro': 0.0104,
    't3.small': 0.0208,
    't3.medium': 0.0416,
    't3.large': 0.0832,
    'm5.large': 0.096,
    'm5.xlarge': 0.192,
    'c5.large': 0.085,
    'c5.xlarge': 0.17,
    'r5.large': 0.126,
    'r5.xlarge': 0.252
  };
  
  return isRunning ? (baseCosts[instanceType] || 0.1) : 0;
};

const estimateS3Cost = (storageSize, storageClass) => {
  const costPerGB = {
    'Standard': 0.023,
    'Standard-IA': 0.0125,
    'Glacier': 0.004,
    'Glacier Deep Archive': 0.00099
  };
  
  const storageGB = storageSize / (1024 * 1024 * 1024);
  return storageGB * (costPerGB[storageClass] || 0.023);
};

const estimateRDSCost = (instanceClass, engine, isRunning) => {
  const baseCosts = {
    'db.t3.micro': 0.017,
    'db.t3.small': 0.034,
    'db.t3.medium': 0.068,
    'db.m5.large': 0.171,
    'db.m5.xlarge': 0.342,
    'db.r5.large': 0.216,
    'db.r5.xlarge': 0.432
  };
  
  return isRunning ? (baseCosts[instanceClass] || 0.1) : 0;
};

export {
  syncEC2DataEnhanced,
  syncS3DataEnhanced,
  syncRDSDataEnhanced,
  getRealCostData
};

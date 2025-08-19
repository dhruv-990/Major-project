const AWS = require('aws-sdk');

// Configure AWS SDK
const configureAWS = (credentials = null) => {
  if (credentials) {
    // Use provided credentials (for user-specific AWS accounts)
    AWS.config.update({
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      region: credentials.region || process.env.AWS_REGION || 'us-east-1'
    });
  } else {
    // Use default credentials (IAM role, environment variables, or AWS credentials file)
    AWS.config.update({
      region: process.env.AWS_REGION || 'us-east-1'
    });
  }
};

// Initialize AWS services
const getEC2Client = (credentials = null) => {
  configureAWS(credentials);
  return new AWS.EC2();
};

const getS3Client = (credentials = null) => {
  configureAWS(credentials);
  return new AWS.S3();
};

const getRDSClient = (credentials = null) => {
  configureAWS(credentials);
  return new AWS.RDS();
};

const getCloudWatchClient = (credentials = null) => {
  configureAWS(credentials);
  return new AWS.CloudWatch();
};

const getCostExplorerClient = (credentials = null) => {
  configureAWS(credentials);
  return new AWS.CostExplorer();
};

const getCloudWatchLogsClient = (credentials = null) => {
  configureAWS(credentials);
  return new AWS.CloudWatchLogs();
};

module.exports = {
  configureAWS,
  getEC2Client,
  getS3Client,
  getRDSClient,
  getCloudWatchClient,
  getCostExplorerClient,
  getCloudWatchLogsClient
}; 
# AWS Real Data Integration Setup Guide

## Overview
Your backend now supports fetching real AWS services data including:
- **EC2 instances** with CloudWatch metrics (CPU, Network, Disk I/O)
- **S3 buckets** with storage metrics and object counts
- **RDS instances** with database performance metrics
- **Cost Explorer** integration for real cost data
- **Automated recommendations** based on real usage patterns

## AWS Credentials Setup

### 1. Create AWS IAM User
1. Go to AWS Console → IAM → Users
2. Click "Create User"
3. Enter username (e.g., `finops-tool-user`)
4. Select "Programmatic access"

### 2. Required IAM Permissions
Attach the following policies to your IAM user:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:DescribeInstances",
                "ec2:DescribeInstanceStatus",
                "ec2:DescribeRegions",
                "ec2:DescribeAvailabilityZones",
                "s3:ListAllMyBuckets",
                "s3:GetBucketLocation",
                "s3:GetBucketTagging",
                "s3:GetBucketVersioning",
                "s3:ListBucket",
                "rds:DescribeDBInstances",
                "rds:ListTagsForResource",
                "cloudwatch:GetMetricStatistics",
                "cloudwatch:ListMetrics",
                "ce:GetCostAndUsage",
                "ce:GetUsageReport"
            ],
            "Resource": "*"
        }
    ]
}
```

### 3. Get Access Keys
1. After creating the user, download the CSV file with:
   - Access Key ID
   - Secret Access Key
2. **Keep these secure** - never commit them to version control

## Environment Variables Setup

Create a `.env` file in your backend directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/aws-cost-optimizer
JWT_SECRET=your-super-secret-jwt-key-here

# AWS Configuration (Optional - for default credentials)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# Server Configuration
PORT=5000
NODE_ENV=development
```

## How to Use the Real Data Sync

### 1. Add AWS Account via Frontend
1. Go to `/form` page in your frontend
2. Fill in the AWS account details:
   - Account Name (e.g., "Production AWS")
   - Access Key ID
   - Secret Access Key
   - Region (e.g., "us-east-1")

### 2. Sync Data via API
```javascript
// Sync all services
POST /api/aws/sync
{
  "awsAccountId": "your-aws-account-id",
  "services": ["EC2", "S3", "RDS"]
}

// Sync specific service
POST /api/aws/sync/EC2
{
  "awsAccountId": "your-aws-account-id"
}
```

### 3. View Real Data
- **Dashboard**: `/dashboard` - Real cost metrics and recommendations
- **Data Table**: `/data` - All AWS resources with real metrics
- **Analytics**: `/analytics` - Cost trends from Cost Explorer

## What Data Gets Fetched

### EC2 Instances
- ✅ Instance details (type, status, launch time)
- ✅ CloudWatch metrics (CPU, Network I/O, Disk I/O)
- ✅ Tags and security groups
- ✅ Real cost data from Cost Explorer
- ✅ Optimization recommendations

### S3 Buckets
- ✅ Bucket details (region, creation date)
- ✅ Storage size and object count from CloudWatch
- ✅ Bucket tags and versioning status
- ✅ Real cost data
- ✅ Storage class recommendations

### RDS Instances
- ✅ Database details (engine, version, storage)
- ✅ CloudWatch metrics (CPU, connections, latency)
- ✅ Multi-AZ and backup configurations
- ✅ Real cost data
- ✅ Performance optimization recommendations

## API Endpoints for Real Data

```
GET /api/aws/usage/summary     # Cost summary with real data
GET /api/aws/usage/costs       # Cost trends from Cost Explorer
GET /api/aws/usage/ec2         # EC2 instances with metrics
GET /api/aws/usage/s3          # S3 buckets with storage metrics
GET /api/aws/usage/rds         # RDS instances with performance metrics
GET /api/aws/recommendations   # AI-generated recommendations
POST /api/aws/sync             # Sync real AWS data
```

## Testing the Integration

Run the test script to verify your AWS credentials work:

```bash
cd backend
node test-aws-integration.js
```

## Troubleshooting

### Common Issues

1. **Access Denied Errors**
   - Verify IAM permissions are correctly set
   - Check if MFA is required for your AWS account

2. **Cost Explorer Errors**
   - Cost Explorer API requires billing access
   - May need to enable Cost Explorer in AWS Console first

3. **CloudWatch Metrics Missing**
   - Some metrics may not be available for new resources
   - CloudWatch detailed monitoring might need to be enabled

4. **Rate Limiting**
   - AWS APIs have rate limits
   - The sync process includes error handling and retries

### Debug Mode
Set `NODE_ENV=development` to see detailed logs during sync operations.

## Security Best Practices

1. **Never hardcode credentials** in your code
2. **Use environment variables** or AWS IAM roles
3. **Rotate access keys** regularly
4. **Use least privilege** IAM policies
5. **Monitor API usage** in AWS CloudTrail

## Next Steps

1. Set up your AWS credentials using this guide
2. Test the integration with the provided test script
3. Use the frontend to add your AWS account
4. Run a sync to fetch real data
5. Explore the dashboard with real cost metrics and recommendations

Your FinOps tool now provides real-time insights into your AWS infrastructure costs and optimization opportunities!

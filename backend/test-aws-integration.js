import {
  syncEC2DataEnhanced,
  syncS3DataEnhanced,
  syncRDSDataEnhanced,
  getRealCostData
} from './src/utils/enhancedAwsDataSync.js';

/**
 * Test script to verify AWS integration works with real credentials
 * Run this script to test your AWS setup before using the full application
 */

async function testAWSIntegration() {
  try {
    console.log('🚀 Testing AWS Integration...\n');
    
    // Load environment variables
    const dotenv = await import('dotenv');
    dotenv.config();
    
    console.log('✅ Environment variables loaded');

  // Test credentials - using environment variables
  const testCredentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
  };

  if (!testCredentials.accessKeyId || !testCredentials.secretAccessKey) {
    console.log('❌ AWS credentials not found in environment variables');
    console.log('   Please check your .env file has:');
    console.log('   - AWS_ACCESS_KEY_ID');
    console.log('   - AWS_SECRET_ACCESS_KEY');
    console.log('   - AWS_REGION (optional)');
    return;
  }

  console.log('✅ AWS credentials found');
  console.log(`   Region: ${testCredentials.region}`);
  console.log(`   Access Key: ${testCredentials.accessKeyId.substring(0, 8)}...`);
  console.log('─'.repeat(50));

  // Test user and account IDs (for testing purposes)
  const testUserId = 'test-user-id';
  const testAwsAccountId = 'test-aws-account-id';

  // Test 1: EC2 Data Sync
  console.log('\n📊 Testing EC2 Data Sync...');
  try {
    const ec2Result = await syncEC2DataEnhanced(testCredentials, testUserId, testAwsAccountId);
    console.log('✅ EC2 Sync Success:', ec2Result.message);
    console.log(`   Instances found: ${ec2Result.instancesSynced || 0}`);
  } catch (error) {
    console.log('❌ EC2 Sync Failed:', error.message);
    if (error.message.includes('UnauthorizedOperation')) {
      console.log('   💡 Check your IAM permissions for EC2 access');
    }
  }

  // Test 2: S3 Data Sync
  console.log('\n🪣 Testing S3 Data Sync...');
  try {
    const s3Result = await syncS3DataEnhanced(testCredentials, testUserId, testAwsAccountId);
    console.log('✅ S3 Sync Success:', s3Result.message);
    console.log(`   Buckets found: ${s3Result.bucketsSynced || 0}`);
  } catch (error) {
    console.log('❌ S3 Sync Failed:', error.message);
    if (error.message.includes('AccessDenied')) {
      console.log('   💡 Check your IAM permissions for S3 access');
    }
  }

  // Test 3: RDS Data Sync
  console.log('\n🗄️ Testing RDS Data Sync...');
  try {
    const rdsResult = await syncRDSDataEnhanced(testCredentials, testUserId, testAwsAccountId);
    console.log('✅ RDS Sync Success:', rdsResult.message);
    console.log(`   Instances found: ${rdsResult.instancesSynced || 0}`);
  } catch (error) {
    console.log('❌ RDS Sync Failed:', error.message);
    if (error.message.includes('AccessDenied')) {
      console.log('   💡 Check your IAM permissions for RDS access');
    }
  }

  // Test 4: Cost Explorer
  console.log('\n💰 Testing Cost Explorer...');
  try {
    const { getCostExplorerClient } = await import('./src/config/aws.js');
    const costExplorerClient = getCostExplorerClient(testCredentials);
    
    const costResult = await getRealCostData(costExplorerClient, 'EC2');
    console.log('✅ Cost Explorer Success');
    console.log(`   30-day total cost: $${costResult.totalCost30Days.toFixed(2)}`);
    console.log(`   Average daily cost: $${costResult.averageDailyCost.toFixed(2)}`);
  } catch (error) {
    console.log('❌ Cost Explorer Failed:', error.message);
    if (error.message.includes('AccessDenied')) {
      console.log('   💡 Check your IAM permissions for Cost Explorer access');
      console.log('   💡 Cost Explorer may require billing access');
    }
  }

  // Test 5: CloudWatch Metrics
  console.log('\n📈 Testing CloudWatch Access...');
  try {
    const { getCloudWatchClient } = await import('./src/config/aws.js');
    const cloudWatchClient = getCloudWatchClient(testCredentials);
    
    // Test basic CloudWatch access
    const metricsResult = await cloudWatchClient.listMetrics({
      Namespace: 'AWS/EC2',
      MetricName: 'CPUUtilization'
    }).promise();
    
    console.log('✅ CloudWatch Access Success');
    console.log(`   Available metrics: ${metricsResult.Metrics?.length || 0}`);
  } catch (error) {
    console.log('❌ CloudWatch Access Failed:', error.message);
    if (error.message.includes('AccessDenied')) {
      console.log('   💡 Check your IAM permissions for CloudWatch access');
    }
  }

  console.log('\n' + '─'.repeat(50));
  console.log('🎯 AWS Integration Test Complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Fix any permission issues shown above');
  console.log('2. Add your AWS account via the frontend form');
  console.log('3. Use the sync API to fetch real data');
  console.log('4. View real metrics in your dashboard');
  
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Handle process exit
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Promise Rejection:', error.message);
  process.exit(1);
});

// Run the test
testAWSIntegration().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});

export { testAWSIntegration };

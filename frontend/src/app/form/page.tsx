'use client';

import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { 
  CloudIcon,
  KeyIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

interface AWSAccountForm {
  accountName: string;
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  description: string;
}

export default function FormPage() {
  const [formData, setFormData] = useState<AWSAccountForm>({
    accountName: '',
    accountId: '',
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const regions = [
    { value: 'us-east-1', label: 'US East (N. Virginia)' },
    { value: 'us-west-1', label: 'US West (N. California)' },
    { value: 'us-west-2', label: 'US West (Oregon)' },
    { value: 'eu-west-1', label: 'Europe (Ireland)' },
    { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
    { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
    { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      await axios.post('http://localhost:5000/api/aws-accounts', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess(true);
      setFormData({
        accountName: '',
        accountId: '',
        accessKeyId: '',
        secretAccessKey: '',
        region: 'us-east-1',
        description: ''
      });
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        setError(err.response?.data?.message || 'Failed to add AWS account');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      accountName: '',
      accountId: '',
      accessKeyId: '',
      secretAccessKey: '',
      region: 'us-east-1',
      description: ''
    });
    setSuccess(false);
    setError('');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Add AWS Account
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Connect your AWS account to start optimizing costs
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <InformationCircleIcon className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Security Best Practices
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Use IAM users with minimal required permissions</li>
                  <li>Enable MFA on your AWS account</li>
                  <li>Regularly rotate access keys</li>
                  <li>Never share credentials in plain text</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  AWS account added successfully! Data synchronization will begin shortly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Account Name */}
              <div>
                <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">
                  Account Name *
                </label>
                <div className="mt-1 relative">
                  <CloudIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="accountName"
                    id="accountName"
                    required
                    className="pl-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Production Account"
                    value={formData.accountName}
                    onChange={handleChange}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  A friendly name to identify this account
                </p>
              </div>

              {/* Account ID */}
              <div>
                <label htmlFor="accountId" className="block text-sm font-medium text-gray-700">
                  AWS Account ID *
                </label>
                <input
                  type="text"
                  name="accountId"
                  id="accountId"
                  required
                  pattern="[0-9]{12}"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="123456789012"
                  value={formData.accountId}
                  onChange={handleChange}
                />
                <p className="mt-1 text-xs text-gray-500">
                  12-digit AWS account identifier
                </p>
              </div>

              {/* Access Key ID */}
              <div>
                <label htmlFor="accessKeyId" className="block text-sm font-medium text-gray-700">
                  Access Key ID *
                </label>
                <div className="mt-1 relative">
                  <KeyIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="accessKeyId"
                    id="accessKeyId"
                    required
                    className="pl-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                    value={formData.accessKeyId}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Secret Access Key */}
              <div>
                <label htmlFor="secretAccessKey" className="block text-sm font-medium text-gray-700">
                  Secret Access Key *
                </label>
                <input
                  type="password"
                  name="secretAccessKey"
                  id="secretAccessKey"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  value={formData.secretAccessKey}
                  onChange={handleChange}
                />
              </div>

              {/* Region */}
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700">
                  Default Region *
                </label>
                <select
                  name="region"
                  id="region"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.region}
                  onChange={handleChange}
                >
                  {regions.map((region) => (
                    <option key={region.value} value={region.value}>
                      {region.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Optional description for this AWS account..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Required Permissions Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Required IAM Permissions
              </h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p>• <code>ec2:DescribeInstances</code> - View EC2 instances</p>
                <p>• <code>s3:ListAllMyBuckets</code> - List S3 buckets</p>
                <p>• <code>rds:DescribeDBInstances</code> - View RDS instances</p>
                <p>• <code>cloudwatch:GetMetricStatistics</code> - Retrieve metrics</p>
                <p>• <code>ce:GetCostAndUsage</code> - Access cost data</p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding Account...
                  </>
                ) : (
                  'Add AWS Account'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Need Help?
          </h3>
          <div className="prose prose-sm text-gray-600">
            <p>
              To create AWS access keys:
            </p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Sign in to the AWS Management Console</li>
              <li>Navigate to IAM → Users</li>
              <li>Select your user or create a new one</li>
              <li>Go to Security credentials tab</li>
              <li>Click "Create access key"</li>
              <li>Download and securely store the credentials</li>
            </ol>
          </div>
        </div>
      </div>
    </Layout>
  );
}

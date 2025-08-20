'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { 
  CloudIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { awsAccountsAPI } from '@/services/api';

interface AWSAccount {
  id: string;
  accountName: string;
  accountId: string;
  region: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  description?: string;
}

export default function AWSAccountsPage() {
  const [accounts, setAccounts] = useState<AWSAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await awsAccountsAPI.getAccounts();
      setAccounts(response.data);
    } catch (err: any) {
      setError('Failed to load AWS accounts');
      // Set mock data for demo
      setAccounts([
        {
          id: '1',
          accountName: 'Production Account',
          accountId: '123456789012',
          region: 'us-east-1',
          status: 'connected',
          lastSync: '2024-01-15T10:30:00Z',
          description: 'Main production environment'
        },
        {
          id: '2',
          accountName: 'Development Account',
          accountId: '123456789013',
          region: 'us-west-2',
          status: 'connected',
          lastSync: '2024-01-15T09:15:00Z',
          description: 'Development and testing'
        },
        {
          id: '3',
          accountName: 'Staging Account',
          accountId: '123456789014',
          region: 'eu-west-1',
          status: 'error',
          lastSync: '2024-01-14T15:20:00Z',
          description: 'Staging environment'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this AWS account?')) {
      return;
    }

    try {
      await awsAccountsAPI.deleteAccount(id);
      setAccounts(accounts.filter(acc => acc.id !== id));
    } catch (err) {
      alert('Failed to delete account');
    }
  };

  const handleTestConnection = async (id: string) => {
    try {
      await awsAccountsAPI.testConnection(id);
      alert('Connection test successful!');
    } catch (err) {
      alert('Connection test failed');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <XCircleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'error':
        return 'Error';
      default:
        return 'Disconnected';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              AWS Accounts
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your connected AWS accounts
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <a
              href="/form"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Account
            </a>
          </div>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-700">
              {error} - Showing demo data
            </p>
          </div>
        )}

        {/* Accounts Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <div key={account.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CloudIcon className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {account.accountName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {account.accountId}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusIcon(account.status)}
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Region:</span>
                    <span className="text-gray-900">{account.region}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-500">Status:</span>
                    <span className={`font-medium ${
                      account.status === 'connected' ? 'text-green-600' :
                      account.status === 'error' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {getStatusText(account.status)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-500">Last Sync:</span>
                    <span className="text-gray-900">
                      {new Date(account.lastSync).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {account.description && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">{account.description}</p>
                  </div>
                )}

                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => handleTestConnection(account.id)}
                    className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Test
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {accounts.length === 0 && (
          <div className="text-center py-12">
            <CloudIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No AWS accounts</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first AWS account.
            </p>
            <div className="mt-6">
              <a
                href="/form"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add AWS Account
              </a>
            </div>
          </div>
        )}

        {/* Account Summary */}
        {accounts.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{accounts.length}</div>
                <div className="text-sm text-gray-500">Total Accounts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {accounts.filter(acc => acc.status === 'connected').length}
                </div>
                <div className="text-sm text-gray-500">Connected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {accounts.filter(acc => acc.status === 'error').length}
                </div>
                <div className="text-sm text-gray-500">Errors</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

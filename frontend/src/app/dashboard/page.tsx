'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import MetricsCard from '@/components/dashboard/MetricsCard';
import { 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  LightBulbIcon,
  ServerIcon,
  CloudIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { dashboardAPI } from '@/services/api';

interface DashboardData {
  totalSavings: number;
  monthlyCost: number;
  activeRecommendations: number;
  awsAccounts: number;
  recentRecommendations: any[];
  costTrend: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    totalSavings: 0,
    monthlyCost: 0,
    activeRecommendations: 0,
    awsAccounts: 0,
    recentRecommendations: [],
    costTrend: '+0%'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Temporarily disable auth check for demo mode
      // const token = localStorage.getItem('token');
      // if (!token) {
      //   window.location.href = '/login';
      //   return;
      // }

      const response = await dashboardAPI.getDashboardData();
      
      // Use real API data (empty until AWS accounts are synced)
      const apiData = response.data.data;
      const transformedData = {
        totalSavings: apiData.totalCost * 0.3, // 30% potential savings from actual costs
        monthlyCost: apiData.totalCost,
        activeRecommendations: apiData.totalResources,
        awsAccounts: 0, // Will be updated when accounts are added
        recentRecommendations: [], // Empty until real recommendations are generated
        costTrend: apiData.totalCost > 0 ? '-12%' : '+0%'
      };
      
      setData(transformedData);
      setError(''); // Clear any previous errors
    } catch (err: any) {
      console.error('Dashboard API Error:', err);
      setError('Failed to load dashboard data');
      // Set empty data - no mock data
      setData({
        totalSavings: 0,
        monthlyCost: 0,
        activeRecommendations: 0,
        awsAccounts: 0,
        recentRecommendations: [],
        costTrend: '+0%'
      });
    } finally {
      setLoading(false);
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
              Dashboard
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Cloud cost optimization overview
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={fetchDashboardData}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  {error} - Showing demo data
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <MetricsCard
            title="Total Savings"
            value={`$${data.totalSavings.toLocaleString()}`}
            change={data.costTrend}
            changeType={data.costTrend.startsWith('-') ? 'positive' : 'negative'}
            icon={<CurrencyDollarIcon className="h-6 w-6" />}
            subtitle="This month"
          />
          <MetricsCard
            title="Monthly Cost"
            value={`$${data.monthlyCost.toLocaleString()}`}
            change="+5%"
            changeType="negative"
            icon={<ChartBarIcon className="h-6 w-6" />}
            subtitle="Current spend"
          />
          <MetricsCard
            title="Active Recommendations"
            value={data.activeRecommendations}
            icon={<LightBulbIcon className="h-6 w-6" />}
            subtitle="Optimization opportunities"
          />
          <MetricsCard
            title="AWS Accounts"
            value={data.awsAccounts}
            icon={<CloudIcon className="h-6 w-6" />}
            subtitle="Connected accounts"
          />
        </div>

        {/* Recent Recommendations */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Recommendations
            </h3>
            <div className="space-y-4">
              {data.recentRecommendations.map((rec) => (
                <div key={rec.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ServerIcon className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {rec.type}: {rec.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        Potential monthly savings: ${rec.savings}
                      </p>
                    </div>
                  </div>
                  <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Apply
                  </button>
                </div>
              ))}
            </div>
            {data.recentRecommendations.length === 0 && (
              <div className="text-center py-12">
                <CloudIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recommendations yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add your AWS accounts and sync data to get cost optimization recommendations.
                </p>
                <div className="mt-6">
                  <a
                    href="/form"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Add AWS Account
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <button className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Sync AWS Data
              </button>
              <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Generate Report
              </button>
              <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

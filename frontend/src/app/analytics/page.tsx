'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const mockData = {
    costTrend: [
      { month: 'Jan', cost: 8500, savings: 1200 },
      { month: 'Feb', cost: 7800, savings: 1800 },
      { month: 'Mar', cost: 8200, savings: 1500 },
      { month: 'Apr', cost: 7500, savings: 2100 },
      { month: 'May', cost: 8750, savings: 1650 },
      { month: 'Jun', cost: 7200, savings: 2400 }
    ],
    serviceBreakdown: [
      { service: 'EC2', cost: 3200, percentage: 45 },
      { service: 'S3', cost: 1800, percentage: 25 },
      { service: 'RDS', cost: 1440, percentage: 20 },
      { service: 'Lambda', cost: 720, percentage: 10 }
    ]
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
              Analytics
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Cost analysis and optimization insights
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Spend
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      $7,200
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowTrendingDownIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Cost Reduction
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      18%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Avg Daily Cost
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      $240
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Potential Savings
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      $2,400
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Trend Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Cost Trend Over Time
          </h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {mockData.costTrend.map((item, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="w-full flex flex-col items-center space-y-1">
                  <div 
                    className="w-8 bg-indigo-600 rounded-t"
                    style={{ height: `${(item.cost / 10000) * 200}px` }}
                  />
                  <div 
                    className="w-8 bg-green-500 rounded-t"
                    style={{ height: `${(item.savings / 10000) * 200}px` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-2">{item.month}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-center space-x-6 mt-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-indigo-600 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Cost</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Savings</span>
            </div>
          </div>
        </div>

        {/* Service Breakdown */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Cost by Service
          </h3>
          <div className="space-y-4">
            {mockData.serviceBreakdown.map((service, index) => (
              <div key={index} className="flex items-center">
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900">{service.service}</span>
                    <span className="text-gray-500">${service.cost}</span>
                  </div>
                  <div className="mt-1 relative">
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                      <div 
                        style={{ width: `${service.percentage}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600"
                      />
                    </div>
                  </div>
                </div>
                <div className="ml-4 text-sm text-gray-500">
                  {service.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations Summary */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Top Optimization Opportunities
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Resize underutilized EC2 instances
                </p>
                <p className="text-xs text-gray-500">
                  3 instances running at &lt;20% CPU utilization
                </p>
              </div>
              <div className="text-sm font-medium text-green-600">
                Save $480/month
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Enable S3 lifecycle policies
                </p>
                <p className="text-xs text-gray-500">
                  Move old data to cheaper storage classes
                </p>
              </div>
              <div className="text-sm font-medium text-green-600">
                Save $320/month
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Switch to Reserved Instances
                </p>
                <p className="text-xs text-gray-500">
                  Long-running RDS instances eligible for RI
                </p>
              </div>
              <div className="text-sm font-medium text-green-600">
                Save $720/month
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

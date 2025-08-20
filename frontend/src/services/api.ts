import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests (temporarily disabled for demo)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  // Temporarily comment out auth for demo mode
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }
  return config;
});

// Handle auth errors (temporarily disabled for demo)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Temporarily disable auth redirect for demo mode
    // if (error.response?.status === 401) {
    //   localStorage.removeItem('token');
    //   localStorage.removeItem('user');
    //   window.location.href = '/login';
    // }
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (userData: { username: string; email: string; password: string }) =>
    api.post('/auth/register', userData),
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
};

// Dashboard API calls
export const dashboardAPI = {
  getDashboardData: () => api.get('/aws/usage/summary'),
  
  getRecommendations: () => api.get('/aws/recommendations'),
  
  applyRecommendation: (id: string) => api.post(`/aws/recommendations/${id}/implement`)
};

// Data API calls
export const dataAPI = {
  getData: (params?: { service?: string; region?: string }) =>
    api.get('/data', { params }),
  
  syncAWSData: () => api.post('/data/sync'),
  
  exportData: () => api.get('/data/export', { responseType: 'blob' })
};

// AWS Accounts API calls
export const awsAccountsAPI = {
  getAccounts: () => api.get('/aws-accounts'),
  
  addAccount: (accountData: {
    accountName: string;
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    description?: string;
  }) => api.post('/aws-accounts', accountData),
  
  updateAccount: (id: string, accountData: any) =>
    api.put(`/aws-accounts/${id}`, accountData),
  
  deleteAccount: (id: string) => api.delete(`/aws-accounts/${id}`),
  
  testConnection: (id: string) => api.post(`/aws-accounts/${id}/test`)
};

// Usage API calls
export const usageAPI = {
  getUsage: (params?: { 
    service?: string; 
    startDate?: string; 
    endDate?: string; 
  }) => api.get('/usage', { params }),
  
  getCostAnalysis: (params?: {
    groupBy?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/usage/cost-analysis', { params })
};

export default api;

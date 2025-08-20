// server.js
import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

// For now, let's create simplified routes inline since the route files use CommonJS
// We'll fix the route imports after converting them to ES modules

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Environment variables
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGO_URI = NODE_ENV === 'production' 
  ? process.env.MONGODB_URI_PROD 
  : process.env.MONGO_URI || 'mongodb://localhost:27017/cloud-optimizer';

// MongoDB Connection
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log(`✅ MongoDB Connected: ${MONGO_URI}`);
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

// Temporary inline routes until we convert route files to ES modules
// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // For demo purposes, create a mock user
    const mockUser = {
      _id: Date.now().toString(),
      firstName,
      lastName,
      email,
      role: 'user'
    };

    const mockToken = 'mock-jwt-token-' + Date.now();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: mockUser,
      token: mockToken
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // For demo purposes, accept any credentials
    const mockUser = {
      _id: Date.now().toString(),
      firstName: 'Demo',
      lastName: 'User',
      email,
      role: 'user'
    };

    const mockToken = 'mock-jwt-token-' + Date.now();

    res.json({
      success: true,
      message: 'Login successful',
      user: mockUser,
      token: mockToken
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Real AWS usage summary from database
app.get('/api/aws/usage/summary', async (req, res) => {
  try {
    // For now, return empty data since no real AWS data has been synced
    // This will be populated when users sync their AWS accounts
    res.json({
      success: true,
      data: {
        summary: [],
        period: { start: new Date(Date.now() - 30*24*60*60*1000), end: new Date() },
        totalResources: 0,
        totalCost: 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage summary',
      error: error.message
    });
  }
});

app.get('/api/data', async (req, res) => {
  try {
    // Return empty array since no real AWS data has been synced yet
    // This will be populated when users sync their AWS accounts
    res.json([]);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch data',
      error: error.message
    });
  }
});

app.get('/api/aws-accounts', async (req, res) => {
  try {
    // Return empty array since no AWS accounts have been added yet
    // This will be populated when users add their AWS accounts
    res.json([]);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AWS accounts',
      error: error.message
    });
  }
});

app.post('/api/aws-accounts', (req, res) => {
  res.status(201).json({
    success: true,
    message: 'AWS account added successfully',
    data: {
      id: Date.now().toString(),
      ...req.body,
      status: 'connected',
      lastSync: new Date().toISOString()
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: `AWS Cost Optimizer API - ${NODE_ENV} mode 🚀`,
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      aws: '/api/aws',
      health: '/api/health'
    }
  });
});

// Simple error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${NODE_ENV}`);
  console.log(`🔗 API Documentation: http://localhost:${PORT}/api/health`);
});
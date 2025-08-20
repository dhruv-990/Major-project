// server.js
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";

// Load environment variables
dotenv.config();
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("MONGO_URI:", process.env.MONGO_URI);
console.log("MONGODB_URI_PROD:", process.env.MONGODB_URI_PROD);


const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Environment variables
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";
const MONGO_URI =
  NODE_ENV === "production"
    ? process.env.MONGODB_URI_PROD
    : process.env.MONGO_URI;

// MongoDB Connection (optional for demo)
if (MONGO_URI && MONGO_URI !== 'undefined') {
  mongoose
    .connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log(`✅ MongoDB Connected: ${MONGO_URI}`))
    .catch((err) => {
      console.warn("⚠️ MongoDB connection failed, running in demo mode:", err.message);
    });
} else {
  console.log("🔄 Running in demo mode without MongoDB");
}

// Basic auth routes (simplified for testing)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, and password'
      });
    }

    // For demo purposes, create a mock user
    const mockUser = {
      _id: Date.now().toString(),
      username,
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
      username: 'Demo User',
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

// Dashboard endpoint
app.get('/api/dashboard', (req, res) => {
  res.json({
    totalSavings: 15420,
    monthlyCost: 8750,
    activeRecommendations: 12,
    awsAccounts: 3,
    recentRecommendations: [
      { id: 1, type: 'EC2', description: 'Resize t3.large to t3.medium', savings: 240 },
      { id: 2, type: 'S3', description: 'Enable lifecycle policies', savings: 180 },
      { id: 3, type: 'RDS', description: 'Switch to reserved instances', savings: 320 }
    ],
    costTrend: '-12%'
  });
});

// Data endpoint
app.get('/api/data', (req, res) => {
  res.json([
    {
      id: '1',
      service: 'EC2',
      resourceId: 'i-1234567890abcdef0',
      cost: 245.50,
      usage: { cpu: 15, memory: 45, storage: 100 },
      region: 'us-east-1',
      lastUpdated: '2024-01-15T10:30:00Z',
      status: 'active'
    },
    {
      id: '2',
      service: 'S3',
      resourceId: 'my-bucket-name',
      cost: 89.25,
      usage: { storage: 500 },
      region: 'us-west-2',
      lastUpdated: '2024-01-15T09:15:00Z',
      status: 'optimized'
    }
  ]);
});

// AWS accounts endpoint
app.post('/api/aws-accounts', (req, res) => {
  res.status(201).json({
    success: true,
    message: 'AWS account added successfully',
    data: {
      id: Date.now().toString(),
      ...req.body
    }
  });
});

app.get('/api/aws-accounts', (req, res) => {
  res.json([
    {
      id: '1',
      accountName: 'Production Account',
      accountId: '123456789012',
      region: 'us-east-1',
      status: 'connected',
      lastSync: '2024-01-15T10:30:00Z'
    }
  ]);
});

// Sample route
app.get("/", (req, res) => {
  res.send(`Server is running in ${NODE_ENV} mode 🚀`);
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
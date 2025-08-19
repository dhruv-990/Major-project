# Cloud Cost Optimizer (FinOps Tool) - Backend

A comprehensive backend service for analyzing AWS cloud usage and providing cost optimization recommendations. Built with Node.js, Express, and MongoDB.

## 🚀 Features

### Core Features (MVP)
- **User Authentication**: JWT-based login/signup system
- **AWS Account Management**: Connect multiple AWS accounts via IAM credentials
- **Resource Monitoring**: Track EC2, S3, RDS, and CloudWatch metrics
- **Cost Analysis**: Historical cost tracking and trend analysis
- **Smart Recommendations**: AI-powered cost optimization suggestions
- **Multi-tenant Architecture**: Support for multiple users and AWS accounts

### Cost Optimization Recommendations
- **EC2 Optimization**: Identify underutilized instances for downgrading
- **S3 Storage Classes**: Recommend optimal storage class changes
- **RDS Management**: Find idle or oversized database instances
- **Reserved Instances**: Suggest RI purchases for predictable workloads
- **Spot Instances**: Identify opportunities for spot instance usage

## 🛠 Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + bcrypt
- **AWS Integration**: AWS SDK v2
- **Validation**: Joi schema validation
- **Security**: Helmet, CORS, Rate limiting
- **Logging**: Morgan + custom error handling

## 📁 Project Structure

```
src/
├── config/           # Configuration files
│   ├── database.js   # MongoDB connection
│   └── aws.js       # AWS SDK configuration
├── models/           # Database models
│   ├── User.js      # User and AWS account management
│   ├── AWSUsage.js  # AWS resource usage data
│   └── Recommendation.js # Cost optimization suggestions
├── middleware/       # Express middleware
│   ├── authMiddleware.js    # JWT authentication
│   ├── errorMiddleware.js   # Error handling
│   └── validationMiddleware.js # Request validation
├── routes/           # API routes
│   ├── auth.js      # Authentication endpoints
│   └── aws.js       # AWS data and recommendations
├── utils/            # Utility functions
│   └── awsDataSync.js # AWS data synchronization
└── server.js         # Main application entry point
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- MongoDB 4.4+
- AWS Account with appropriate IAM permissions

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cloud-cost-optimizer-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/cloud-cost-optimizer
   JWT_SECRET=your-super-secret-jwt-key
   AWS_REGION=us-east-1
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Verify installation**
   ```bash
   curl http://localhost:5000/health
   ```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "company": "Acme Corp"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

#### Add AWS Account
```http
POST /api/auth/aws-account
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Production Account",
  "accessKeyId": "AKIAIOSFODNN7EXAMPLE",
  "secretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "region": "us-east-1"
}
```

### AWS Usage Endpoints

#### Get Usage Summary
```http
GET /api/aws/usage/summary?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <jwt-token>
```

#### Get EC2 Instances
```http
GET /api/aws/usage/ec2?region=us-east-1&limit=50&page=1
Authorization: Bearer <jwt-token>
```

#### Get S3 Buckets
```http
GET /api/aws/usage/s3?region=us-east-1&limit=50&page=1
Authorization: Bearer <jwt-token>
```

### Recommendations Endpoints

#### Get Cost Optimization Recommendations
```http
GET /api/aws/recommendations?service=EC2&priority=high&limit=20
Authorization: Bearer <jwt-token>
```

#### Mark Recommendation as Implemented
```http
PUT /api/aws/recommendations/:id/implement
Authorization: Bearer <jwt-token>
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable rounds
- **Rate Limiting**: Configurable request throttling
- **Input Validation**: Joi schema validation for all inputs
- **CORS Protection**: Configurable cross-origin restrictions
- **Helmet Security**: HTTP security headers
- **Request Sanitization**: Automatic input sanitization

## 🗄 Database Models

### User Model
- Email, password, personal information
- Multiple AWS account credentials
- User preferences and notification settings
- Role-based access control

### AWS Usage Model
- Resource metrics (CPU, memory, storage)
- Cost tracking with currency support
- Historical data with timestamps
- Resource tags and metadata

### Recommendation Model
- Cost optimization suggestions
- Implementation steps and prerequisites
- Priority and risk assessment
- Action tracking and status management

## 🔄 AWS Integration

### Supported Services
- **EC2**: Instance monitoring and optimization
- **S3**: Storage analysis and class recommendations
- **RDS**: Database performance and cost analysis
- **CloudWatch**: Metrics collection and analysis
- **Cost Explorer**: Historical cost data (planned)

### Data Synchronization
- Automated resource discovery
- Metric collection from CloudWatch
- Cost estimation and tracking
- Real-time optimization analysis

## 🚀 Deployment

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Environment Variables
- `NODE_ENV`: Application environment
- `PORT`: Server port
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `AWS_REGION`: Default AWS region
- `RATE_LIMIT_MAX_REQUESTS`: Rate limiting configuration

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## 📊 Monitoring & Logging

- **Health Check Endpoint**: `/health`
- **Structured Logging**: Morgan + custom error logging
- **Error Tracking**: Comprehensive error handling middleware
- **Performance Monitoring**: Request timing and metrics

## 🔮 Future Enhancements

- **Multi-cloud Support**: GCP and Azure integration
- **AI-powered Recommendations**: OpenAI integration for smarter suggestions
- **Email Alerts**: Cost spike notifications
- **Cost Forecasting**: Predictive cost analysis
- **Automated Actions**: One-click optimization implementation
- **Team Collaboration**: Shared dashboards and reports

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API examples

## 🔗 Related Links

- [Frontend Repository](link-to-frontend)
- [API Documentation](link-to-api-docs)
- [Deployment Guide](link-to-deployment)
- [Contributing Guidelines](link-to-contributing)

---

**Built with ❤️ for the FinOps community** 
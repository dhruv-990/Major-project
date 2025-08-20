# Cloud Cost Optimization Frontend

A modern React frontend built with Next.js and TailwindCSS for AWS cloud cost optimization and monitoring.

## Features

- **Authentication System**: Secure login/signup with JWT token management
- **Dashboard**: Real-time cost metrics, savings tracking, and optimization recommendations
- **Data Visualization**: Interactive tables and charts for AWS resource analysis
- **AWS Account Management**: Connect and manage multiple AWS accounts
- **Cost Analytics**: Detailed cost breakdowns and trend analysis
- **Responsive Design**: Mobile-first design with TailwindCSS

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: TailwindCSS
- **Icons**: Heroicons
- **HTTP Client**: Axios
- **Language**: TypeScript

## Getting Started

1. **Install Dependencies**:
```bash
npm install
```

2. **Start Development Server**:
```bash
npm run dev
```

3. **Open Browser**: Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── login/             # Authentication pages
│   ├── signup/
│   ├── dashboard/         # Main dashboard
│   ├── data/              # Data table view
│   ├── form/              # AWS account form
│   ├── analytics/         # Cost analytics
│   └── aws-accounts/      # Account management
├── components/            # Reusable components
│   ├── layout/           # Layout components (Navbar, Sidebar)
│   └── dashboard/        # Dashboard-specific components
└── services/             # API service layer
    └── api.ts           # Centralized API calls
```

## Pages Overview

### Authentication
- **Login** (`/login`): User authentication with email/password
- **Signup** (`/signup`): New user registration

### Main Application
- **Dashboard** (`/dashboard`): Overview of cost metrics and recommendations
- **Data View** (`/data`): Searchable table of AWS resources with filtering
- **Analytics** (`/analytics`): Cost trends and optimization insights
- **Add Account** (`/form`): Form to connect new AWS accounts
- **AWS Accounts** (`/aws-accounts`): Manage connected AWS accounts

## API Integration

The frontend connects to a Node.js backend running on `http://localhost:5000`. Key endpoints:

- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/dashboard` - Dashboard metrics
- `GET /api/data` - AWS resource data
- `POST /api/aws-accounts` - Add AWS account
- `GET /api/aws-accounts` - List AWS accounts

## Environment Setup

Make sure your backend server is running on port 5000. The frontend includes:

- **Error Handling**: Automatic token refresh and logout on auth errors
- **Loading States**: Spinner components during API calls
- **Demo Data**: Fallback mock data when backend is unavailable
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Security Features

- JWT token storage in localStorage
- Automatic logout on token expiration
- CORS handling for API requests
- Input validation on forms
- Secure credential handling for AWS accounts

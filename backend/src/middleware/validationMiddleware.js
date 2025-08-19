const Joi = require('joi');

// Validation schemas
const schemas = {
  // User registration
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(8).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'any.required': 'Password is required'
    }),
    firstName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required'
    }),
    lastName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required'
    }),
    company: Joi.string().max(100).optional().messages({
      'string.max': 'Company name cannot exceed 100 characters'
    })
  }),

  // User login
  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  }),

  // AWS account addition
  addAWSAccount: Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Account name must be at least 2 characters long',
      'string.max': 'Account name cannot exceed 100 characters',
      'any.required': 'Account name is required'
    }),
    accessKeyId: Joi.string().length(20).required().messages({
      'string.length': 'Access Key ID must be exactly 20 characters',
      'any.required': 'Access Key ID is required'
    }),
    secretAccessKey: Joi.string().min(40).required().messages({
      'string.min': 'Secret Access Key must be at least 40 characters long',
      'any.required': 'Secret Access Key is required'
    }),
    region: Joi.string().valid(
      'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
      'af-south-1', 'ap-east-1', 'ap-south-1', 'ap-northeast-1',
      'ap-northeast-2', 'ap-northeast-3', 'ap-southeast-1', 'ap-southeast-2',
      'ca-central-1', 'eu-central-1', 'eu-west-1', 'eu-west-2',
      'eu-west-3', 'eu-north-1', 'eu-south-1', 'me-south-1',
      'sa-east-1'
    ).default('us-east-1').messages({
      'any.only': 'Please provide a valid AWS region'
    }),
    tags: Joi.array().items(
      Joi.object({
        key: Joi.string().required(),
        value: Joi.string().required()
      })
    ).optional()
  }),

  // AWS usage query
  awsUsageQuery: Joi.object({
    service: Joi.string().valid('EC2', 'S3', 'RDS', 'CloudWatch', 'CostExplorer', 'all').optional(),
    region: Joi.string().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    limit: Joi.number().integer().min(1).max(1000).default(100).optional(),
    page: Joi.number().integer().min(1).default(1).optional()
  }),

  // Recommendation query
  recommendationQuery: Joi.object({
    service: Joi.string().valid('EC2', 'S3', 'RDS', 'Lambda', 'EBS', 'ELB', 'CloudFront', 'all').optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical', 'all').optional(),
    status: Joi.string().valid('pending', 'in-progress', 'implemented', 'dismissed', 'all').optional(),
    limit: Joi.number().integer().min(1).max(100).default(20).optional(),
    page: Joi.number().integer().min(1).default(1).optional()
  }),

  // Update user profile
  updateProfile: Joi.object({
    firstName: Joi.string().min(2).max(50).optional().messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters'
    }),
    lastName: Joi.string().min(2).max(50).optional().messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters'
    }),
    company: Joi.string().max(100).optional().messages({
      'string.max': 'Company name cannot exceed 100 characters'
    }),
    preferences: Joi.object({
      notifications: Joi.object({
        email: Joi.boolean().optional(),
        costAlerts: Joi.boolean().optional(),
        recommendations: Joi.boolean().optional()
      }).optional(),
      dashboard: Joi.object({
        defaultView: Joi.string().valid('overview', 'costs', 'resources', 'recommendations').optional(),
        refreshInterval: Joi.number().min(60000).max(3600000).optional() // 1 minute to 1 hour
      }).optional()
    }).optional()
  }),

  // Change password
  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Current password is required'
    }),
    newPassword: Joi.string().min(8).required().messages({
      'string.min': 'New password must be at least 8 characters long',
      'any.required': 'New password is required'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
      'any.only': 'Password confirmation does not match',
      'any.required': 'Password confirmation is required'
    })
  })
};

// Validation middleware factory
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return res.status(500).json({
        success: false,
        message: 'Validation schema not found'
      });
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
      });
    }

    // Replace req.body with validated data
    req.body = value;
    next();
  };
};

// Query validation middleware
const validateQuery = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return res.status(500).json({
        success: false,
        message: 'Validation schema not found'
      });
    }

    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors: errorMessages
      });
    }

    // Replace req.query with validated data
    req.query = value;
    next();
  };
};

module.exports = {
  validate,
  validateQuery,
  schemas
}; 
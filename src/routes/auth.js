const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { asyncHandler } = require('../middleware/errorMiddleware');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', validate('register'), asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, company } = req.body;

  // Check if user already exists
  const userExists = await User.findByEmail(email);
  if (userExists) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  // Create user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    company
  });

  if (user) {
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company,
        role: user.role,
        token: generateToken(user._id)
      }
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Invalid user data'
    });
  }
}));

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validate('login'), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email and include password for comparison
  const user = await User.findByEmail(email).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated. Please contact support.'
    });
  }

  // Check password
  const isMatch = await user.correctPassword(password, user.password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      company: user.company,
      role: user.role,
      awsAccounts: user.awsAccounts,
      preferences: user.preferences,
      token: generateToken(user._id)
    }
  });
}));

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');

  res.json({
    success: true,
    data: user
  });
}));

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, validate('updateProfile'), asyncHandler(async (req, res) => {
  const { firstName, lastName, company, preferences } = req.body;

  const user = await User.findById(req.user._id);

  if (user) {
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.company = company !== undefined ? company : user.company;
    
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        company: updatedUser.company,
        role: updatedUser.role,
        preferences: updatedUser.preferences
      }
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
}));

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, validate('changePassword'), asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check current password
  const isMatch = await user.correctPassword(currentPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

// @desc    Add AWS account
// @route   POST /api/auth/aws-account
// @access  Private
router.post('/aws-account', protect, validate('addAWSAccount'), asyncHandler(async (req, res) => {
  const { name, accessKeyId, secretAccessKey, region, tags } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if AWS account already exists
  const existingAccount = user.awsAccounts.find(
    account => account.accessKeyId === accessKeyId
  );

  if (existingAccount) {
    return res.status(400).json({
      success: false,
      message: 'AWS account with this Access Key ID already exists'
    });
  }

  // Add new AWS account
  user.awsAccounts.push({
    name,
    accessKeyId,
    secretAccessKey,
    region,
    tags
  });

  await user.save();

  res.status(201).json({
    success: true,
    message: 'AWS account added successfully',
    data: {
      name,
      accessKeyId,
      region,
      tags
    }
  });
}));

// @desc    Get AWS accounts
// @route   GET /api/auth/aws-accounts
// @access  Private
router.get('/aws-accounts', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('awsAccounts');

  res.json({
    success: true,
    data: user.awsAccounts
  });
}));

// @desc    Update AWS account
// @route   PUT /api/auth/aws-account/:accountId
// @access  Private
router.put('/aws-account/:accountId', protect, validate('addAWSAccount'), asyncHandler(async (req, res) => {
  const { name, accessKeyId, secretAccessKey, region, tags } = req.body;
  const { accountId } = req.params;

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const accountIndex = user.awsAccounts.findIndex(
    account => account._id.toString() === accountId
  );

  if (accountIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'AWS account not found'
    });
  }

  // Update account
  user.awsAccounts[accountIndex] = {
    ...user.awsAccounts[accountIndex],
    name,
    accessKeyId,
    secretAccessKey,
    region,
    tags
  };

  await user.save();

  res.json({
    success: true,
    message: 'AWS account updated successfully',
    data: user.awsAccounts[accountIndex]
  });
}));

// @desc    Delete AWS account
// @route   DELETE /api/auth/aws-account/:accountId
// @access  Private
router.delete('/aws-account/:accountId', protect, asyncHandler(async (req, res) => {
  const { accountId } = req.params;

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const accountIndex = user.awsAccounts.findIndex(
    account => account._id.toString() === accountId
  );

  if (accountIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'AWS account not found'
    });
  }

  // Remove account
  user.awsAccounts.splice(accountIndex, 1);
  await user.save();

  res.json({
    success: true,
    message: 'AWS account deleted successfully'
  });
}));

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
router.get('/users', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');

  res.json({
    success: true,
    count: users.length,
    data: users
  });
}));

module.exports = router; 
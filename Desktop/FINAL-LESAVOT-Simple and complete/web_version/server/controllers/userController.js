/**
 * User Controller - PostgreSQL Implementation
 *
 * This controller handles user-related operations using PostgreSQL.
 */

const { AppError, catchAsync } = require('../utils/errorHandler');
const User = require('../models/User');
const logger = require('../utils/logger');

// Get all users (admin only)
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const { limit = 50, page = 1 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const users = await User.findAll(parseInt(limit), offset);
    const totalCount = await User.getCount();

    logger.info(`Retrieved ${users.length} users for admin`);

    res.status(200).json({
      success: true,
      data: {
        users: users.map(user => user.toSafeObject()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching all users:', error);
    return next(new AppError('Error fetching users', 500));
  }
});

// Get user by ID
exports.getUserById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new AppError('User ID is required', 400));
  }

  try {
    const user = await User.findById(id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    logger.info(`Retrieved user ${id}`);

    res.status(200).json({
      success: true,
      data: {
        user: user.toSafeObject()
      }
    });
  } catch (error) {
    logger.error('Error fetching user by ID:', error);
    return next(new AppError('Error fetching user', 500));
  }
});

// Update user profile
exports.updateProfile = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { username, email } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Check if username is already taken (excluding current user)
    if (username && username !== user.username) {
      const usernameExists = await User.usernameExists(username, userId);
      if (usernameExists) {
        return next(new AppError('Username is already taken', 400));
      }
      user.username = username;
    }

    // Check if email is already taken (excluding current user)
    if (email && email !== user.email) {
      const emailExists = await User.emailExists(email, userId);
      if (emailExists) {
        return next(new AppError('Email is already taken', 400));
      }
      user.email = email;
    }

    const success = await user.save();

    if (!success) {
      return next(new AppError('Failed to update profile', 500));
    }

    logger.info(`User profile updated: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.toSafeObject()
      }
    });
  } catch (error) {
    logger.error('Error updating user profile:', error);
    return next(new AppError('Error updating profile', 500));
  }
});

// Delete user account
exports.deleteAccount = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const success = await user.delete();

    if (!success) {
      return next(new AppError('Failed to delete account', 500));
    }

    logger.info(`User account deleted: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting user account:', error);
    return next(new AppError('Error deleting account', 500));
  }
});

// Get current user profile
exports.getProfile = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: {
        user: user.toSafeObject()
      }
    });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    return next(new AppError('Error fetching profile', 500));
  }
});

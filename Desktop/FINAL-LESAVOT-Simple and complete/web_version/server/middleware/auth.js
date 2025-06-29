/**
 * Authentication Middleware
 *
 * This middleware verifies JWT tokens and user existence using PostgreSQL.
 */

const jwt = require('jsonwebtoken');
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const Session = require('../models/Session');
const { AppError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

// Middleware to protect routes that require authentication
exports.protect = async (req, res, next) => {
  try {
    // 1) Get token from header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'You are not logged in! Please log in to get access.'
      });
    }

    // 2) Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token. Please log in again.'
      });
    }

    // 3) Check if user still exists
    const userId = decoded.sub || decoded.userId; // Support both standard 'sub' and legacy 'userId'
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(401).json({
        status: 'error',
        message: 'The user belonging to this token does no longer exist.'
      });
    }

    // 4) Check if user account is active
    if (!currentUser.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // 5) Check if session is valid (if sessionId is in token)
    if (decoded.sessionId) {
      const session = await Session.findBySessionId(decoded.sessionId);
      if (!session || !session.isValid()) {
        return res.status(401).json({
          status: 'error',
          message: 'Your session has expired. Please log in again.'
        });
      }

      // Update session last activity
      await session.updateLastActivity();
    }

    // Grant access to protected route
    req.user = currentUser;
    req.sessionId = decoded.sessionId;
    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Authentication failed due to server error.'
    });
  }
};

// Middleware to restrict access to certain roles (kept generic)
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

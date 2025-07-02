/**
 * Rate Limiting Middleware
 * 
 * This module provides rate limiting middleware to protect against brute force attacks.
 */

const rateLimit = require('express-rate-limit');
const { RateLimitError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Create a rate limiter middleware
 * 
 * @param {Object} options - Rate limiter options
 * @returns {Function} - Express middleware function
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes by default
    max = 100, // 100 requests per window by default
    message = 'Too many requests, please try again later',
    statusCode = 429,
    skipSuccessfulRequests = false,
    keyGenerator = (req) => req.ip,
    skip = () => false,
    handler = null,
    store = null
  } = options;

  // Default handler
  const defaultHandler = (req, res, next) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent')
    });

    // If next is provided, pass the error to the error handler
    if (options.useErrorHandler) {
      next(new RateLimitError(message));
    } else {
      // Otherwise, send the response directly
      res.status(statusCode).json({
        status: 'error',
        message
      });
    }
  };

  return rateLimit({
    windowMs,
    max,
    message,
    statusCode,
    skipSuccessfulRequests,
    keyGenerator,
    skip,
    handler: handler || defaultHandler,
    store
  });
};

/**
 * Global API rate limiter
 * Limits all API requests
 */
exports.globalLimiter = createRateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later',
  useErrorHandler: true
});

/**
 * Authentication rate limiter
 * More strict limits for authentication endpoints to prevent brute force attacks
 */
exports.authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 10, // 100 requests in dev, 10 in production
  message: 'Too many authentication attempts, please try again later',
  useErrorHandler: true,
  keyGenerator: (req) => {
    // Use email as part of the key if available
    if (req.body && req.body.email) {
      return `${req.ip}-${req.body.email.toLowerCase()}`;
    }
    return req.ip;
  }
});

/**
 * User account rate limiter
 * Limits requests to user account endpoints
 */
exports.userLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 requests per hour
  message: 'Too many account operations, please try again later',
  useErrorHandler: true
});

/**
 * Password reset rate limiter
 * Very strict limits for password reset to prevent abuse
 */
exports.passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: 'Too many password reset attempts, please try again later',
  useErrorHandler: true,
  keyGenerator: (req) => {
    // Use email as part of the key if available
    if (req.body && req.body.email) {
      return `${req.ip}-${req.body.email.toLowerCase()}`;
    }
    return req.ip;
  }
});

/**
 * API key rate limiter
 * Limits requests using API keys
 */
exports.apiKeyLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute (1 req/sec)
  message: 'API rate limit exceeded',
  useErrorHandler: true,
  keyGenerator: (req) => {
    // Use API key from header or query parameter
    const apiKey = req.get('X-API-Key') || req.query.api_key;
    if (apiKey) {
      return apiKey;
    }
    return req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for internal API keys
    const apiKey = req.get('X-API-Key') || req.query.api_key;
    return apiKey && apiKey.startsWith('internal_');
  }
});

/**
 * Create a dynamic rate limiter based on user ID
 * 
 * @param {Object} options - Rate limiter options
 * @returns {Function} - Express middleware function
 */
exports.createUserRateLimiter = (options = {}) => {
  return createRateLimiter({
    windowMs: options.windowMs || 60 * 1000, // 1 minute by default
    max: options.max || 30, // 30 requests per minute by default
    message: options.message || 'Too many requests, please try again later',
    useErrorHandler: true,
    keyGenerator: (req) => {
      // Use user ID from authenticated user
      if (req.user && req.user.user_id) {
        return `user-${req.user.user_id}`;
      }
      return req.ip;
    },
    ...options
  });
};

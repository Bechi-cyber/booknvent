/**
 * Error Handling Utilities (Supabase logic removed)
 *
 * This module provides custom error classes and error handling utilities.
 */

const logger = require('./logger');

class AppError extends Error {
  constructor(message, statusCode, metadata = {}) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.metadata = metadata;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

class DatabaseError extends AppError {
  constructor(message, originalError, metadata = {}) {
    super(message, 500, metadata);
    this.originalError = originalError;
    this.code = originalError?.code;
    this.type = 'database';
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, { errors });
    this.errors = errors;
    this.type = 'validation';
  }
}

class AuthenticationError extends AppError {
  constructor(message, metadata = {}) {
    super(message, 401, metadata);
    this.type = 'authentication';
  }
}

class AuthorizationError extends AppError {
  constructor(message, metadata = {}) {
    super(message, 403, metadata);
    this.type = 'authorization';
  }
}

class NotFoundError extends AppError {
  constructor(message, metadata = {}) {
    super(message, 404, metadata);
    this.type = 'not_found';
  }
}

class ConflictError extends AppError {
  constructor(message, metadata = {}) {
    super(message, 409, metadata);
    this.type = 'conflict';
  }
}

class RateLimitError extends AppError {
  constructor(message, metadata = {}) {
    super(message, 429, metadata);
    this.type = 'rate_limit';
  }
}

const catchAsync = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(err => {
      if (err.isOperational) {
        logger.warn(`Operational error: ${err.message}`, {
          statusCode: err.statusCode,
          type: err.type,
          path: req.path,
          method: req.method,
          metadata: err.metadata
        });
      } else {
        logger.error(`Unhandled error: ${err.message}`, {
          stack: err.stack,
          path: req.path,
          method: req.method
        });
      }
      next(err);
    });
  };
};

module.exports = {
  AppError,
  DatabaseError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  catchAsync
};

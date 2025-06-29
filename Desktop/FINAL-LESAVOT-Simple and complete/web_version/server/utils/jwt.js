/**
 * JWT Utility Functions
 *
 * This module provides functions for generating and verifying JWT tokens.
 */

const jwt = require('jsonwebtoken');
const logger = require('./logger');

/**
 * Generate a JWT token for a user
 * @param {String} userId - The user's ID
 * @param {String} expiresIn - Token expiration time (e.g., '7d', '24h')
 * @param {Object} additionalClaims - Additional claims to include in the token
 * @returns {String} - JWT token
 */
exports.generateToken = (userId, expiresIn = null, additionalClaims = {}) => {
  try {
    // Use provided expiration or default from environment
    const tokenExpiry = expiresIn || process.env.JWT_EXPIRES_IN || '7d';

    // Create payload with standard claims
    const payload = {
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      ...additionalClaims
    };

    // Sign token
    return jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {
        expiresIn: tokenExpiry,
        algorithm: 'HS256'
      }
    );
  } catch (error) {
    logger.error('Error generating JWT token:', error);
    throw new Error('Failed to generate authentication token');
  }
};

/**
 * Generate a refresh token for a user
 * @param {String} userId - The user's ID
 * @param {String} tokenId - Unique token ID for tracking/revocation
 * @returns {String} - JWT refresh token
 */
exports.generateRefreshToken = (userId, tokenId) => {
  try {
    return jwt.sign(
      {
        sub: userId,
        jti: tokenId,
        type: 'refresh'
      },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
        algorithm: 'HS256'
      }
    );
  } catch (error) {
    logger.error('Error generating refresh token:', error);
    throw new Error('Failed to generate refresh token');
  }
};

/**
 * Verify a JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} - Decoded token payload
 */
exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Token expired:', { error: error.message });
      throw new Error('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid token:', { error: error.message });
      throw new Error('Invalid token');
    } else {
      logger.error('Error verifying token:', error);
      throw new Error('Token verification failed');
    }
  }
};

/**
 * Verify a refresh token
 * @param {String} token - Refresh token to verify
 * @returns {Object} - Decoded token payload
 */
exports.verifyRefreshToken = (token) => {
  try {
    return jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { algorithms: ['HS256'] }
    );
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Refresh token expired:', { error: error.message });
      throw new Error('Refresh token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid refresh token:', { error: error.message });
      throw new Error('Invalid refresh token');
    } else {
      logger.error('Error verifying refresh token:', error);
      throw new Error('Refresh token verification failed');
    }
  }
};

/**
 * Decode a JWT token without verification
 * @param {String} token - JWT token to decode
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
exports.decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.warn('Error decoding token:', error);
    return null;
  }
};

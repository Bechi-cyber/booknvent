/**
 * Session Model for PostgreSQL
 *
 * Handles OTP sessions, authentication tokens, and user sessions
 */

const crypto = require('crypto');
const database = require('../utils/database');
const logger = require('../utils/logger');

class Session {
  constructor(sessionData = {}) {
    this.id = sessionData.id || null;
    this.sessionId = sessionData.session_id || sessionData.sessionId || this.generateSessionId();
    this.userId = sessionData.user_id || sessionData.userId || null;
    this.username = sessionData.username;
    this.sessionType = sessionData.session_type || sessionData.sessionType || 'otp'; // 'otp', 'auth'
    this.otpCode = sessionData.otp_code || sessionData.otpCode || null;
    this.isVerified = sessionData.is_verified !== undefined ? sessionData.is_verified : (sessionData.isVerified !== undefined ? sessionData.isVerified : false);
    this.expiresAt = sessionData.expires_at || sessionData.expiresAt;
    this.createdAt = sessionData.created_at || sessionData.createdAt || null;
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Save session to database
   */
  async save() {
    try {
      if (this.id) {
        // Update existing session
        const result = await database.query(`
          UPDATE sessions
          SET session_id = $1, user_id = $2, username = $3, session_type = $4,
              otp_code = $5, is_verified = $6, expires_at = $7
          WHERE id = $8
          RETURNING id, session_id, created_at
        `, [
          this.sessionId, this.userId || null, this.username, this.sessionType,
          this.otpCode, this.isVerified, this.expiresAt, this.id
        ]);

        return result.rows.length > 0;
      } else {
        // Create new session
        const result = await database.query(`
          INSERT INTO sessions (session_id, user_id, username, session_type, otp_code, is_verified, expires_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, session_id, created_at
        `, [
          this.sessionId, this.userId || null, this.username, this.sessionType,
          this.otpCode, this.isVerified, this.expiresAt
        ]);

        if (result.rows.length > 0) {
          const session = result.rows[0];
          this.id = session.id;
          this.createdAt = session.created_at;
          return true;
        }
        return false;
      }
    } catch (error) {
      logger.error('Error saving session:', error);
      throw error;
    }
  }

  /**
   * Find session by session ID
   */
  static async findBySessionId(sessionId) {
    try {
      const result = await database.query(`
        SELECT id, session_id, user_id, username, session_type, otp_code,
               is_verified, expires_at, created_at
        FROM sessions
        WHERE session_id = $1 AND expires_at > CURRENT_TIMESTAMP
      `, [sessionId]);

      return result.rows.length > 0 ? new Session(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error finding session by ID:', error);
      throw error;
    }
  }

  /**
   * Find active sessions by username
   */
  static async findByUsername(username, sessionType = null) {
    try {
      let query = `
        SELECT id, session_id, user_id, username, session_type, otp_code,
               is_verified, expires_at, created_at
        FROM sessions
        WHERE username = $1 AND expires_at > CURRENT_TIMESTAMP
      `;
      let params = [username];

      if (sessionType) {
        query += ' AND session_type = $2';
        params.push(sessionType);
      }

      query += ' ORDER BY created_at DESC';

      const result = await database.query(query, params);
      return result.rows.map(sessionData => new Session(sessionData));
    } catch (error) {
      logger.error('Error finding sessions by username:', error);
      throw error;
    }
  }

  /**
   * Find active OTP session by username
   */
  static async findActiveOtpSession(username) {
    try {
      const result = await database.query(`
        SELECT id, session_id, user_id, username, session_type, otp_code,
               is_verified, expires_at, created_at
        FROM sessions
        WHERE username = $1 AND session_type = 'otp' AND expires_at > CURRENT_TIMESTAMP
        ORDER BY created_at DESC
        LIMIT 1
      `, [username]);

      if (result.rows.length === 0) {
        return null;
      }

      return new Session(result.rows[0]);
    } catch (error) {
      logger.error('Error finding active OTP session:', error);
      throw error;
    }
  }

  /**
   * Create OTP session
   */
  static async createOtpSession(username, otp, expirySeconds = 300) {
    try {
      const expiresAt = new Date(Date.now() + (expirySeconds * 1000));

      const session = new Session({
        username,
        sessionType: 'otp',
        otpCode: otp,
        expiresAt
      });

      await session.save();
      return session;
    } catch (error) {
      logger.error('Error creating OTP session:', error);
      throw error;
    }
  }

  /**
   * Verify OTP
   */
  static async verifyOtp(username, otp) {
    try {
      const result = await database.query(`
        SELECT id, session_id, user_id, username, session_type, otp_code,
               is_verified, expires_at, created_at
        FROM sessions
        WHERE username = $1 AND session_type = 'otp' AND otp_code = $2
              AND expires_at > CURRENT_TIMESTAMP AND is_verified = false
      `, [username, otp]);

      if (result.rows.length > 0) {
        const sessionData = result.rows[0];

        // Mark the OTP session as verified
        await database.query(`
          UPDATE sessions
          SET is_verified = true
          WHERE id = $1
        `, [sessionData.id]);

        sessionData.is_verified = true;
        return new Session(sessionData);
      }

      return null;
    } catch (error) {
      logger.error('Error verifying OTP:', error);
      throw error;
    }
  }

  /**
   * Create authentication session
   */
  static async createAuthSession(userId, username, expiryHours = 24) {
    try {
      const expiresAt = new Date(Date.now() + (expiryHours * 60 * 60 * 1000));

      const session = new Session({
        userId,
        username,
        sessionType: 'auth',
        isVerified: true,
        expiresAt
      });

      await session.save();
      return session;
    } catch (error) {
      logger.error('Error creating auth session:', error);
      throw error;
    }
  }

  /**
   * Invalidate session (delete it)
   */
  async invalidate() {
    try {
      const result = await database.query(`
        DELETE FROM sessions WHERE id = $1
      `, [this.id]);

      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error invalidating session:', error);
      throw error;
    }
  }

  /**
   * Invalidate all sessions for a user
   */
  static async invalidateAllUserSessions(username) {
    try {
      const result = await database.query(`
        DELETE FROM sessions WHERE username = $1
      `, [username]);

      return result.rowCount;
    } catch (error) {
      logger.error('Error invalidating all user sessions:', error);
      throw error;
    }
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions() {
    try {
      const result = await database.query(`
        DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP
      `);

      logger.info(`Cleaned up ${result.rowCount} expired sessions`);
      return result.rowCount;
    } catch (error) {
      logger.error('Error cleaning up expired sessions:', error);
      throw error;
    }
  }

  /**
   * Check if session is valid
   */
  isValid() {
    return this.expiresAt && new Date(this.expiresAt) > new Date();
  }

  /**
   * Extend session expiry
   */
  async extend(additionalHours = 24) {
    try {
      this.expiresAt = new Date(Date.now() + (additionalHours * 60 * 60 * 1000));

      const result = await database.query(`
        UPDATE sessions
        SET expires_at = $1
        WHERE id = $2
      `, [this.expiresAt, this.id]);

      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error extending session:', error);
      throw error;
    }
  }

  /**
   * Get active sessions count for user
   */
  static async getActiveSessionsCount(username) {
    try {
      const result = await database.query(`
        SELECT COUNT(*) as count
        FROM sessions
        WHERE username = $1 AND expires_at > CURRENT_TIMESTAMP
      `, [username]);

      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error getting active sessions count:', error);
      throw error;
    }
  }

  /**
   * Get session by ID
   */
  static async findById(id) {
    try {
      const result = await database.query(`
        SELECT id, session_id, user_id, username, session_type, otp_code,
               is_verified, expires_at, created_at
        FROM sessions
        WHERE id = $1
      `, [id]);

      return result.rows.length > 0 ? new Session(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error finding session by ID:', error);
      throw error;
    }
  }

  /**
   * Convert to safe object (removes sensitive data)
   */
  toSafeObject() {
    return {
      id: this.id,
      sessionId: this.sessionId,
      userId: this.userId,
      username: this.username,
      sessionType: this.sessionType,
      isVerified: this.isVerified,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt
    };
  }
}

module.exports = Session;

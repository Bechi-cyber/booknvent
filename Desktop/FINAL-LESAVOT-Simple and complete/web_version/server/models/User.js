/**
 * User Model for PostgreSQL
 *
 * Defines the user schema and provides user-related database operations
 */

const bcrypt = require('bcrypt');
const database = require('../utils/database');
const logger = require('../utils/logger');

class User {
  constructor(userData = {}) {
    this.id = userData.id || null;
    this.username = userData.username;
    this.email = userData.email;
    this.password = userData.password;
    this.passwordHash = userData.password_hash || userData.passwordHash;
    this.salt = userData.salt;
    this.isActive = userData.is_active !== undefined ? userData.is_active : (userData.isActive !== undefined ? userData.isActive : true);
    this.failedLoginAttempts = userData.failed_login_attempts || userData.failedLoginAttempts || 0;
    this.accountLockedUntil = userData.account_locked_until || userData.accountLockedUntil || null;
    this.lastLogin = userData.last_login || userData.lastLogin || null;
    this.passwordResetToken = userData.password_reset_token || userData.passwordResetToken || null;
    this.passwordResetExpires = userData.password_reset_expires || userData.passwordResetExpires || null;
    this.createdAt = userData.created_at || userData.createdAt || null;
    this.updatedAt = userData.updated_at || userData.updatedAt || null;
  }

  /**
   * Hash password with salt
   */
  async hashPassword(plainPassword) {
    try {
      const saltRounds = 12;
      this.salt = await bcrypt.genSalt(saltRounds);
      this.passwordHash = await bcrypt.hash(plainPassword, this.salt);
      return { passwordHash: this.passwordHash, salt: this.salt };
    } catch (error) {
      logger.error('Error hashing password:', error);
      throw error;
    }
  }

  /**
   * Verify password
   */
  async verifyPassword(plainPassword) {
    try {
      if (!this.passwordHash) {
        return false;
      }
      return await bcrypt.compare(plainPassword, this.passwordHash);
    } catch (error) {
      logger.error('Error verifying password:', error);
      return false;
    }
  }

  /**
   * Save user to database
   */
  async save() {
    try {
      if (this.id) {
        // Update existing user
        const result = await database.query(`
          UPDATE users
          SET username = $1, email = $2, password_hash = $3, salt = $4,
              is_active = $5, failed_login_attempts = $6, account_locked_until = $7,
              last_login = $8, password_reset_token = $9, password_reset_expires = $10,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $11
          RETURNING id, username, email, is_active, created_at, updated_at
        `, [
          this.username, this.email, this.passwordHash, this.salt,
          this.isActive, this.failedLoginAttempts, this.accountLockedUntil,
          this.lastLogin, this.passwordResetToken, this.passwordResetExpires, this.id
        ]);

        if (result.rows.length > 0) {
          this.updatedAt = result.rows[0].updated_at;
          return true;
        }
        return false;
      } else {
        // Create new user
        if (this.password && !this.passwordHash) {
          await this.hashPassword(this.password);
        }

        const result = await database.query(`
          INSERT INTO users (username, email, password_hash, salt, is_active, failed_login_attempts)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, username, email, is_active, created_at, updated_at
        `, [
          this.username, this.email, this.passwordHash, this.salt,
          this.isActive, this.failedLoginAttempts
        ]);

        if (result.rows.length > 0) {
          const user = result.rows[0];
          this.id = user.id;
          this.createdAt = user.created_at;
          this.updatedAt = user.updated_at;
          return true;
        }
        return false;
      }
    } catch (error) {
      logger.error('Error saving user:', error);
      throw error;
    }
  }

  /**
   * Find user by username
   */
  static async findByUsername(username) {
    try {
      const result = await database.query(`
        SELECT id, username, email, password_hash, salt, is_active,
               failed_login_attempts, account_locked_until, last_login,
               password_reset_token, password_reset_expires,
               created_at, updated_at
        FROM users
        WHERE username = $1
      `, [username]);

      return result.rows.length > 0 ? new User(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error finding user by username:', error);
      throw error;
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    try {
      const result = await database.query(`
        SELECT id, username, email, password_hash, salt, is_active,
               failed_login_attempts, account_locked_until, last_login,
               password_reset_token, password_reset_expires,
               created_at, updated_at
        FROM users
        WHERE email = $1
      `, [email]);

      return result.rows.length > 0 ? new User(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    try {
      const result = await database.query(`
        SELECT id, username, email, password_hash, salt, is_active,
               failed_login_attempts, account_locked_until, last_login,
               password_reset_token, password_reset_expires,
               created_at, updated_at
        FROM users
        WHERE id = $1
      `, [id]);

      return result.rows.length > 0 ? new User(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Find user by password reset token
   */
  static async findByResetToken(token) {
    try {
      const result = await database.query(`
        SELECT id, username, email, password_hash, salt, is_active,
               failed_login_attempts, account_locked_until, last_login,
               password_reset_token, password_reset_expires,
               created_at, updated_at
        FROM users
        WHERE password_reset_token = $1
      `, [token]);

      if (result.rows.length === 0) {
        return null;
      }

      return new User(result.rows[0]);
    } catch (error) {
      logger.error('Error finding user by reset token:', error);
      throw error;
    }
  }

  /**
   * Update last login time
   */
  async updateLastLogin() {
    try {
      this.lastLogin = new Date();
      await database.query(`
        UPDATE users
        SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [this.id]);
    } catch (error) {
      logger.error('Error updating last login:', error);
      throw error;
    }
  }

  /**
   * Increment login attempts
   */
  async incrementLoginAttempts() {
    try {
      this.failedLoginAttempts += 1;

      // Lock account after 5 failed attempts for 30 minutes
      if (this.failedLoginAttempts >= 5) {
        this.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      }

      await database.query(`
        UPDATE users
        SET failed_login_attempts = $1, account_locked_until = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [this.failedLoginAttempts, this.accountLockedUntil, this.id]);
    } catch (error) {
      logger.error('Error incrementing login attempts:', error);
      throw error;
    }
  }

  /**
   * Reset login attempts
   */
  async resetLoginAttempts() {
    try {
      this.failedLoginAttempts = 0;
      this.accountLockedUntil = null;

      await database.query(`
        UPDATE users
        SET failed_login_attempts = 0, account_locked_until = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [this.id]);
    } catch (error) {
      logger.error('Error resetting login attempts:', error);
      throw error;
    }
  }

  /**
   * Check if account is locked
   */
  isAccountLocked() {
    return this.accountLockedUntil &&
           new Date(this.accountLockedUntil) > new Date();
  }

  /**
   * Convert to safe object (for API responses - removes sensitive data)
   */
  toSafeObject() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      isActive: this.isActive,
      lastLogin: this.lastLogin,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Get all users (admin only)
   */
  static async findAll(limit = 50, offset = 0) {
    try {
      const result = await database.query(`
        SELECT id, username, email, is_active, failed_login_attempts,
               account_locked_until, last_login, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);

      return result.rows.map(userData => new User(userData));
    } catch (error) {
      logger.error('Error finding all users:', error);
      throw error;
    }
  }

  /**
   * Get user count
   */
  static async getCount() {
    try {
      const result = await database.query('SELECT COUNT(*) as count FROM users');
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error getting user count:', error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async delete() {
    try {
      const result = await database.query('DELETE FROM users WHERE id = $1', [this.id]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Check if username exists
   */
  static async usernameExists(username, excludeId = null) {
    try {
      let query = 'SELECT COUNT(*) as count FROM users WHERE username = $1';
      let params = [username];

      if (excludeId) {
        query += ' AND id != $2';
        params.push(excludeId);
      }

      const result = await database.query(query, params);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      logger.error('Error checking username existence:', error);
      throw error;
    }
  }

  /**
   * Check if email exists
   */
  static async emailExists(email, excludeId = null) {
    try {
      let query = 'SELECT COUNT(*) as count FROM users WHERE email = $1';
      let params = [email];

      if (excludeId) {
        query += ' AND id != $2';
        params.push(excludeId);
      }

      const result = await database.query(query, params);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      logger.error('Error checking email existence:', error);
      throw error;
    }
  }
}

module.exports = User;

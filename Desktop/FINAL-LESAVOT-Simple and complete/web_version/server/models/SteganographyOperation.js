/**
 * Steganography Operation Model for PostgreSQL
 *
 * Handles steganography operations, file processing, and operation history
 */

const crypto = require('crypto');
const database = require('../utils/database');
const logger = require('../utils/logger');

class SteganographyOperation {
  constructor(operationData = {}) {
    this.id = operationData.id || null;
    this.userId = operationData.user_id || operationData.userId;
    this.operationType = operationData.operation_type || operationData.operationType; // 'embed', 'extract'
    this.status = operationData.status || 'pending'; // 'pending', 'processing', 'completed', 'failed'
    this.inputFilePath = operationData.input_file_path || operationData.inputFilePath;
    this.outputFilePath = operationData.output_file_path || operationData.outputFilePath;
    this.message = operationData.message || operationData.secretMessage; // For embed operations
    this.password = operationData.password;
    this.fileSize = operationData.file_size || operationData.fileSize;
    this.processingTimeMs = operationData.processing_time_ms || operationData.processingTimeMs;
    this.errorMessage = operationData.error_message || operationData.errorMessage;
    this.metadata = operationData.metadata || {};
    this.createdAt = operationData.created_at || operationData.createdAt || null;
    this.updatedAt = operationData.updated_at || operationData.updatedAt || null;
  }

  /**
   * Save operation to database
   */
  async save() {
    try {
      if (this.id) {
        // Update existing operation
        const result = await database.query(`
          UPDATE steganography_operations
          SET user_id = $1, operation_type = $2, status = $3,
              input_file_path = $4, output_file_path = $5, message = $6,
              password = $7, file_size = $8, processing_time_ms = $9,
              error_message = $10, metadata = $11, updated_at = CURRENT_TIMESTAMP
          WHERE id = $12
          RETURNING id, created_at, updated_at
        `, [
          this.userId, this.operationType, this.status,
          this.inputFilePath, this.outputFilePath, this.message,
          this.password, this.fileSize, this.processingTimeMs,
          this.errorMessage, JSON.stringify(this.metadata), this.id
        ]);

        if (result.rows.length > 0) {
          this.updatedAt = result.rows[0].updated_at;
          return true;
        }
        return false;
      } else {
        // Create new operation
        const result = await database.query(`
          INSERT INTO steganography_operations (
            user_id, operation_type, status, input_file_path, output_file_path,
            message, password, file_size, processing_time_ms,
            error_message, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id, created_at, updated_at
        `, [
          this.userId, this.operationType, this.status,
          this.inputFilePath, this.outputFilePath, this.message,
          this.password, this.fileSize, this.processingTimeMs,
          this.errorMessage, JSON.stringify(this.metadata)
        ]);

        if (result.rows.length > 0) {
          const operation = result.rows[0];
          this.id = operation.id;
          this.createdAt = operation.created_at;
          this.updatedAt = operation.updated_at;
          return true;
        }
        return false;
      }
    } catch (error) {
      logger.error('Error saving steganography operation:', error);
      throw error;
    }
  }

  /**
   * Find operation by ID
   */
  static async findById(id) {
    try {
      const result = await database.query(`
        SELECT id, user_id, operation_type, status, input_file_path, output_file_path,
               message, password, file_size, processing_time_ms, error_message,
               metadata, created_at, updated_at
        FROM steganography_operations
        WHERE id = $1
      `, [id]);

      if (result.rows.length > 0) {
        const data = result.rows[0];
        // Parse JSON fields - metadata is already parsed by PostgreSQL JSONB
        if (typeof data.metadata === 'string') {
          data.metadata = JSON.parse(data.metadata);
        } else if (!data.metadata) {
          data.metadata = {};
        }
        return new SteganographyOperation(data);
      }
      return null;
    } catch (error) {
      logger.error('Error finding operation by ID:', error);
      throw error;
    }
  }

  /**
   * Find operations by user ID
   */
  static async findByUserId(userId, limit = 50, offset = 0) {
    try {
      const result = await database.query(`
        SELECT id, user_id, operation_type, status, input_file_path, output_file_path,
               message, password, file_size, processing_time_ms, error_message,
               metadata, created_at, updated_at
        FROM steganography_operations
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `, [userId, limit, offset]);

      return result.rows.map(data => {
        // Parse JSON fields - metadata is already parsed by PostgreSQL JSONB
        if (typeof data.metadata === 'string') {
          data.metadata = JSON.parse(data.metadata);
        } else if (!data.metadata) {
          data.metadata = {};
        }
        return new SteganographyOperation(data);
      });
    } catch (error) {
      logger.error('Error finding operations by user ID:', error);
      throw error;
    }
  }

  /**
   * Find operations by status
   */
  static async findByStatus(status, limit = 100) {
    try {
      const result = await database.query(`
        SELECT id, user_id, operation_type, status, input_file_path, output_file_path,
               message, password, file_size, processing_time_ms, error_message,
               metadata, created_at, updated_at
        FROM steganography_operations
        WHERE status = $1
        ORDER BY created_at DESC
        LIMIT $2
      `, [status, limit]);

      return result.rows.map(data => {
        // Parse JSON fields - metadata is already parsed by PostgreSQL JSONB
        if (typeof data.metadata === 'string') {
          data.metadata = JSON.parse(data.metadata);
        } else if (!data.metadata) {
          data.metadata = {};
        }
        return new SteganographyOperation(data);
      });
    } catch (error) {
      logger.error('Error finding operations by status:', error);
      throw error;
    }
  }

  /**
   * Update operation status
   */
  async updateStatus(status, errorMessage = null) {
    try {
      this.status = status;

      if (errorMessage) {
        this.errorMessage = errorMessage;
      }

      if (status === 'completed' || status === 'failed') {
        if (this.createdAt) {
          this.processingTimeMs = Date.now() - new Date(this.createdAt).getTime();
        }
        // Store completion time in metadata
        this.metadata = { ...this.metadata, completedAt: new Date().toISOString() };
      }

      await this.save();
      return true;
    } catch (error) {
      logger.error('Error updating operation status:', error);
      throw error;
    }
  }

  /**
   * Set operation metadata
   */
  async setMetadata(metadata) {
    try {
      this.metadata = { ...this.metadata, ...metadata };
      await this.save();
      return true;
    } catch (error) {
      logger.error('Error setting operation metadata:', error);
      throw error;
    }
  }

  /**
   * Set extracted message (for extract operations)
   */
  async setExtractedMessage(message) {
    try {
      // Store extracted message in metadata
      this.metadata = { ...this.metadata, extractedMessage: message };
      await this.save();
      return true;
    } catch (error) {
      logger.error('Error setting extracted message:', error);
      throw error;
    }
  }

  /**
   * Set output file information
   */
  async setOutputFile(filePath, outputFileSize = null) {
    try {
      this.outputFilePath = filePath;
      if (outputFileSize !== null) {
        // Store output file size in metadata to preserve input file size
        this.metadata = { ...this.metadata, outputFileSize: outputFileSize };
      }
      await this.save();
      return true;
    } catch (error) {
      logger.error('Error setting output file:', error);
      throw error;
    }
  }

  /**
   * Get operation statistics for a user
   */
  static async getUserStats(userId) {
    try {
      const result = await database.query(`
        SELECT
          COUNT(*) as total_operations,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_operations,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_operations,
          COUNT(CASE WHEN operation_type = 'embed' THEN 1 END) as embed_operations,
          COUNT(CASE WHEN operation_type = 'extract' THEN 1 END) as extract_operations,
          AVG(processing_time_ms) as avg_processing_time_ms
        FROM steganography_operations
        WHERE user_id = $1
      `, [userId]);

      if (result.rows.length > 0) {
        const stats = result.rows[0];
        return {
          totalOperations: parseInt(stats.total_operations),
          completedOperations: parseInt(stats.completed_operations),
          failedOperations: parseInt(stats.failed_operations),
          embedOperations: parseInt(stats.embed_operations),
          extractOperations: parseInt(stats.extract_operations),
          avgProcessingTimeMs: parseFloat(stats.avg_processing_time_ms) || 0
        };
      }

      return {
        totalOperations: 0,
        completedOperations: 0,
        failedOperations: 0,
        embedOperations: 0,
        extractOperations: 0,
        avgProcessingTimeMs: 0
      };
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw error;
    }
  }

  /**
   * Get global operation statistics
   */
  static async getGlobalStats() {
    try {
      // Get general stats
      const generalResult = await database.query(`
        SELECT
          COUNT(*) as total_operations,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_operations,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_operations,
          COUNT(CASE WHEN operation_type = 'embed' THEN 1 END) as embed_operations,
          COUNT(CASE WHEN operation_type = 'extract' THEN 1 END) as extract_operations,
          AVG(processing_time_ms) as avg_processing_time_ms,
          SUM(file_size) as total_file_size_processed
        FROM steganography_operations
      `);

      const generalStats = generalResult.rows.length > 0 ? generalResult.rows[0] : {
        total_operations: 0,
        completed_operations: 0,
        failed_operations: 0,
        embed_operations: 0,
        extract_operations: 0,
        avg_processing_time_ms: 0,
        total_file_size_processed: 0
      };

      return {
        general: {
          totalOperations: parseInt(generalStats.total_operations),
          completedOperations: parseInt(generalStats.completed_operations),
          failedOperations: parseInt(generalStats.failed_operations),
          embedOperations: parseInt(generalStats.embed_operations),
          extractOperations: parseInt(generalStats.extract_operations),
          avgProcessingTimeMs: parseFloat(generalStats.avg_processing_time_ms) || 0,
          totalFileSizeProcessed: parseInt(generalStats.total_file_size_processed) || 0
        }
      };
    } catch (error) {
      logger.error('Error getting global stats:', error);
      throw error;
    }
  }

  /**
   * Delete operation
   */
  async delete() {
    try {
      const result = await database.query(`
        DELETE FROM steganography_operations
        WHERE id = $1
      `, [this.id]);

      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting operation:', error);
      throw error;
    }
  }

  /**
   * Clean up old operations (older than specified days)
   */
  static async cleanupOldOperations(daysOld = 30) {
    try {
      const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));

      const result = await database.query(`
        DELETE FROM steganography_operations
        WHERE created_at < $1
        AND status IN ('completed', 'failed')
      `, [cutoffDate]);

      logger.info(`Cleaned up ${result.rowCount} old operations`);
      return result.rowCount;
    } catch (error) {
      logger.error('Error cleaning up old operations:', error);
      throw error;
    }
  }

  /**
   * Convert to plain object
   */
  toObject() {
    return {
      id: this.id,
      userId: this.userId,
      operationType: this.operationType,
      status: this.status,
      inputFilePath: this.inputFilePath,
      outputFilePath: this.outputFilePath,
      message: this.message,
      password: this.password,
      fileSize: this.fileSize,
      processingTimeMs: this.processingTimeMs,
      errorMessage: this.errorMessage,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Convert to safe object (removes sensitive data)
   */
  toSafeObject() {
    const obj = this.toObject();
    // Remove sensitive information like secret messages and passwords
    if (obj.message) {
      obj.message = '[HIDDEN]';
    }
    if (obj.password) {
      obj.password = '[HIDDEN]';
    }
    return obj;
  }
}

module.exports = SteganographyOperation;

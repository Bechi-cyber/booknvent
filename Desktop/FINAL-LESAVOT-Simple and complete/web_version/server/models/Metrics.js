/**
 * Metrics Model for PostgreSQL
 *
 * Handles application metrics, analytics, and performance data
 */

const database = require('../utils/database');
const logger = require('../utils/logger');

class Metrics {
  constructor(metricsData = {}) {
    this.id = metricsData.id || null;
    this.userId = metricsData.user_id || metricsData.userId;
    this.metricType = metricsData.metric_type || metricsData.metricType;
    this.metricName = metricsData.metric_name || metricsData.metricName;
    this.metricValue = metricsData.metric_value || metricsData.metricValue;
    this.metadata = metricsData.metadata || {};
    this.timestamp = metricsData.timestamp || null;
  }

  /**
   * Save metrics to database
   */
  async save() {
    try {
      if (this.id) {
        // Update existing metric
        const result = await database.query(`
          UPDATE metrics
          SET user_id = $1, metric_type = $2, metric_name = $3,
              metric_value = $4, metadata = $5
          WHERE id = $6
          RETURNING id, timestamp
        `, [
          this.userId, this.metricType, this.metricName,
          this.metricValue, JSON.stringify(this.metadata), this.id
        ]);

        if (result.rows.length > 0) {
          this.timestamp = result.rows[0].timestamp;
          return true;
        }
        return false;
      } else {
        // Create new metric
        const result = await database.query(`
          INSERT INTO metrics (user_id, metric_type, metric_name, metric_value, metadata)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, timestamp
        `, [
          this.userId, this.metricType, this.metricName,
          this.metricValue, JSON.stringify(this.metadata)
        ]);

        if (result.rows.length > 0) {
          this.id = result.rows[0].id;
          this.timestamp = result.rows[0].timestamp;
          return true;
        }
        return false;
      }
    } catch (error) {
      logger.error('Error saving metrics:', error);
      throw error;
    }
  }

  /**
   * Record page view
   */
  static async recordPageView(userId, url, sessionId = null, ipAddress = null, userAgent = null, referrer = null) {
    try {
      const metric = new Metrics({
        userId,
        metricType: 'page_view',
        metricName: 'page_view',
        metricValue: 1,
        metadata: {
          url,
          sessionId,
          ipAddress,
          userAgent,
          referrer
        }
      });

      await metric.save();
      return metric;
    } catch (error) {
      logger.error('Error recording page view:', error);
      throw error;
    }
  }

  /**
   * Record user action
   */
  static async recordUserAction(userId, action, category = 'ui', data = {}, sessionId = null) {
    try {
      const metric = new Metrics({
        userId,
        metricType: 'user_action',
        metricName: action,
        metricValue: 1,
        metadata: {
          category,
          action,
          sessionId,
          ...data
        }
      });

      await metric.save();
      return metric;
    } catch (error) {
      logger.error('Error recording user action:', error);
      throw error;
    }
  }

  /**
   * Record operation metrics
   */
  static async recordOperation(userId, operationType, mediaType, duration, success = true, data = {}) {
    try {
      const metric = new Metrics({
        userId,
        metricType: 'operation',
        metricName: operationType,
        metricValue: duration,
        metadata: {
          category: 'steganography',
          operationType,
          mediaType,
          duration,
          success,
          ...data
        }
      });

      await metric.save();
      return metric;
    } catch (error) {
      logger.error('Error recording operation metrics:', error);
      throw error;
    }
  }

  /**
   * Record performance metrics
   */
  static async recordPerformance(category, action, duration, data = {}) {
    try {
      const metric = new Metrics({
        metricType: 'performance',
        metricName: action,
        metricValue: duration,
        metadata: {
          category,
          action,
          duration,
          ...data
        }
      });

      await metric.save();
      return metric;
    } catch (error) {
      logger.error('Error recording performance metrics:', error);
      throw error;
    }
  }

  /**
   * Record error metrics
   */
  static async recordError(error, userId = null, category = 'api', action = 'error', data = {}) {
    try {
      const metric = new Metrics({
        userId,
        metricType: 'error',
        metricName: action,
        metricValue: 1,
        metadata: {
          category,
          action,
          errorMessage: error.message,
          errorStack: error.stack,
          errorName: error.name,
          ...data
        }
      });

      await metric.save();
      return metric;
    } catch (err) {
      logger.error('Error recording error metrics:', err);
      throw err;
    }
  }

  /**
   * Get user activity metrics
   */
  static async getUserActivity(userId, startDate, endDate) {
    try {
      const result = await database.query(`
        SELECT
          DATE(timestamp) as date,
          metric_type,
          COUNT(*) as count
        FROM metrics
        WHERE user_id = $1
          AND timestamp >= $2
          AND timestamp <= $3
        GROUP BY DATE(timestamp), metric_type
        ORDER BY date ASC
      `, [userId, startDate, endDate]);

      return result.rows;
    } catch (error) {
      logger.error('Error getting user activity:', error);
      throw error;
    }
  }

  /**
   * Get operation statistics
   */
  static async getOperationStats(startDate, endDate) {
    try {
      const result = await database.query(`
        SELECT
          metric_name as operation_type,
          metadata->>'mediaType' as media_type,
          COUNT(*) as count,
          AVG(metric_value) as avg_duration,
          COUNT(CASE WHEN metadata->>'success' = 'true' THEN 1 END) as success_count
        FROM metrics
        WHERE metric_type = 'operation'
          AND timestamp >= $1
          AND timestamp <= $2
        GROUP BY metric_name, metadata->>'mediaType'
        ORDER BY count DESC
      `, [startDate, endDate]);

      return result.rows;
    } catch (error) {
      logger.error('Error getting operation stats:', error);
      throw error;
    }
  }

  /**
   * Get page view statistics
   */
  static async getPageViewStats(startDate, endDate) {
    try {
      const result = await database.query(`
        SELECT
          metadata->>'url' as url,
          COUNT(*) as views,
          COUNT(DISTINCT user_id) as unique_users
        FROM metrics
        WHERE metric_type = 'page_view'
          AND timestamp >= $1
          AND timestamp <= $2
          AND metadata->>'url' IS NOT NULL
        GROUP BY metadata->>'url'
        ORDER BY views DESC
      `, [startDate, endDate]);

      return result.rows;
    } catch (error) {
      logger.error('Error getting page view stats:', error);
      throw error;
    }
  }

  /**
   * Get error statistics
   */
  static async getErrorStats(startDate, endDate) {
    try {
      const result = await database.query(`
        SELECT
          metadata->>'category' as category,
          metadata->>'errorName' as error_name,
          COUNT(*) as count,
          MAX(timestamp) as last_occurrence
        FROM metrics
        WHERE metric_type = 'error'
          AND timestamp >= $1
          AND timestamp <= $2
        GROUP BY metadata->>'category', metadata->>'errorName'
        ORDER BY count DESC
      `, [startDate, endDate]);

      return result.rows;
    } catch (error) {
      logger.error('Error getting error stats:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  static async getPerformanceStats(category, startDate, endDate) {
    try {
      const result = await database.query(`
        SELECT
          metric_name as action,
          AVG(metric_value) as avg_duration,
          MIN(metric_value) as min_duration,
          MAX(metric_value) as max_duration,
          COUNT(*) as count
        FROM metrics
        WHERE metric_type = 'performance'
          AND metadata->>'category' = $1
          AND timestamp >= $2
          AND timestamp <= $3
        GROUP BY metric_name
        ORDER BY avg_duration DESC
      `, [category, startDate, endDate]);

      return result.rows;
    } catch (error) {
      logger.error('Error getting performance stats:', error);
      throw error;
    }
  }

  /**
   * Clean up old metrics (older than specified days)
   */
  static async cleanupOldMetrics(daysOld = 90) {
    try {
      const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));

      const result = await database.query(`
        DELETE FROM metrics
        WHERE timestamp < $1
      `, [cutoffDate]);

      logger.info(`Cleaned up ${result.rowCount} old metrics`);
      return result.rowCount;
    } catch (error) {
      logger.error('Error cleaning up old metrics:', error);
      throw error;
    }
  }

  /**
   * Find metrics by ID
   */
  static async findById(id) {
    try {
      const result = await database.query(`
        SELECT * FROM metrics WHERE id = $1
      `, [id]);

      if (result.rows.length > 0) {
        return new Metrics(result.rows[0]);
      }
      return null;
    } catch (error) {
      logger.error('Error finding metrics by ID:', error);
      throw error;
    }
  }

  /**
   * Find metrics by user ID
   */
  static async findByUserId(userId, limit = 100) {
    try {
      const result = await database.query(`
        SELECT * FROM metrics
        WHERE user_id = $1
        ORDER BY timestamp DESC
        LIMIT $2
      `, [userId, limit]);

      return result.rows.map(row => new Metrics(row));
    } catch (error) {
      logger.error('Error finding metrics by user ID:', error);
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
      metricType: this.metricType,
      metricName: this.metricName,
      metricValue: this.metricValue,
      metadata: this.metadata,
      timestamp: this.timestamp
    };
  }
}

module.exports = Metrics;

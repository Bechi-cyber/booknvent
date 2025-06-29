/**
 * PostgreSQL Database Connection and Utilities
 *
 * This module handles PostgreSQL connection, connection pooling,
 * and provides database utilities for the LESAVOT application.
 */

const { Pool } = require('pg');
const logger = require('./logger');

class Database {
  constructor() {
    this.pool = null;
    this.isConnected = false;

    // Database configuration from environment variables
    this.config = {
      connectionString: process.env.DATABASE_URL,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
    };

    if (!this.config.connectionString && (!this.config.host || !this.config.database)) {
      throw new Error('DATABASE_URL or individual database connection parameters are required');
    }
  }

  /**
   * Connect to PostgreSQL
   */
  async connect() {
    try {
      if (this.isConnected) {
        logger.info('Database already connected');
        return this.pool;
      }

      logger.info('Connecting to PostgreSQL...');

      // Create connection pool
      this.pool = new Pool(this.config);

      // Test the connection
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
      client.release();

      this.isConnected = true;
      logger.info(`Successfully connected to PostgreSQL database: ${this.config.database}`);
      logger.info(`Connection test - Time: ${result.rows[0].current_time}`);
      logger.info(`PostgreSQL version: ${result.rows[0].pg_version.split(' ')[0]}`);

      // Initialize database schema
      await this.initializeSchema();

      return this.pool;
    } catch (error) {
      logger.error('Failed to connect to PostgreSQL:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Initialize database schema and create tables
   */
  async initializeSchema() {
    try {
      logger.info('Initializing PostgreSQL schema...');

      const client = await this.pool.connect();

      try {
        // Begin transaction
        await client.query('BEGIN');

        // Users table
        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            salt VARCHAR(255) NOT NULL,
            is_active BOOLEAN DEFAULT true,
            failed_login_attempts INTEGER DEFAULT 0,
            account_locked_until TIMESTAMP,
            last_login TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Sessions table (for OTP and authentication)
        await client.query(`
          CREATE TABLE IF NOT EXISTS sessions (
            id SERIAL PRIMARY KEY,
            session_id VARCHAR(255) UNIQUE NOT NULL,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            username VARCHAR(50) NOT NULL,
            session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('otp', 'auth')),
            otp_code VARCHAR(10),
            is_verified BOOLEAN DEFAULT false,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Steganography operations table
        await client.query(`
          CREATE TABLE IF NOT EXISTS steganography_operations (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            operation_type VARCHAR(20) NOT NULL CHECK (operation_type IN ('embed', 'extract')),
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
            input_file_path VARCHAR(500),
            output_file_path VARCHAR(500),
            message TEXT,
            password VARCHAR(255),
            file_size BIGINT,
            processing_time_ms INTEGER,
            error_message TEXT,
            metadata JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Metrics table
        await client.query(`
          CREATE TABLE IF NOT EXISTS metrics (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            metric_type VARCHAR(50) NOT NULL,
            metric_name VARCHAR(100) NOT NULL,
            metric_value NUMERIC,
            metadata JSONB,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Files table (for storing file metadata)
        await client.query(`
          CREATE TABLE IF NOT EXISTS files (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            filename VARCHAR(255) NOT NULL,
            original_name VARCHAR(255) NOT NULL,
            file_path VARCHAR(500) NOT NULL,
            file_size BIGINT NOT NULL,
            file_hash VARCHAR(64) NOT NULL,
            mime_type VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create indexes for better performance
        await client.query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)');

        await client.query('CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id)');

        await client.query('CREATE INDEX IF NOT EXISTS idx_stego_user_id ON steganography_operations(user_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_stego_created_at ON steganography_operations(created_at)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_stego_operation_type ON steganography_operations(operation_type)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_stego_status ON steganography_operations(status)');

        await client.query('CREATE INDEX IF NOT EXISTS idx_metrics_user_id ON metrics(user_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_metrics_type ON metrics(metric_type)');

        await client.query('CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_files_hash ON files(file_hash)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at)');

        // Commit transaction
        await client.query('COMMIT');

        logger.info('PostgreSQL schema and indexes initialized successfully');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }

      client.release();
    } catch (error) {
      logger.error('Failed to initialize schema:', error);
      throw error;
    }
  }

  /**
   * Execute a query with parameters
   */
  async query(text, params = []) {
    if (!this.isConnected || !this.pool) {
      throw new Error('Database not connected');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  /**
   * Get a database client from the pool
   */
  async getClient() {
    if (!this.isConnected || !this.pool) {
      throw new Error('Database not connected');
    }
    return await this.pool.connect();
  }

  /**
   * Close database connection
   */
  async close() {
    try {
      if (this.pool && this.isConnected) {
        await this.pool.end();
        this.isConnected = false;
        this.pool = null;
        logger.info('PostgreSQL connection pool closed');
      }
    } catch (error) {
      logger.error('Error closing PostgreSQL connection:', error);
      throw error;
    }
  }

  /**
   * Check if database is connected
   */
  isConnectedToDatabase() {
    return this.isConnected && this.pool;
  }

  /**
   * Get database statistics
   */
  async getStats() {
    try {
      if (!this.isConnectedToDatabase()) {
        throw new Error('Database not connected');
      }

      const client = await this.pool.connect();
      try {
        // Get database size
        const dbSizeResult = await client.query(`
          SELECT pg_size_pretty(pg_database_size($1)) as database_size
        `, [this.config.database]);

        // Get table information
        const tablesResult = await client.query(`
          SELECT
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
            pg_stat_get_tuples_returned(c.oid) as rows_read,
            pg_stat_get_tuples_inserted(c.oid) as rows_inserted
          FROM pg_tables pt
          JOIN pg_class c ON c.relname = pt.tablename
          WHERE schemaname = 'public'
          ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        `);

        // Get connection info
        const connectionResult = await client.query(`
          SELECT
            count(*) as total_connections,
            count(*) FILTER (WHERE state = 'active') as active_connections,
            count(*) FILTER (WHERE state = 'idle') as idle_connections
          FROM pg_stat_activity
          WHERE datname = $1
        `, [this.config.database]);

        return {
          database: this.config.database,
          database_size: dbSizeResult.rows[0].database_size,
          tables: tablesResult.rows,
          connections: connectionResult.rows[0],
          pool_stats: {
            total_count: this.pool.totalCount,
            idle_count: this.pool.idleCount,
            waiting_count: this.pool.waitingCount
          }
        };
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error getting database stats:', error);
      throw error;
    }
  }
}

// Create singleton instance
const database = new Database();

module.exports = database;

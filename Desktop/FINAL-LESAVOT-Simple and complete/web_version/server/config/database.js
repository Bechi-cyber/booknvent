/**
 * PostgreSQL Database Configuration
 * 
 * This module exports the PostgreSQL connection pool for use throughout the application.
 */

const { Pool } = require('pg');
const logger = require('../utils/logger');

// Database configuration from environment variables
const config = {
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 20000, // Increased timeout to 20 seconds
  query_timeout: 30000, // Query timeout
  statement_timeout: 30000, // Statement timeout
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

// Validate configuration
if (!config.connectionString && (!config.host || !config.database)) {
  throw new Error('DATABASE_URL or individual database connection parameters are required');
}

// Create and export the connection pool
const pool = new Pool(config);

// Handle pool errors
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
});

// Handle pool connection events
pool.on('connect', (client) => {
  logger.debug('New client connected to PostgreSQL pool');
});

// Handle pool removal events
pool.on('remove', (client) => {
  logger.debug('Client removed from PostgreSQL pool');
});

// Test connection on startup with retry logic
async function testConnection(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      logger.info('PostgreSQL connection pool initialized successfully');
      return true;
    } catch (err) {
      logger.warn(`Connection attempt ${i + 1}/${retries} failed:`, err.message);
      if (i === retries - 1) {
        logger.error('Failed to initialize PostgreSQL connection pool after all retries:', err);
        return false;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// Test connection on startup
testConnection();

module.exports = pool;

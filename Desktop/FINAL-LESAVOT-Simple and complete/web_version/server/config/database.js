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
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
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

// Test connection on startup
pool.connect()
  .then(client => {
    logger.info('PostgreSQL connection pool initialized successfully');
    client.release();
  })
  .catch(err => {
    logger.error('Failed to initialize PostgreSQL connection pool:', err);
  });

module.exports = pool;

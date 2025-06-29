/**
 * Logger Utility
 * 
 * This module provides a centralized logging system with different log levels,
 * file rotation, and formatting options.
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Define format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.json(),
);

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || level(),
  levels,
  format: fileFormat,
  defaultMeta: { service: 'lesavot-api' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // All logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exitOnError: false,
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    }),
  );
}

// Create a stream object for Morgan HTTP logger
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Create named loggers for different components
winston.loggers.add('database', {
  level: process.env.LOG_LEVEL || level(),
  levels,
  format: fileFormat,
  defaultMeta: { service: 'database' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'database-error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'database.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

winston.loggers.add('auth', {
  level: process.env.LOG_LEVEL || level(),
  levels,
  format: fileFormat,
  defaultMeta: { service: 'auth' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'auth-error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'auth.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

winston.loggers.add('steganography', {
  level: process.env.LOG_LEVEL || level(),
  levels,
  format: fileFormat,
  defaultMeta: { service: 'steganography' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'steganography-error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'steganography.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport to all loggers in development
if (process.env.NODE_ENV !== 'production') {
  Object.keys(winston.loggers.loggers).forEach(key => {
    winston.loggers.get(key).add(
      new winston.transports.Console({
        format: consoleFormat,
      }),
    );
  });
}

module.exports = logger;

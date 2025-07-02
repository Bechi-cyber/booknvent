/**
 * LESAVOT API Server
 *
 * This is the main server file for the LESAVOT Steganography Platform API.
 * It handles authentication, database operations, and provides a secure
 * interface for the frontend to interact with the database.
 */

// Load environment variables
require('dotenv').config();

// Import dependencies
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

// Import utilities
const logger = require('./utils/logger');
const database = require('./utils/database');
const { AppError } = require('./utils/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const stegoRoutes = require('./routes/steganography');
const metricsRoutes = require('./routes/metrics');

// Create Express app
const app = express();

// Configure rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // Default: 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Default: 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.'
  }
});

// Configure CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS ?
  process.env.ALLOWED_ORIGINS.split(',') :
  ['https://lasavot.onrender.com', 'http://localhost:3000', 'http://127.0.0.1:3000'];
const allowedMethods = process.env.ALLOWED_METHODS ? process.env.ALLOWED_METHODS.split(',') : ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
const allowedHeaders = process.env.ALLOWED_HEADERS ? process.env.ALLOWED_HEADERS.split(',') : ['Content-Type', 'Authorization'];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new AppError('Not allowed by CORS', 403));
    }
  },
  methods: allowedMethods,
  allowedHeaders: allowedHeaders,
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Configure Helmet for security headers
const helmetOptions = {
  contentSecurityPolicy: process.env.ENABLE_CONTENT_SECURITY_POLICY === 'true' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  } : false,
  xssFilter: process.env.ENABLE_XSS_PROTECTION === 'true',
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'same-origin' }
};

// Middleware
if (process.env.ENABLE_HELMET === 'true') {
  app.use(helmet(helmetOptions));
}
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());
app.use(morgan('combined', { stream: logger.stream }));
app.use('/api', limiter);

// API version prefix
const API_VERSION = process.env.API_VERSION || 'v1';
const API_PREFIX = `/api/${API_VERSION}`;

// Initialize database connection
async function initializeDatabase() {
  try {
    await database.connect();
    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// Request logging middleware
if (process.env.ENABLE_REQUEST_LOGGING === 'true') {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    next();
  });
}

// Performance monitoring middleware
if (process.env.ENABLE_PERFORMANCE_MONITORING === 'true') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (duration > 1000) { // Log requests that take more than 1 second
        logger.warn(`Slow request: ${req.method} ${req.originalUrl} took ${duration}ms`);
      }
    });
    next();
  });
}

// Routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/steganography`, stegoRoutes);
app.use(`${API_PREFIX}/metrics`, metricsRoutes);

// Legacy routes for backward compatibility
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/steganography', stegoRoutes);
app.use('/api/metrics', metricsRoutes);

// Health check endpoint with database status
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = database.isConnectedToDatabase() ? 'connected' : 'disconnected';
    let dbStats = null;

    if (database.isConnectedToDatabase()) {
      try {
        dbStats = await database.getStats();
      } catch (error) {
        logger.warn('Could not get database stats:', error.message);
      }
    }

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: API_VERSION,
      environment: process.env.NODE_ENV,
      database: {
        status: dbStatus,
        stats: dbStats
      }
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      version: API_VERSION,
      environment: process.env.NODE_ENV,
      database: {
        status: 'error',
        error: error.message
      }
    });
  }
});

// ECDH Key Exchange endpoint (browser compatible, P-256)
const crypto = require('crypto');

app.post(`${API_PREFIX}/key-exchange`, (req, res) => {
  // Step 1: Generate a new ECDH key pair for each request (P-256)
  const serverECDH = crypto.createECDH('prime256v1'); // P-256
  serverECDH.generateKeys();

  // Step 2: If clientPublicKey is provided, compute shared secret and derive key
  const { clientPublicKey } = req.body;
  if (clientPublicKey) {
    try {
      const clientKeyBuffer = Buffer.from(clientPublicKey, 'base64');
      const sharedSecret = serverECDH.computeSecret(clientKeyBuffer);
      // Derive a key from the shared secret using HKDF (SHA-256)
      const derivedKey = crypto.createHmac('sha256', Buffer.alloc(0)).update(sharedSecret).digest('base64');
      return res.json({
        status: 'success',
        serverPublicKey: serverECDH.getPublicKey('base64'),
        derivedKey
      });
    } catch (err) {
      return res.status(400).json({ status: 'error', message: 'Invalid client public key' });
    }
  }

  // Step 3: Return server public key (P-256)
  res.json({
    status: 'success',
    serverPublicKey: serverECDH.getPublicKey('base64')
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  // Log error details
  if (process.env.LOG_ERRORS === 'true') {
    logger.error(`${err.name}: ${err.message}`, {
      stack: process.env.SHOW_STACK_TRACES === 'true' ? err.stack : undefined,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Determine message (hide internal errors in production)
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error'
    : err.message;

  // Send error response
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Create server
let server;

// Use HTTPS in production if certificates are available
if (process.env.NODE_ENV === 'production' &&
    fs.existsSync(path.join(__dirname, 'ssl/private-key.pem')) &&
    fs.existsSync(path.join(__dirname, 'ssl/certificate.pem'))) {

  const privateKey = fs.readFileSync(path.join(__dirname, 'ssl/private-key.pem'), 'utf8');
  const certificate = fs.readFileSync(path.join(__dirname, 'ssl/certificate.pem'), 'utf8');

  const credentials = { key: privateKey, cert: certificate };
  server = https.createServer(credentials, app);

  logger.info('HTTPS server created with SSL certificates');
} else {
  server = http.createServer(app);

  if (process.env.NODE_ENV === 'production') {
    logger.warn('Running in production without HTTPS. This is not recommended.');
  } else {
    logger.info('HTTP server created for development');
  }
}

// Start server with database initialization
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Initialize database first
    await initializeDatabase();

    // Start the server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      logger.info(`API version: ${API_VERSION}`);
      logger.info('Database connection established');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');

  // Close server
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Close database connection
  await database.close();

  // Exit with success code
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');

  // Close server
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Close database connection
  await database.close();

  // Exit with success code
  process.exit(0);
});

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);

  // Exit with error code
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);

  // Exit with error code
  process.exit(1);
});

module.exports = app;

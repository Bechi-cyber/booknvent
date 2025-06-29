/**
 * Metrics Routes
 * 
 * This module defines the routes for metrics collection and reporting.
 */

const express = require('express');
const metricsController = require('../controllers/metricsController');
const { protect, restrictTo } = require('../middleware/auth');
const { apiKeyLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Public routes with rate limiting
router.post('/performance', apiKeyLimiter, metricsController.recordPerformanceMetrics);
router.post('/error', apiKeyLimiter, metricsController.recordErrorMetrics);

// Protected routes (admin only)
router.use(protect);
router.use(restrictTo('admin'));
router.get('/performance', metricsController.getPerformanceMetrics);
router.get('/error', metricsController.getErrorMetrics);

module.exports = router;

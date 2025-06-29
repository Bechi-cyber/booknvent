/**
 * Metrics Controller (Supabase logic removed)
 *
 * This controller previously handled metrics collection and reporting using Supabase.
 * All Supabase-specific logic has been removed for database-agnostic refactoring.
 */

const { AppError, catchAsync } = require('../utils/errorHandler');

// Placeholder: Record performance metrics
exports.recordPerformanceMetrics = catchAsync(async (req, res, next) => {
  return next(new AppError('Record performance metrics not implemented. Database logic required.', 501));
});

// Placeholder: Record error metrics
exports.recordErrorMetrics = catchAsync(async (req, res, next) => {
  return next(new AppError('Record error metrics not implemented. Database logic required.', 501));
});

// Placeholder: Get performance metrics (admin only)
exports.getPerformanceMetrics = catchAsync(async (req, res, next) => {
  return next(new AppError('Get performance metrics not implemented. Database logic required.', 501));
});

// Placeholder: Get error metrics (admin only)
exports.getErrorMetrics = catchAsync(async (req, res, next) => {
  return next(new AppError('Get error metrics not implemented. Database logic required.', 501));
});

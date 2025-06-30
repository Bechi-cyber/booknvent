/**
 * Metrics Controller
 * 
 * This controller handles metrics collection and reporting.
 */

const { catchAsync, handleSupabaseError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Record performance metrics
 */
exports.recordPerformanceMetrics = catchAsync(async (req, res, next) => {
  const { pageLoadTime, domReadyTime, url, timestamp, userAgent } = req.body;
  
  // Validate input
  if (!pageLoadTime || !url) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields'
    });
  }
  
  try {
    // Get user ID if authenticated
    let userId = null;
    if (req.user) {
      userId = req.user.user_id;
    }
    
    // Record metrics in database
    const { error } = await req.supabase
      .from('performance_metrics')
      .insert([
        {
          user_id: userId,
          page_url: url,
          page_load_time: pageLoadTime,
          dom_ready_time: domReadyTime || null,
          user_agent: userAgent || null,
          timestamp: timestamp || new Date().toISOString(),
          ip_address: req.ip
        }
      ]);
    
    if (error) {
      throw handleSupabaseError(error, 'Failed to record performance metrics');
    }
    
    // Log metrics
    logger.info('Performance metrics recorded', {
      url,
      pageLoadTime,
      domReadyTime,
      userId: userId || 'anonymous'
    });
    
    // Return success
    return res.status(201).json({
      status: 'success',
      message: 'Performance metrics recorded'
    });
  } catch (error) {
    // Log error but don't fail the request
    logger.error('Error recording performance metrics:', error);
    
    // Still return success to client
    return res.status(201).json({
      status: 'success',
      message: 'Performance metrics received'
    });
  }
});

/**
 * Record error metrics
 */
exports.recordErrorMetrics = catchAsync(async (req, res, next) => {
  const { errorType, errorMessage, stackTrace, url, timestamp, userAgent } = req.body;
  
  // Validate input
  if (!errorType || !errorMessage || !url) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields'
    });
  }
  
  try {
    // Get user ID if authenticated
    let userId = null;
    if (req.user) {
      userId = req.user.user_id;
    }
    
    // Record error in database
    const { error } = await req.supabase
      .from('error_metrics')
      .insert([
        {
          user_id: userId,
          page_url: url,
          error_type: errorType,
          error_message: errorMessage,
          stack_trace: stackTrace || null,
          user_agent: userAgent || null,
          timestamp: timestamp || new Date().toISOString(),
          ip_address: req.ip
        }
      ]);
    
    if (error) {
      throw handleSupabaseError(error, 'Failed to record error metrics');
    }
    
    // Log error
    logger.warn('Client error recorded', {
      url,
      errorType,
      errorMessage,
      userId: userId || 'anonymous'
    });
    
    // Return success
    return res.status(201).json({
      status: 'success',
      message: 'Error metrics recorded'
    });
  } catch (error) {
    // Log error but don't fail the request
    logger.error('Error recording error metrics:', error);
    
    // Still return success to client
    return res.status(201).json({
      status: 'success',
      message: 'Error metrics received'
    });
  }
});

/**
 * Get performance metrics (admin only)
 */
exports.getPerformanceMetrics = catchAsync(async (req, res, next) => {
  // Check if user is admin
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Unauthorized'
    });
  }
  
  // Parse query parameters
  const { page = 1, limit = 20, startDate, endDate, url } = req.query;
  const offset = (page - 1) * limit;
  
  // Build query
  let query = req.supabase
    .from('performance_metrics')
    .select('*', { count: 'exact' });
  
  // Apply filters
  if (startDate) {
    query = query.gte('timestamp', startDate);
  }
  
  if (endDate) {
    query = query.lte('timestamp', endDate);
  }
  
  if (url) {
    query = query.ilike('page_url', `%${url}%`);
  }
  
  // Apply pagination
  query = query.range(offset, offset + limit - 1).order('timestamp', { ascending: false });
  
  // Execute query
  const { data, error, count } = await query;
  
  if (error) {
    throw handleSupabaseError(error, 'Failed to get performance metrics');
  }
  
  // Return metrics
  return res.status(200).json({
    status: 'success',
    results: data.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / limit)
    },
    data: {
      metrics: data
    }
  });
});

/**
 * Get error metrics (admin only)
 */
exports.getErrorMetrics = catchAsync(async (req, res, next) => {
  // Check if user is admin
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Unauthorized'
    });
  }
  
  // Parse query parameters
  const { page = 1, limit = 20, startDate, endDate, errorType } = req.query;
  const offset = (page - 1) * limit;
  
  // Build query
  let query = req.supabase
    .from('error_metrics')
    .select('*', { count: 'exact' });
  
  // Apply filters
  if (startDate) {
    query = query.gte('timestamp', startDate);
  }
  
  if (endDate) {
    query = query.lte('timestamp', endDate);
  }
  
  if (errorType) {
    query = query.eq('error_type', errorType);
  }
  
  // Apply pagination
  query = query.range(offset, offset + limit - 1).order('timestamp', { ascending: false });
  
  // Execute query
  const { data, error, count } = await query;
  
  if (error) {
    throw handleSupabaseError(error, 'Failed to get error metrics');
  }
  
  // Return metrics
  return res.status(200).json({
    status: 'success',
    results: data.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / limit)
    },
    data: {
      metrics: data
    }
  });
});

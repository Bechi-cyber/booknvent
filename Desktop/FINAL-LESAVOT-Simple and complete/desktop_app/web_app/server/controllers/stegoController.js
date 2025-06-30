/**
 * Steganography Controller
 * 
 * This controller handles steganography-related operations like saving
 * steganography history, retrieving history, etc.
 */

const { AppError, catchAsync } = require('../utils/errorHandler');

/**
 * Save steganography operation to history
 */
exports.saveOperation = catchAsync(async (req, res, next) => {
  const { type, mode, hasPassword, metadata } = req.body;
  const userId = req.user.user_id;

  // Validate input
  if (!type || !mode) {
    return next(new AppError('Please provide type and mode', 400));
  }

  // Valid types: text, image, audio
  const validTypes = ['text', 'image', 'audio'];
  if (!validTypes.includes(type)) {
    return next(new AppError('Invalid type. Must be one of: text, image, audio', 400));
  }

  // Valid modes: encrypt, decrypt
  const validModes = ['encrypt', 'decrypt'];
  if (!validModes.includes(mode)) {
    return next(new AppError('Invalid mode. Must be one of: encrypt, decrypt', 400));
  }

  // Create steganography history entry
  const { data: operation, error } = await req.supabase
    .from('stego_history')
    .insert([
      {
        user_id: userId,
        type,
        mode,
        has_password: hasPassword || false,
        metadata: metadata || {},
        created_at: new Date().toISOString()
      }
    ])
    .select()
    .single();

  if (error) {
    req.logger.error('Error saving steganography operation:', error);
    return next(new AppError('Error saving operation to history', 500));
  }

  res.status(201).json({
    status: 'success',
    data: {
      operation
    }
  });
});

/**
 * Get steganography history for current user
 */
exports.getHistory = catchAsync(async (req, res, next) => {
  const userId = req.user.user_id;
  const { type, limit = 10, page = 1 } = req.query;

  // Calculate offset for pagination
  const offset = (page - 1) * limit;

  // Build query
  let query = req.supabase
    .from('stego_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Filter by type if provided
  if (type) {
    query = query.eq('type', type);
  }

  // Execute query
  const { data: history, error, count } = await query;

  if (error) {
    req.logger.error('Error fetching steganography history:', error);
    return next(new AppError('Error fetching history', 500));
  }

  // Get total count for pagination
  const { count: totalCount, error: countError } = await req.supabase
    .from('stego_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) {
    req.logger.error('Error counting steganography history:', countError);
  }

  res.status(200).json({
    status: 'success',
    results: history.length,
    pagination: {
      total: totalCount || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: totalCount ? Math.ceil(totalCount / limit) : 0
    },
    data: {
      history
    }
  });
});

/**
 * Delete steganography history entry
 */
exports.deleteHistoryEntry = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.user_id;

  // Check if entry exists and belongs to user
  const { data: entry, error: checkError } = await req.supabase
    .from('stego_history')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (checkError || !entry) {
    return next(new AppError('History entry not found or does not belong to you', 404));
  }

  // Delete entry
  const { error } = await req.supabase
    .from('stego_history')
    .delete()
    .eq('id', id);

  if (error) {
    req.logger.error('Error deleting steganography history entry:', error);
    return next(new AppError('Error deleting history entry', 500));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

/**
 * Clear all steganography history for current user
 */
exports.clearHistory = catchAsync(async (req, res, next) => {
  const userId = req.user.user_id;

  const { error } = await req.supabase
    .from('stego_history')
    .delete()
    .eq('user_id', userId);

  if (error) {
    req.logger.error('Error clearing steganography history:', error);
    return next(new AppError('Error clearing history', 500));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

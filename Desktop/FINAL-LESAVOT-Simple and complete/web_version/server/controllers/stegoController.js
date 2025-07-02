/**
 * Steganography Controller - PostgreSQL Implementation
 *
 * This controller handles steganography-related operations using PostgreSQL.
 */

const { AppError, catchAsync } = require('../utils/errorHandler');
const database = require('../utils/database');
const logger = require('../utils/logger');

// Save steganography operation to history
exports.saveOperation = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { type, mode, hasPassword, metadata } = req.body;

  // Validate required fields
  if (!type || !mode) {
    return next(new AppError('Type and mode are required', 400));
  }

  // Validate type and mode values
  const validTypes = ['text', 'image', 'audio'];
  const validModes = ['encrypt', 'decrypt'];

  if (!validTypes.includes(type)) {
    return next(new AppError('Invalid type. Must be text, image, or audio', 400));
  }

  if (!validModes.includes(mode)) {
    return next(new AppError('Invalid mode. Must be encrypt or decrypt', 400));
  }

  try {
    // Insert into stego_history table for compatibility
    const query = `
      INSERT INTO stego_history (user_id, type, mode, has_password, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, type, mode, has_password, metadata, created_at
    `;

    const values = [
      userId,
      type,
      mode,
      hasPassword || false,
      metadata || {}
    ];

    const result = await database.query(query, values);
    const operation = result.rows[0];

    logger.info(`Steganography operation saved: ${operation.id} for user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Operation saved to history successfully',
      data: {
        operation
      }
    });
  } catch (error) {
    logger.error('Error saving steganography operation:', error);
    return next(new AppError('Error saving operation to history', 500));
  }
});

// Get steganography history for current user
exports.getHistory = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { type, limit = 10, page = 1 } = req.query;

  // Calculate offset for pagination
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT id, user_id, type, mode, has_password, metadata, created_at
      FROM stego_history
      WHERE user_id = $1
    `;
    let values = [userId];
    let paramCount = 1;

    // Filter by type if provided
    if (type && ['text', 'image', 'audio'].includes(type)) {
      paramCount++;
      query += ` AND type = $${paramCount}`;
      values.push(type);
    }

    // Add ordering and pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(parseInt(limit), offset);

    const result = await database.query(query, values);
    const history = result.rows;

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) FROM stego_history WHERE user_id = $1`;
    let countValues = [userId];

    if (type && ['text', 'image', 'audio'].includes(type)) {
      countQuery += ` AND type = $2`;
      countValues.push(type);
    }

    const countResult = await database.query(countQuery, countValues);
    const totalCount = parseInt(countResult.rows[0].count);

    logger.info(`Retrieved ${history.length} history entries for user ${userId}`);

    res.status(200).json({
      success: true,
      data: {
        history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching steganography history:', error);
    return next(new AppError('Error fetching history', 500));
  }
});

// Delete steganography history entry
exports.deleteHistoryEntry = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;

  if (!id) {
    return next(new AppError('History entry ID is required', 400));
  }

  try {
    const query = `
      DELETE FROM stego_history
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

    const result = await database.query(query, [id, userId]);

    if (result.rows.length === 0) {
      return next(new AppError('History entry not found or unauthorized', 404));
    }

    logger.info(`Deleted history entry ${id} for user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'History entry deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting history entry:', error);
    return next(new AppError('Error deleting history entry', 500));
  }
});

// Clear all steganography history for current user
exports.clearHistory = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  try {
    const query = `
      DELETE FROM stego_history
      WHERE user_id = $1
    `;

    const result = await database.query(query, [userId]);
    const deletedCount = result.rowCount;

    logger.info(`Cleared ${deletedCount} history entries for user ${userId}`);

    res.status(200).json({
      success: true,
      message: `Successfully cleared ${deletedCount} history entries`
    });
  } catch (error) {
    logger.error('Error clearing history:', error);
    return next(new AppError('Error clearing history', 500));
  }
});

/**
 * User Controller
 * 
 * This controller handles user-related operations like getting user profile,
 * updating user profile, etc.
 */

const { AppError, catchAsync } = require('../utils/errorHandler');

/**
 * Get all users (admin only)
 */
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const { data: users, error } = await req.supabase
    .from('user_profiles')
    .select('*');

  if (error) {
    return next(new AppError('Error fetching users', 500));
  }

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});

/**
 * Get user by ID
 */
exports.getUserById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const { data: user, error } = await req.supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', id)
    .single();

  if (error || !user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

/**
 * Update user profile
 */
exports.updateProfile = catchAsync(async (req, res, next) => {
  const { fullName, username } = req.body;
  const userId = req.user.user_id;

  // Check if username is already taken
  if (username && username !== req.user.username) {
    const { data: existingUser, error: checkError } = await req.supabase
      .from('user_profiles')
      .select('username')
      .eq('username', username)
      .neq('user_id', userId)
      .single();

    if (existingUser) {
      return next(new AppError('Username is already taken', 400));
    }
  }

  // Update user metadata in auth
  const { error: updateError } = await req.supabase.auth.updateUser({
    data: {
      full_name: fullName || req.user.full_name
    }
  });

  if (updateError) {
    return next(new AppError(updateError.message, 400));
  }

  // Update user profile in custom table
  const updateData = {};
  if (fullName) updateData.full_name = fullName;
  if (username) updateData.username = username;
  updateData.updated_at = new Date().toISOString();

  const { data: updatedUser, error: profileError } = await req.supabase
    .from('user_profiles')
    .update(updateData)
    .eq('user_id', userId)
    .select()
    .single();

  if (profileError) {
    return next(new AppError('Error updating user profile', 500));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

/**
 * Delete user account
 */
exports.deleteAccount = catchAsync(async (req, res, next) => {
  const userId = req.user.user_id;

  // Delete user from auth
  const { error: authError } = await req.supabase.auth.admin.deleteUser(userId);

  if (authError) {
    return next(new AppError('Error deleting user account', 500));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

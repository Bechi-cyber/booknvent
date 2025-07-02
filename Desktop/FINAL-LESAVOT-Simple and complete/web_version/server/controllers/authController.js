/**
 * Authentication Controller with Email OTP and PostgreSQL
 *
 * Implements a two-step login: (1) username/password, (2) OTP sent to email.
 * Uses PostgreSQL for user storage and session management.
 */

const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { AppError, ValidationError, AuthenticationError, NotFoundError, ConflictError, catchAsync } = require('../utils/errorHandler');
const { generateToken, generateRefreshToken, verifyToken, verifyRefreshToken } = require('../utils/jwt');
const User = require('../models/User');
const Session = require('../models/Session');
const Metrics = require('../models/Metrics');
const logger = require('../utils/logger');

// Configure nodemailer with error handling and fallback options
let transporter = null;
let emailConfigured = false;

try {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    // Primary email configuration
    const emailConfig = {
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    };

    // Alternative SMTP configuration for custom servers
    if (process.env.SMTP_HOST) {
      emailConfig.host = process.env.SMTP_HOST;
      emailConfig.port = parseInt(process.env.SMTP_PORT) || 587;
      emailConfig.secure = process.env.SMTP_SECURE === 'true';
      delete emailConfig.service; // Remove service when using custom SMTP
    }

    transporter = nodemailer.createTransport(emailConfig);
    emailConfigured = true;
    logger.info('Email transporter configured successfully');
  } else {
    logger.warn('Email transporter configuration: EMAIL_USER and EMAIL_PASSWORD not set - OTP emails will be logged instead');
  }
} catch (error) {
  logger.error('Failed to create email transporter:', error);
  emailConfigured = false;
}

// Generate OTP
function generateOTP(length = 6) {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

// Verify email configuration on startup
if (transporter) {
  transporter.verify((error, success) => {
    if (error) {
      logger.warn('Email transporter configuration error:', error.message);
    } else {
      logger.info('Email transporter ready for sending emails');
    }
  });
}

// Step 1: Login with username/password, send OTP
exports.login = catchAsync(async (req, res, next) => {
  const { username, password, resendOtp } = req.body;

  // Validate input - for resend OTP, we only need username
  if (!username || (!password && !resendOtp)) {
    return next(new AppError('Username and password are required', 400));
  }

  // Find user in database
  const user = await User.findByUsername(username);
  if (!user) {
    await Metrics.recordError(new Error('Login attempt with invalid username'), null, 'auth', 'login_failed');
    return next(new AppError('Invalid username or password', 401));
  }

  // Check if account is locked
  if (user.isAccountLocked()) {
    await Metrics.recordError(new Error('Login attempt on locked account'), user.id, 'auth', 'account_locked');
    return next(new AppError('Account is temporarily locked due to multiple failed login attempts', 423));
  }

  // For resend OTP, skip password verification if user has an active OTP session
  if (resendOtp) {
    const existingSession = await Session.findActiveOtpSession(username);
    if (!existingSession) {
      return next(new AppError('No active OTP session found. Please login again.', 400));
    }
  } else {
    // Verify password for initial login
    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      await user.incrementLoginAttempts();
      await Metrics.recordError(new Error('Login attempt with invalid password'), user.id, 'auth', 'login_failed');
      return next(new AppError('Invalid username or password', 401));
    }
  }

  // Generate OTP
  const otp = generateOTP(parseInt(process.env.OTP_LENGTH) || 6);
  const expirySeconds = parseInt(process.env.OTP_EXPIRY_SECONDS) || 300;

  // Create OTP session
  await Session.createOtpSession(username, otp, expirySeconds);

  // Send OTP to user's email
  if (!transporter || !emailConfigured) {
    logger.warn('Email transporter not configured, logging OTP instead');
    logger.info(`OTP for user ${username}: ${otp} (expires in ${Math.floor(expirySeconds / 60)} minutes)`);

    // For development/testing, we'll still create the OTP session but not send email
    res.status(200).json({
      success: true,
      message: 'OTP generated. Check server logs for OTP code (development mode).',
      expiresIn: expirySeconds,
      requiresOtp: true,
      // Include OTP in response for testing (remove in production)
      ...(process.env.NODE_ENV === 'development' && { testOtp: otp })
    });
  } else {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'LESAVOT Security <noreply@lesavot.com>',
        to: user.email,
        subject: 'Your LESAVOT OTP Code',
        html: `
          <h2>LESAVOT Security Code</h2>
          <p>Your OTP code is: <strong>${otp}</strong></p>
          <p>This code will expire in ${Math.floor(expirySeconds / 60)} minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        `,
        text: `Your LESAVOT OTP code is: ${otp}. This code will expire in ${Math.floor(expirySeconds / 60)} minutes.`
      });

      // Record successful OTP send
      await Metrics.recordUserAction(user.id, 'otp_sent', 'auth');

      res.status(200).json({
        success: true,
        message: 'OTP sent to email. Please verify.',
        expiresIn: expirySeconds,
        requiresOtp: true
      });
    } catch (error) {
      logger.error('Failed to send OTP email:', error);
      await Metrics.recordError(error, user.id, 'auth', 'otp_send_failed');
      return next(new AppError('Failed to send OTP. Please try again.', 500));
    }
  }
});

// Step 2: Verify OTP
exports.verifyOtp = catchAsync(async (req, res, next) => {
  const { username, otp } = req.body;

  // Validate input
  if (!username || !otp) {
    return next(new AppError('Username and OTP are required', 400));
  }

  // Find user in database
  const user = await User.findByUsername(username);
  if (!user) {
    await Metrics.recordError(new Error('OTP verification with invalid username'), null, 'auth', 'otp_verification_failed');
    return next(new AppError('User not found', 404));
  }

  // Verify OTP
  const session = await Session.verifyOtp(username, otp);
  if (!session) {
    await Metrics.recordError(new Error('Invalid or expired OTP'), user.id, 'auth', 'otp_verification_failed');
    return next(new AppError('Invalid or expired OTP', 401));
  }

  // Reset login attempts on successful authentication
  await user.resetLoginAttempts();
  await user.updateLastLogin();

  // Create authentication session
  const authSession = await Session.createAuthSession(
    user.id,
    user.username,
    24 // 24 hours
  );

  // Generate JWT token
  const token = generateToken(user.id, process.env.JWT_EXPIRES_IN || '24h', {
    username: user.username,
    sessionId: authSession.sessionId
  });

  // Record successful login
  await Metrics.recordUserAction(user.id, 'login_success', 'auth');

  res.status(200).json({
    success: true,
    message: 'OTP verified. Access granted.',
    token,
    user: user.toSafeObject(),
    sessionId: authSession.sessionId
  });
});

// User registration
exports.signup = catchAsync(async (req, res, next) => {
  const { username, email, password, firstName, lastName, fullName } = req.body;

  // Validate input
  if (!username || !email || !password) {
    return next(new AppError('Username, email, and password are required', 400));
  }

  // Check if user already exists
  const existingUser = await User.findByUsername(username);
  if (existingUser) {
    return next(new AppError('Username already exists', 409));
  }

  const existingEmail = await User.findByEmail(email);
  if (existingEmail) {
    return next(new AppError('Email already registered', 409));
  }

  // Handle both fullName and firstName/lastName formats
  let userFirstName = firstName || '';
  let userLastName = lastName || '';

  if (fullName && !firstName && !lastName) {
    // Split fullName into firstName and lastName
    const nameParts = fullName.trim().split(' ');
    userFirstName = nameParts[0] || '';
    userLastName = nameParts.slice(1).join(' ') || '';
  }

  // Create new user
  const user = new User({
    username,
    email,
    password,
    firstName: userFirstName,
    lastName: userLastName
  });

  await user.save();
  await Metrics.recordUserAction(user.id, 'signup_success', 'auth');

  // Generate JWT token for immediate login after registration
  const token = generateToken(user.id, process.env.JWT_EXPIRES_IN || '24h', {
    username: user.username
  });

  // Generate refresh token
  const refreshToken = generateRefreshToken(user.id);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    user: user.toSafeObject(),
    token,
    refreshToken
  });
});

// User logout
exports.logout = catchAsync(async (req, res, next) => {
  const { sessionId } = req.body;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      const decoded = verifyToken(token);
      const sessionIdToInvalidate = sessionId || decoded.sessionId;

      if (sessionIdToInvalidate) {
        const session = await Session.findBySessionId(sessionIdToInvalidate);
        if (session) {
          await session.invalidate();
          await Metrics.recordUserAction(decoded.sub, 'logout_success', 'auth');
        }
      }
    } catch (error) {
      logger.warn('Invalid token during logout:', error.message);
    }
  }

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Get current user
exports.getCurrentUser = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401));
  }

  const token = authHeader.substring(7);

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Verify session is still valid
    if (decoded.sessionId) {
      const session = await Session.findBySessionId(decoded.sessionId);
      if (!session || !session.isValid()) {
        return next(new AppError('Session expired', 401));
      }
    }

    res.status(200).json({
      success: true,
      user: user.toSafeObject()
    });
  } catch (error) {
    return next(new AppError('Invalid token', 401));
  }
});

// Update password
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401));
  }

  if (!currentPassword || !newPassword) {
    return next(new AppError('Current password and new password are required', 400));
  }

  const token = authHeader.substring(7);

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Verify current password
    const isCurrentPasswordValid = await user.verifyPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      await Metrics.recordError(new Error('Invalid current password during password update'), user.id, 'auth', 'password_update_failed');
      return next(new AppError('Current password is incorrect', 401));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Invalidate all user sessions for security
    await Session.invalidateAllUserSessions(user.username);

    await Metrics.recordUserAction(user.id, 'password_updated', 'auth');

    res.status(200).json({ message: 'Password updated successfully. Please log in again.' });
  } catch (error) {
    return next(new AppError('Invalid token', 401));
  }
});

// Forgot password - send reset token to email
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Email is required', 400));
  }

  const user = await User.findByEmail(email);
  if (!user) {
    // Don't reveal if email exists or not for security
    return res.status(200).json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Save reset token to user
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = resetTokenExpiry;
  await user.save();

  // Send reset email
  if (!transporter) {
    logger.warn('Email transporter not configured, skipping password reset email');
    res.status(200).json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } else {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'LESAVOT Security <noreply@lesavot.com>',
        to: user.email,
        subject: 'Password Reset Request - LESAVOT',
        html: `
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your LESAVOT account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}">Reset Password</a>
          <p>This link will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
        text: `You requested a password reset. Use this token: ${resetToken}. This token expires in 10 minutes.`
      });

      await Metrics.recordUserAction(user.id, 'password_reset_requested', 'auth');

      res.status(200).json({
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();
      return next(new AppError('Failed to send password reset email', 500));
    }
  }
});

// Reset password with token
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return next(new AppError('New password is required', 400));
  }

  const user = await User.findByResetToken(token);
  if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
    return next(new AppError('Invalid or expired reset token', 400));
  }

  // Update password and clear reset token
  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  // Invalidate all user sessions for security
  await Session.invalidateAllUserSessions(user.username);

  await Metrics.recordUserAction(user.id, 'password_reset_completed', 'auth');

  res.status(200).json({ message: 'Password reset successfully. Please log in with your new password.' });
});

// Refresh JWT token
exports.refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new AppError('Refresh token is required', 400));
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.sub);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Generate new access token
    const newToken = generateToken(user.id, process.env.JWT_EXPIRES_IN || '24h', {
      username: user.username
    });

    res.status(200).json({
      success: true,
      token: newToken,
      user: user.toSafeObject()
    });
  } catch (error) {
    return next(new AppError('Invalid refresh token', 401));
  }
});

// Enable MFA (placeholder)
exports.enableMfa = catchAsync(async (req, res, next) => {
  return next(new AppError('MFA not implemented yet', 501));
});

// Disable MFA (placeholder)
exports.disableMfa = catchAsync(async (req, res, next) => {
  return next(new AppError('MFA not implemented yet', 501));
});

// Get MFA status (placeholder)
exports.getMfaStatus = catchAsync(async (req, res, next) => {
  return next(new AppError('MFA not implemented yet', 501));
});

/**
 * Authentication Routes
 *
 * This module defines the routes for authentication operations.
 */

const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { csrfProtection } = require('../middleware/security');
const { validateSignup, validateLogin, validatePasswordUpdate } = require('../middleware/validators');

const router = express.Router();

// Apply CSRF protection to all routes if enabled
if (process.env.ENABLE_CSRF_PROTECTION === 'true') {
  router.use(csrfProtection());
}

// Public routes with rate limiting
router.post('/signup', authLimiter, validateSignup, authController.signup);
router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/logout', authController.logout);

// Password reset routes with strict rate limiting
router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword);
router.post('/reset-password/:token', passwordResetLimiter, authController.resetPassword);

// Token refresh route
router.post('/refresh-token', authLimiter, authController.refreshToken);

// OTP verification route
router.post('/verify-otp', authLimiter, authController.verifyOtp);
// (Legacy/unused) MFA routes
// router.post('/mfa/challenge', authLimiter, authController.mfaChallenge);
// router.post('/mfa/verify', authLimiter, authController.mfaVerify);

// Protected routes (require authentication)
router.use(protect);
router.get('/me', authController.getCurrentUser);
router.patch('/update-password', validatePasswordUpdate, authController.updatePassword);
router.post('/mfa/enable', authController.enableMfa);
router.post('/mfa/disable', authController.disableMfa);
router.get('/mfa/status', authController.getMfaStatus);

module.exports = router;

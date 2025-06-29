/**
 * User Routes
 * 
 * This module defines the routes for user-related operations.
 */

const express = require('express');
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// All user routes are protected
router.use(protect);

// Routes for current user
router.patch('/update-profile', userController.updateProfile);
router.delete('/delete-account', userController.deleteAccount);

// Admin-only routes
router.get('/', restrictTo('admin'), userController.getAllUsers);
router.get('/:id', restrictTo('admin'), userController.getUserById);

module.exports = router;

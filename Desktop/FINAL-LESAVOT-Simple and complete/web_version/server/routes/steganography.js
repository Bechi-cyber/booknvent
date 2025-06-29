/**
 * Steganography Routes
 * 
 * This module defines the routes for steganography-related operations.
 */

const express = require('express');
const stegoController = require('../controllers/stegoController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All steganography routes are protected
router.use(protect);

// Steganography history routes
router.post('/history', stegoController.saveOperation);
router.get('/history', stegoController.getHistory);
router.delete('/history/:id', stegoController.deleteHistoryEntry);
router.delete('/history', stegoController.clearHistory);

module.exports = router;

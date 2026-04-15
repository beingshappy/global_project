const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');

// @route   POST api/ai/toggle
// @desc    Start or Stop the AI Python Module
// @access  Private
router.post('/toggle', auth, aiController.toggleAI);

// @route   GET api/ai/status
// @desc    Get current AI module running status
// @access  Public (for faster UI updates)
router.get('/status', aiController.getStatus);

module.exports = router;

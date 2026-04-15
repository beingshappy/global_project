const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const auth = require('../middleware/auth');

// @route   GET api/alerts/live
// @desc    Get all active alerts
// @access  Private
router.get('/live', auth, alertController.getAlerts);

// @route   PUT api/alerts/:id
// @desc    Update alert status
// @access  Private
router.put('/:id', auth, alertController.updateAlertStatus);

module.exports = router;

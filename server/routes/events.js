const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const auth = require('../middleware/auth');

// @route   POST api/events
// @desc    Create an event (Triggered by AI module)
// @access  Public (In production, use API Key or specific auth for AI module)
router.post('/', eventController.createEvent);

// @route   GET api/events
// @desc    Get all events
// @access  Private
router.get('/', auth, eventController.getEvents);

// @route   DELETE api/events/purge
// @desc    Purge all events
// @access  Private
router.delete('/purge', auth, eventController.purgeEvents);

// @route   POST api/events/seed
// @desc    Seed demo events
// @access  Private
router.post('/seed', auth, eventController.seedEvents);

// @route   DELETE api/events/:id
// @desc    Delete an event
// @access  Private
router.delete('/:id', auth, eventController.deleteEvent);

// @route   GET api/events/export
// @desc    Export all events
// @access  Private
router.get('/export', auth, eventController.exportEvents);

module.exports = router;

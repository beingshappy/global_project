const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const auth = require('../middleware/auth');

router.get('/', auth, configController.getConfig);
router.post('/', auth, configController.updateConfig);

module.exports = router;

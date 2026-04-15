const Config = require('../models/Config');

// @desc    Get system-wide configuration
// @route   GET api/config
// @access  Private
exports.getConfig = async (req, res) => {
  try {
    let config = await Config.findOne();
    if (!config) {
      // Initialize with defaults if none exists
      config = new Config({});
      await config.save();
    }
    res.json(config);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Update system-wide configuration
// @route   POST api/config
// @access  Private
exports.updateConfig = async (req, res) => {
  const { confidence, deepFace, lowLight, webSocket } = req.body;
  try {
    let config = await Config.findOne();
    if (!config) {
      config = new Config({ confidence, deepFace, lowLight, webSocket });
    } else {
      config.confidence = confidence !== undefined ? confidence : config.confidence;
      config.deepFace = deepFace !== undefined ? deepFace : config.deepFace;
      config.lowLight = lowLight !== undefined ? lowLight : config.lowLight;
      config.webSocket = webSocket !== undefined ? webSocket : config.webSocket;
      config.lastUpdated = Date.now();
    }
    await config.save();
    res.json(config);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

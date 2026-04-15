const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  confidence: { type: Number, default: 75 },
  deepFace: { type: Boolean, default: true },
  lowLight: { type: Boolean, default: true },
  webSocket: { type: Boolean, default: true },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Config', configSchema);

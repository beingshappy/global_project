const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  location: { type: String, default: 'Camera-1' },
  risk_type: { type: String, required: true }, // e.g. "LONE_WOMAN", "SURROUNDED", "SOS_GESTURE"
  confidence_score: { type: Number, required: true },
  image_snapshot: { type: String }, // Base64 encoded image or path
  women_count: { type: Number, default: 0 },
  men_count: { type: Number, default: 0 }
});

module.exports = mongoose.model('Event', eventSchema);

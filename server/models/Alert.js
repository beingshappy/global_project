const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  alert_status: { type: String, enum: ['NEW', 'ACKNOWLEDGED', 'RESOLVED'], default: 'NEW' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', alertSchema);

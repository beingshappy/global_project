const Alert = require('../models/Alert');

exports.getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find().populate('event_id').sort({ created_at: -1 }).limit(50);
    res.json(alerts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateAlertStatus = async (req, res) => {
  try {
    const { status } = req.body;
    let alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ msg: 'Alert not found' });

    alert.alert_status = status;
    await alert.save();

    res.json(alert);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

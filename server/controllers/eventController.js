const Event = require('../models/Event');
const Alert = require('../models/Alert');

exports.createEvent = async (req, res) => {
  const { location, risk_type, confidence_score, image_snapshot, women_count, men_count } = req.body;

  try {
    // 1. Create and save the event
    const newEvent = new Event({
      location,
      risk_type,
      confidence_score,
      image_snapshot,
      women_count,
      men_count
    });
    
    const savedEvent = await newEvent.save();

    // 2. Create an associated alert
    const newAlert = new Alert({
      event_id: savedEvent._id,
      alert_status: 'NEW'
    });

    const savedAlert = await newAlert.save();

    // 3. Populate alert with event info for the WebSocket broadcast
    const populatedAlert = await Alert.findById(savedAlert._id).populate('event_id');

    // 4. Emit the alert to all connected WebSocket clients
    if (req.io) {
      req.io.emit('new_alert', populatedAlert);
    }

    res.status(201).json({ msg: 'Event & Alert created successfully', event: savedEvent });
  } catch (err) {
    console.error('Error creating event:', err.message);
    res.status(500).send('Server Error');
  }
};

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ timestamp: -1 }).limit(50);
    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });

    // Also remove associated alerts
    await Alert.deleteMany({ event_id: req.params.id });
    await event.deleteOne();

    res.json({ msg: 'Event and associated alerts removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.seedEvents = async (req, res) => {
  try {
    const demoEvents = [
      {
        location: 'Zone-A Lobby',
        risk_type: 'SOS_GESTURE_DETECTED',
        confidence_score: 0.94,
        women_count: 1,
        men_count: 0,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
      },
      {
        location: 'West Parking B2',
        risk_type: 'LONE_WOMAN_HIGH_RISK',
        confidence_score: 0.88,
        women_count: 1,
        men_count: 3,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5) // 5 hours ago
      },
      {
        location: 'North Corridor',
        risk_type: 'CROWD_SURROUNDED',
        confidence_score: 0.76,
        women_count: 2,
        men_count: 6,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
      }
    ];

    const savedEvents = await Event.insertMany(demoEvents);
    
    // Create alerts for these demo events
    const demoAlerts = savedEvents.map(ev => ({
      event_id: ev._id,
      alert_status: 'NEW'
    }));
    await Alert.insertMany(demoAlerts);

    res.json({ msg: 'Demo data seeded successfully', count: savedEvents.length });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error during seeding' });
  }
};

exports.purgeEvents = async (req, res) => {
  try {
    await Alert.deleteMany({});
    await Event.deleteMany({});
    res.json({ msg: 'System purge successful. All logs cleared.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error during system purge' });
  }
};

exports.exportEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ timestamp: -1 });
    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error during data export' });
  }
};

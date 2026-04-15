const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Event = require('./models/Event');
const Alert = require('./models/Alert');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected for seeding'))
  .catch((err) => {
    console.error('❌ Connection error:', err);
    process.exit(1);
  });

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Event.deleteMany();
    await Alert.deleteMany();

    // Create Test User
    // The pre-save hook in User model hashes the password automatically.
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@safewoman.org',
      password: 'password123'
    });
    console.log('✅ Admin User Created (admin@safewoman.org / password123)');

    // Create Sample Events
    const eventsToCreate = [
      {
        location: 'Camera-1 (Main Gate)',
        risk_type: 'LONE_WOMAN_NIGHT',
        confidence_score: 0.88,
        women_count: 1,
        men_count: 0,
        timestamp: new Date(Date.now() - 3600000) // 1 Hour ago
      },
      {
        location: 'Camera-2 (Parking)',
        risk_type: 'SURROUNDED_BY_MEN',
        confidence_score: 0.95,
        women_count: 1,
        men_count: 4,
        timestamp: new Date(Date.now() - 7200000) // 2 Hours ago
      },
      {
        location: 'Camera-3 (Staircase)',
        risk_type: 'SOS_GESTURE_DETECTED',
        confidence_score: 0.99,
        women_count: 1,
        men_count: 1,
        timestamp: new Date(Date.now() - 10800000) // 3 Hours ago
      }
    ];

    const createdEvents = await Event.insertMany(eventsToCreate);
    console.log('✅ Test Events Generated');

    // Create Sample Alerts
    const alertsToCreate = createdEvents.map((ev, index) => ({
      event_id: ev._id,
      alert_status: index === 0 ? 'NEW' : 'RESOLVED' // 1 new, 2 resolved
    }));

    await Alert.insertMany(alertsToCreate);
    console.log('✅ Test Alerts Linked');

    console.log('🌱 Data seeding completed successfully!');
    process.exit();
  } catch (error) {
    console.error('❌ Error testing data seeding', error);
    process.exit(1);
  }
};

seedData();

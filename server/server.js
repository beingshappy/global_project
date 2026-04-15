const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const morgan = require('morgan');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // We will allow all for local dev
    methods: ['GET', 'POST']
  }
});

app.use(morgan('dev')); // Backend Logging System
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support for image snapshots

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Attach io to requests so controllers can emit events
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Root Route
app.get('/', (req, res) => {
  res.send('SafeWoman API is running...');
});

// Routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const alertRoutes = require('./routes/alerts');
const aiRoutes = require('./routes/ai');
const configRoutes = require('./routes/config');

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/config', configRoutes);

// Socket.io Config
io.on('connection', (socket) => {
  console.log('🔗 Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

const { errorHandler } = require('./middleware/errorMiddleware');
app.use(errorHandler);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('💥 GLOBAL ERROR:', err.stack);
  res.status(500).json({ msg: 'Internal Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

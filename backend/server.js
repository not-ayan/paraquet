require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const connectDB = require('./lib/db');
const { withClerk } = require('./middleware/auth');

const usersRoutes = require('./routes/users');
const equipmentRoutes = require('./routes/equipment');
const bookingsRoutes = require('./routes/bookings');
const activityRoutes = require('./routes/activity');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
];

app.use(compression());
app.use(cors({
  origin: (origin, callback) => {
    // Reflect origin if present, or allow non-browser clients
    callback(null, origin || true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.options('*', cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(withClerk); // attaches req.auth on every request when a session token is present

app.use('/api/users', usersRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

const mongoose = require('mongoose');

app.get('/health', (req, res) => {
  const stateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  const readyState = mongoose.connection.readyState;
  res.json({
    ok: readyState === 1,
    db: stateMap[readyState] || 'unknown',
    readyState,
    timestamp: new Date().toISOString(),
  });
});

// Centralized error handler — every route's catch(next) lands here.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 4000;
const { checkAndNotifyOverdueBookings } = require('./services/overdue');

app.listen(PORT, async () => {
  console.log(`API running on :${PORT}`);
  try {
    await connectDB();

    // Run an initial overdue loans sweep 10 seconds after boot, then check hourly
    setTimeout(() => {
      checkAndNotifyOverdueBookings().catch((err) =>
        console.warn('[Overdue Cron] Startup check error:', err.message)
      );
    }, 10000);

    setInterval(() => {
      checkAndNotifyOverdueBookings().catch((err) =>
        console.warn('[Overdue Cron] Periodic check error:', err.message)
      );
    }, 60 * 60 * 1000);
  } catch (err) {
    console.error('Initial DB connection attempt failed:', err.message);
  }
});

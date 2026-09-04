require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./lib/db');
const { withClerk } = require('./middleware/auth');

const usersRoutes = require('./routes/users');
const equipmentRoutes = require('./routes/equipment');
const bookingsRoutes = require('./routes/bookings');
const activityRoutes = require('./routes/activity');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');

const app = express();

app.use(cors());
app.use(express.json());
app.use(withClerk); // attaches req.auth on every request when a session token is present

app.use('/api/users', usersRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

// Centralized error handler — every route's catch(next) lands here.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => app.listen(PORT, () => console.log(`API running on :${PORT}`)))
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

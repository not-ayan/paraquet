const dns = require('node:dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // fallback if custom DNS servers cannot be set
}
const mongoose = require('mongoose');

let connectionPromise = null;

/**
 * Robust MongoDB connection manager with singleton promise caching,
 * auto-reconnect, and connection state protection.
 */
async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (connectionPromise) {
    return connectionPromise;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI — add it to your .env file');

  connectionPromise = (async () => {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        minPoolSize: 2,
        maxPoolSize: 25,
        family: 4,
        heartbeatFrequencyMS: 10000,
      });
      console.log('MongoDB connected successfully');
      return mongoose.connection;
    } catch (err) {
      console.warn('⚠️ MongoDB Atlas Connection Notice:', err.message);
      connectionPromise = null;
      // Auto-retry connection after 3 seconds
      setTimeout(() => connectDB().catch(() => {}), 3000);
      return null;
    } finally {
      if (mongoose.connection.readyState !== 1) {
        connectionPromise = null;
      }
    }
  })();

  return connectionPromise;
}

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB connection disconnected. Mongoose driver handling reconnection...');
  connectionPromise = null;
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = connectDB;
module.exports.isDbConnected = isDbConnected;

const mongoose = require('mongoose');

/**
 * Call once at server startup before touching any model. MONGODB_URI comes
 * from your Atlas cluster's "Connect > Drivers" string — put it in .env,
 * never commit it.
 */
async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI — add it to your .env file');

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB connected successfully');
    return mongoose.connection;
  } catch (err) {
    console.warn('⚠️ MongoDB Atlas Connection Notice: Could not connect to Atlas cluster.');
    console.warn('If accessing from a new network, add your current IP address to the MongoDB Atlas Network Access whitelist (or 0.0.0.0/0 for hackathon testing).');
    console.warn('Detail:', err.message);
    return null;
  }
}

module.exports = connectDB;

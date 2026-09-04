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

  await mongoose.connect(uri);
  console.log('MongoDB connected');
  return mongoose.connection;
}

module.exports = connectDB;

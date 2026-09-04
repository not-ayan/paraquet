const { Schema, model } = require('mongoose');

/**
 * Clerk handles authentication itself — this collection is just the app-level
 * profile + role that Clerk doesn't store. clerkId is the join key: every
 * other collection that needs "who" stores a Mongo ObjectId ref to User,
 * and User.clerkId is what you look up from req.auth.userId (Clerk's id).
 */
const userSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true },
    name: { type: String },
    avatarUrl: { type: String },
    phone: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
  },
  { timestamps: true }
);

module.exports = model('User', userSchema);

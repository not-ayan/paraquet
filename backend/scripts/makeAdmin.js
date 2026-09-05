/**
 * Run with: npm run make-admin -- someone@example.com
 * Promotes an existing User (matched by email) to role: 'admin'.
 * The user must have signed in at least once already — this only updates
 * an existing document, it doesn't create one.
 */
require('dotenv').config();
const connectDB = require('../lib/db');
const { User } = require('../models');

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npm run make-admin -- someone@example.com');
    process.exit(1);
  }

  const conn = await connectDB();
  if (!conn) {
    console.error('Cannot update admin: MongoDB connection could not be established.');
    console.error('Please verify your IP is whitelisted in MongoDB Atlas Network Access.');
    process.exit(1);
  }

  const emailRegex = new RegExp(`^${email.trim()}$`, 'i');
  let user = await User.findOne({ email: emailRegex });

  if (!user) {
    user = await User.create({
      email: email.trim().toLowerCase(),
      name: email.split('@')[0],
      clerkId: `pre_admin_${Date.now()}`,
      role: 'admin',
    });
    console.log(`Created new admin account for ${user.email} (Role: ${user.role})`);
  } else {
    user.role = 'admin';
    await user.save();
    console.log(`Promoted existing user ${user.email} (${user.clerkId}) to role: ${user.role}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});

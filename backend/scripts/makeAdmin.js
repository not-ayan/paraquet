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

  await connectDB();

  const user = await User.findOneAndUpdate(
    { email },
    { role: 'admin' },
    { new: true }
  );

  if (!user) {
    console.error(`No user found with email ${email}. Sign in at least once first.`);
    process.exit(1);
  }

  console.log(`${user.email} (${user.clerkId}) is now role: ${user.role}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});

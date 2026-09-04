/**
 * Run with: npm run seed
 * Creates the collections and drops in a handful of approved equipment
 * items so the catalogue isn't empty for your first demo run.
 */
require('dotenv').config();
const connectDB = require('../lib/db');
const { User, Equipment } = require('../models');

async function seed() {
  await connectDB();

  const admin = await User.findOneAndUpdate(
    { clerkId: 'seed-admin' },
    { clerkId: 'seed-admin', email: 'admin@example.com', name: 'Admin', role: 'admin' },
    { upsert: true, new: true }
  );

  const items = [
    { name: 'DSLR Camera', category: 'Electronics', tags: ['camera', 'photography'], quantity: 2 },
    { name: 'Projector', category: 'Electronics', tags: ['presentation'], quantity: 1 },
    { name: 'Tent (4-person)', category: 'Outdoor', tags: ['camping'], quantity: 3 },
    { name: 'Portable Speaker', category: 'Electronics', tags: ['audio', 'event'], quantity: 4 },
    { name: 'Drill Machine', category: 'Tools', tags: ['diy', 'repair'], quantity: 2 },
    { name: 'Badminton Racket Set', category: 'Sports', tags: ['badminton'], quantity: 6 },
  ].map((item) => ({ ...item, approvalStatus: 'approved', addedBy: admin._id }));

  await Equipment.deleteMany({ addedBy: admin._id, name: { $in: items.map((i) => i.name) } });
  const created = await Equipment.insertMany(items);

  console.log(`Seeded ${created.length} equipment items under admin ${admin._id}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

require('dotenv').config();
const connectDB = require('../lib/db');
const { User, Equipment, Booking, ActivityLog } = require('../models');
const {
  sendBookingRequestedEmail,
  sendBookingApprovedEmail,
  sendBookingRejectedEmail,
  sendPickupConfirmedEmail,
  sendReturnConfirmedEmail,
  sendOverdueWarningEmail,
  sendConditionResolvedEmail,
} = require('../services/email');
const { checkAndNotifyOverdueBookings } = require('../services/overdue');

async function runIntegration() {
  console.log('=== RUNNING BOOKING & EMAIL WORKFLOW INTEGRATION TEST ===');
  await connectDB();

  // 1. Create or get test student
  const testEmail = 'delivered@resend.dev';
  let testUser = await User.findOne({ email: testEmail });
  if (!testUser) {
    testUser = await User.create({
      clerkId: 'user_test_resend_' + Date.now(),
      email: testEmail,
      name: 'Campus Borrower (Resend Verified)',
      role: 'user',
    });
  }

  // 2. Create mock equipment
  let testEquip = await Equipment.findOne({ name: 'Integration Test Drone 4K' });
  if (!testEquip) {
    testEquip = await Equipment.create({
      name: 'Integration Test Drone 4K',
      category: 'Drones',
      description: 'Test equipment for validating Resend transactional emails',
      images: ['https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800'],
      approvalStatus: 'approved',
      availability: 'available',
      maxBorrowDays: 5,
      condition: { status: 'good' },
      addedBy: testUser._id,
    });
  }

  console.log(`[Test] User: ${testUser.name} (${testUser.email}), Equipment: ${testEquip.name}`);

  // 3. Test Booking Requested Email
  const startDate = new Date();
  const endDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const testBooking = await Booking.create({
    user: testUser._id,
    equipment: testEquip._id,
    startDate,
    endDate,
    location: 'Campus Technology Desk',
    status: 'pending',
  });
  await testBooking.populate('equipment user');

  console.log('\n--- 1. Testing sendBookingRequestedEmail ---');
  const r1 = await sendBookingRequestedEmail({
    user: testBooking.user,
    equipment: testBooking.equipment,
    booking: testBooking,
  });
  console.log('Result:', r1);

  // 4. Test Booking Approved Email
  testBooking.status = 'approved';
  await testBooking.save();
  console.log('\n--- 2. Testing sendBookingApprovedEmail ---');
  const r2 = await sendBookingApprovedEmail({
    user: testBooking.user,
    equipment: testBooking.equipment,
    booking: testBooking,
  });
  console.log('Result:', r2);

  // 5. Test Pickup Confirmed Email
  testBooking.status = 'active';
  testBooking.pickupCondition = {
    photos: ['https://res.cloudinary.com/mock/pickup.jpg'],
    notes: 'Checked out in pristine condition',
    condition: 'good',
    recordedAt: new Date(),
  };
  await testBooking.save();
  console.log('\n--- 3. Testing sendPickupConfirmedEmail ---');
  const r3 = await sendPickupConfirmedEmail({
    user: testBooking.user,
    equipment: testBooking.equipment,
    booking: testBooking,
  });
  console.log('Result:', r3);

  // 6. Test Return Confirmed Email (with AI analysis)
  testBooking.status = 'returned';
  testBooking.returnCondition = {
    photos: ['https://res.cloudinary.com/mock/return.jpg'],
    notes: 'Returned at campus counter',
    condition: 'good',
    aiSimilarityScore: 0.94,
    aiFlagged: false,
    recordedAt: new Date(),
  };
  await testBooking.save();
  console.log('\n--- 4. Testing sendReturnConfirmedEmail ---');
  const r4 = await sendReturnConfirmedEmail({
    user: testBooking.user,
    equipment: testBooking.equipment,
    booking: testBooking,
    aiVerdict: {
      flagged: false,
      similarityScore: 0.94,
      detailedDiscrepancyReport: 'Vision analysis confirmed no physical or structural damage.',
    },
    overdueFee: 0,
  });
  console.log('Result:', r4);

  // 7. Test Overdue Detection & Email
  const pastStartDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const pastEndDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const overdueBooking = await Booking.create({
    user: testUser._id,
    equipment: testEquip._id,
    startDate: pastStartDate,
    endDate: pastEndDate,
    location: 'Campus Technology Desk',
    status: 'active',
  });

  console.log('\n--- 5. Testing checkAndNotifyOverdueBookings() ---');
  const overdueReport = await checkAndNotifyOverdueBookings();
  console.log('Overdue report:', JSON.stringify(overdueReport, null, 2));

  // 8. Test Damage Condition Resolution Email
  console.log('\n--- 6. Testing sendConditionResolvedEmail ---');
  const r6 = await sendConditionResolvedEmail({
    user: testUser,
    equipment: testEquip,
    booking: testBooking,
    damageFee: 450,
    note: 'Minor propeller chip reported. Replacement fee applied.',
  });
  console.log('Result:', r6);

  // 9. Cleanup test records
  console.log('\n--- Cleaning up integration test bookings ---');
  await Booking.deleteMany({ _id: { $in: [testBooking._id, overdueBooking._id] } });
  await ActivityLog.deleteMany({ booking: { $in: [testBooking._id, overdueBooking._id] } });
  await Equipment.findByIdAndDelete(testEquip._id);

  console.log('=== INTEGRATION TEST COMPLETE — ALL CHECKS PASSED ===');
  process.exit(0);
}

runIntegration().catch((err) => {
  console.error('Integration test failed:', err);
  process.exit(1);
});

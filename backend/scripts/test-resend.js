const emailService = require('../services/email');

async function testAllTemplates() {
  console.log('--- Testing email template generation & dispatch ---');
  const mockUser = {
    name: 'Ayan Test',
    email: 'delivered@resend.dev',
  };
  const mockEquipment = {
    name: 'Sony FX3 Cinema Camera',
    category: 'Cameras',
    maxBorrowDays: 3,
  };
  const mockBooking = {
    _id: '66e123456789abcdef012345',
    startDate: new Date(),
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    location: 'Main Media Lab Counter',
    charges: { overdueFee: 500, damageFee: 1200 },
    pickupCondition: { condition: 'good' },
    returnCondition: { aiFlagged: true, aiSimilarityScore: 0.84 },
  };

  // 1. Request
  const r1 = await emailService.sendBookingRequestedEmail({
    user: mockUser,
    equipment: mockEquipment,
    booking: mockBooking,
  });
  console.log('1. Booking Requested Email result:', r1.success ? `Delivered id=${r1.id}` : r1.error);

  // 2. Approval
  const r2 = await emailService.sendBookingApprovedEmail({
    user: mockUser,
    equipment: mockEquipment,
    booking: mockBooking,
  });
  console.log('2. Booking Approved Email result:', r2.success ? `Delivered id=${r2.id}` : r2.error);

  // 3. Rejection
  const r3 = await emailService.sendBookingRejectedEmail({
    user: mockUser,
    equipment: mockEquipment,
    booking: mockBooking,
    reason: 'Maintenance scheduled during requested time slot',
  });
  console.log('3. Booking Rejected Email result:', r3.success ? `Delivered id=${r3.id}` : r3.error);

  // 4. Pickup Confirmed
  const r4 = await emailService.sendPickupConfirmedEmail({
    user: mockUser,
    equipment: mockEquipment,
    booking: mockBooking,
  });
  console.log('4. Pickup Confirmed Email result:', r4.success ? `Delivered id=${r4.id}` : r4.error);

  // 5. Return Confirmed
  const r5 = await emailService.sendReturnConfirmedEmail({
    user: mockUser,
    equipment: mockEquipment,
    booking: mockBooking,
    aiVerdict: {
      flagged: false,
      similarityScore: 0.95,
      detailedDiscrepancyReport: 'Cosmetic condition consistent with checkout.',
    },
    overdueFee: 0,
  });
  console.log('5. Return Confirmed Email result:', r5.success ? `Delivered id=${r5.id}` : r5.error);

  // 6. Overdue Warning
  const r6 = await emailService.sendOverdueWarningEmail({
    user: mockUser,
    equipment: mockEquipment,
    booking: mockBooking,
    daysLate: 2,
    overdueFee: 500,
  });
  console.log('6. Overdue Warning Email result:', r6.success ? `Delivered id=${r6.id}` : r6.error);

  // 7. Condition Resolved
  const r7 = await emailService.sendConditionResolvedEmail({
    user: mockUser,
    equipment: mockEquipment,
    booking: mockBooking,
    damageFee: 1200,
    note: 'Minor scratch on side body verified. Cleaned and tested.',
  });
  console.log('7. Condition Resolved Email result:', r7.success ? `Delivered id=${r7.id}` : r7.error);
}

testAllTemplates();

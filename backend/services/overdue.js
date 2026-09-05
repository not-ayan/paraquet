const { Booking, ActivityLog } = require('../models');
const { sendOverdueWarningEmail } = require('./email');

const OVERDUE_RATE_PER_DAY = 250; // ₹250/day late penalty

/**
 * Sweeps active/overdue loans past their scheduled return endDate,
 * flags status, calculates accrued penalties, and dispatches Resend warning emails.
 */
async function checkAndNotifyOverdueBookings() {
  const now = new Date();
  try {
    const overdueBookings = await Booking.find({
      status: { $in: ['active', 'overdue'] },
      endDate: { $lt: now },
    }).populate('equipment user');

    if (!overdueBookings || overdueBookings.length === 0) {
      return { count: 0, processed: [] };
    }

    const processed = [];
    for (const booking of overdueBookings) {
      const daysLate = Math.max(1, Math.ceil((now - new Date(booking.endDate)) / (1000 * 60 * 60 * 24)));
      const overdueFee = daysLate * OVERDUE_RATE_PER_DAY;

      if (!booking.charges) {
        booking.charges = { overdueFee: 0, damageFee: 0, status: 'none' };
      }
      booking.charges.overdueFee = overdueFee;
      booking.charges.status = 'pending';

      const wasActive = booking.status === 'active';
      booking.status = 'overdue';
      await booking.save();

      // Log activity on initial transition to overdue
      if (wasActive) {
        await ActivityLog.create({
          user: booking.user?._id || booking.user,
          type: 'booking_overdue',
          booking: booking._id,
          equipment: booking.equipment?._id || booking.equipment,
          message: `Return deadline passed: ${daysLate} day(s) overdue (Penalty: ₹${overdueFee})`,
        });
      }

      // Fire Resend alert email
      const emailResult = await sendOverdueWarningEmail({
        user: booking.user,
        equipment: booking.equipment,
        booking,
        daysLate,
        overdueFee,
      });

      processed.push({
        bookingId: booking._id,
        equipment: booking.equipment?.name,
        userEmail: booking.user?.email,
        userName: booking.user?.name,
        daysLate,
        overdueFee,
        emailSent: Boolean(emailResult?.success),
      });
    }

    console.log(`[Overdue Service] Processed ${processed.length} overdue loan(s).`);
    return { count: processed.length, processed };
  } catch (err) {
    console.error('[Overdue Service] Error checking overdue bookings:', err.message);
    return { count: 0, error: err.message, processed: [] };
  }
}

module.exports = {
  checkAndNotifyOverdueBookings,
  OVERDUE_RATE_PER_DAY,
};

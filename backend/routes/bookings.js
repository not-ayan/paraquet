const express = require('express');
const { Booking, Equipment, ActivityLog } = require('../models');
const { requireUser } = require('../middleware/auth');
const { compareConditionPhotos } = require('../services/aiCondition');

const router = express.Router();

const ACTIVE_STATUSES = ['pending', 'approved', 'active'];
const OVERDUE_RATE_PER_DAY = 50; // flat fee per day late — tune for your demo currency

/**
 * The one query that cannot be wrong: any non-terminal booking on this
 * equipment whose date range overlaps the requested one is a conflict.
 * Only checking 'approved' here (not 'pending' too) is the classic bug —
 * two pending requests would both sail through and collide once approved.
 */
async function hasConflict(equipmentId, startDate, endDate, excludeBookingId) {
  const query = {
    equipment: equipmentId,
    status: { $in: ACTIVE_STATUSES },
    startDate: { $lt: endDate },
    endDate: { $gt: startDate },
  };
  if (excludeBookingId) query._id = { $ne: excludeBookingId };
  const conflict = await Booking.findOne(query);
  return Boolean(conflict);
}

// GET /api/bookings/me
router.get('/me', requireUser, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.dbUser._id })
      .populate('equipment')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

// GET /api/bookings/:id
router.get('/:id', requireUser, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('equipment user');
    if (!booking) return res.status(404).json({ error: 'Not found' });

    const isOwner = booking.user._id.toString() === req.dbUser._id.toString();
    if (!isOwner && req.dbUser.role !== 'admin') {
      return res.status(403).json({ error: 'Not allowed' });
    }
    res.json(booking);
  } catch (err) {
    next(err);
  }
});

// POST /api/bookings
router.post('/', requireUser, async (req, res, next) => {
  try {
    const { equipmentId, startDate, endDate, location } = req.body;
    if (!equipmentId || !startDate || !endDate) {
      return res.status(400).json({ error: 'equipmentId, startDate, endDate are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!(start < end)) {
      return res.status(400).json({ error: 'startDate must be before endDate' });
    }

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment || equipment.approvalStatus !== 'approved') {
      return res.status(404).json({ error: 'Equipment not available' });
    }

    if (await hasConflict(equipmentId, start, end)) {
      return res.status(409).json({ error: 'Equipment already booked for that window' });
    }

    const booking = await Booking.create({
      user: req.dbUser._id,
      equipment: equipmentId,
      startDate: start,
      endDate: end,
      location,
    });

    await ActivityLog.create({
      user: req.dbUser._id,
      type: 'booking_created',
      booking: booking._id,
      equipment: equipmentId,
      message: `Requested ${equipment.name}`,
    });

    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/bookings/:id/cancel
router.patch('/:id/cancel', requireUser, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Not found' });

    const isOwner = booking.user.toString() === req.dbUser._id.toString();
    if (!isOwner && req.dbUser.role !== 'admin') {
      return res.status(403).json({ error: 'Not allowed' });
    }
    if (!['pending', 'approved'].includes(booking.status)) {
      return res.status(400).json({ error: `Cannot cancel a booking in status "${booking.status}"` });
    }

    booking.status = 'cancelled';
    booking.cancelReason = req.body?.reason;
    await booking.save();

    await ActivityLog.create({
      user: booking.user,
      type: 'booking_cancelled',
      booking: booking._id,
      equipment: booking.equipment,
      message: 'Booking cancelled',
    });

    res.json(booking);
  } catch (err) {
    next(err);
  }
});

// POST /api/bookings/:id/pickup-condition
router.post('/:id/pickup-condition', requireUser, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Not found' });

    const isOwner = booking.user.toString() === req.dbUser._id.toString();
    if (!isOwner && req.dbUser.role !== 'admin') {
      return res.status(403).json({ error: 'Not allowed' });
    }
    if (booking.status !== 'approved') {
      return res.status(400).json({ error: `Booking must be "approved" to record pickup, got "${booking.status}"` });
    }

    const { photos = [], notes } = req.body;
    if (!photos.length) return res.status(400).json({ error: 'At least one photo is required' });

    booking.pickupCondition = {
      photos,
      notes,
      recordedBy: req.dbUser._id,
      recordedAt: new Date(),
    };
    booking.status = 'active';
    await booking.save();

    await ActivityLog.create({
      user: booking.user,
      type: 'pickup_recorded',
      booking: booking._id,
      equipment: booking.equipment,
      message: 'Pickup condition recorded',
    });

    res.json(booking);
  } catch (err) {
    next(err);
  }
});

// POST /api/bookings/:id/return-condition
router.post('/:id/return-condition', requireUser, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Not found' });

    const isOwner = booking.user.toString() === req.dbUser._id.toString();
    if (!isOwner && req.dbUser.role !== 'admin') {
      return res.status(403).json({ error: 'Not allowed' });
    }
    if (!['active', 'overdue'].includes(booking.status)) {
      return res.status(400).json({ error: `Booking must be "active" to record return, got "${booking.status}"` });
    }

    const { photos = [], notes } = req.body;
    if (!photos.length) return res.status(400).json({ error: 'At least one photo is required' });

    // AI hook — services/aiCondition.js is a stub; swap its implementation
    // and nothing here has to change.
    const { similarityScore, flagged } = await compareConditionPhotos(
      booking.pickupCondition?.photos || [],
      photos
    );

    booking.returnCondition = {
      photos,
      notes,
      aiSimilarityScore: similarityScore,
      aiFlagged: flagged,
      recordedBy: req.dbUser._id,
      recordedAt: new Date(),
    };

    const now = new Date();
    if (now > booking.endDate) {
      const daysLate = Math.ceil((now - booking.endDate) / (1000 * 60 * 60 * 24));
      booking.charges.overdueFee = daysLate * OVERDUE_RATE_PER_DAY;
      booking.charges.status = 'pending';
    }

    booking.status = 'returned';
    await booking.save();

    await ActivityLog.create({
      user: booking.user,
      type: 'return_recorded',
      booking: booking._id,
      equipment: booking.equipment,
      message: 'Return condition recorded',
    });

    if (flagged) {
      await ActivityLog.create({
        user: booking.user,
        type: 'condition_flagged',
        booking: booking._id,
        equipment: booking.equipment,
        message: 'Condition flagged for admin review',
      });
    }

    res.json(booking);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

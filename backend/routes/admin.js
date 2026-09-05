const express = require('express');
const { User, Equipment, Booking, ActivityLog } = require('../models');
const { requireUser, requireAdmin } = require('../middleware/auth');
 
const router = express.Router();
 
router.use(requireUser, requireAdmin);
 
// GET /api/admin/users — view users, ?q= searches name/email, ?role= filters
router.get('/users', async (req, res, next) => {
  try {
    const { q, role, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));
    res.json(users);
  } catch (err) {
    next(err);
  }
});
 
// GET /api/admin/equipment — manage ALL equipment, not just pending.
// GET /api/equipment (public) only ever returns approved items; this is
// the admin-wide view, filterable by ?approvalStatus= and ?availability=.
router.get('/equipment', async (req, res, next) => {
  try {
    const { approvalStatus, availability, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (availability) filter.availability = availability;
    const items = await Equipment.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));
    res.json(items);
  } catch (err) {
    next(err);
  }
});
 
// GET /api/admin/equipment/pending
router.get('/equipment/pending', async (req, res, next) => {
  try {
    const items = await Equipment.find({ approvalStatus: 'pending' }).sort({ createdAt: 1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
});
 
// PATCH /api/admin/equipment/:id/approve
router.patch('/equipment/:id/approve', async (req, res, next) => {
  try {
    const item = await Equipment.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
 
    item.approvalStatus = 'approved';
    await item.save();
 
    if (item.addedBy) {
      await ActivityLog.create({
        user: item.addedBy,
        type: 'equipment_approved',
        equipment: item._id,
        message: `${item.name} was approved`,
      });
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});
 
// PATCH /api/admin/equipment/:id/reject
router.patch('/equipment/:id/reject', async (req, res, next) => {
  try {
    const item = await Equipment.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
 
    item.approvalStatus = 'rejected';
    item.rejectionReason = req.body?.reason;
    await item.save();
 
    if (item.addedBy) {
      await ActivityLog.create({
        user: item.addedBy,
        type: 'equipment_rejected',
        equipment: item._id,
        message: `${item.name} was rejected${req.body?.reason ? `: ${req.body.reason}` : ''}`,
      });
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});
 
// GET /api/admin/bookings/pending
router.get('/bookings/pending', async (req, res, next) => {
  try {
    const bookings = await Booking.find({ status: 'pending' })
      .populate('equipment user')
      .sort({ createdAt: 1 });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
});
 
// PATCH /api/admin/bookings/:id/approve
router.patch('/bookings/:id/approve', async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Not found' });
    if (booking.status !== 'pending') {
      return res.status(400).json({ error: `Booking is "${booking.status}", not pending` });
    }
 
    booking.status = 'approved';
    await booking.save();

    await Equipment.findByIdAndUpdate(booking.equipment, { availability: 'booked' });

    await ActivityLog.create({
      user: booking.user,
      type: 'booking_approved',
      booking: booking._id,
      equipment: booking.equipment,
      message: 'Booking approved',
    });
    res.json(booking);
  } catch (err) {
    next(err);
  }
});
 
// PATCH /api/admin/bookings/:id/reject
router.patch('/bookings/:id/reject', async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Not found' });
    if (booking.status !== 'pending') {
      return res.status(400).json({ error: `Booking is "${booking.status}", not pending` });
    }
 
    booking.status = 'rejected';
    await booking.save();
 
    await ActivityLog.create({
      user: booking.user,
      type: 'booking_rejected',
      booking: booking._id,
      equipment: booking.equipment,
      message: 'Booking rejected',
    });
    res.json(booking);
  } catch (err) {
    next(err);
  }
});
 
// GET /api/admin/bookings/flagged — returned bookings the AI similarity
// check flagged, that no admin has cleared yet. This is "handle problematic
// / damaged equipment": the review queue, not an automatic verdict.
router.get('/bookings/flagged', async (req, res, next) => {
  try {
    const bookings = await Booking.find({
      'returnCondition.aiFlagged': true,
      'returnCondition.adminReviewed': { $ne: true },
    })
      .populate('equipment user')
      .sort({ updatedAt: -1 });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
});
 
// PATCH /api/admin/bookings/:id/resolve-condition — admin's verdict on a
// flagged pickup/return pair: clear it, and optionally attach a damage fee.
router.patch('/bookings/:id/resolve-condition', async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Not found' });
    if (!booking.returnCondition) {
      return res.status(400).json({ error: 'No return condition recorded on this booking' });
    }
 
    const { damageFee, note } = req.body;
    booking.returnCondition.adminReviewed = true;
    if (note) {
      booking.returnCondition.notes = [booking.returnCondition.notes, `[admin] ${note}`]
        .filter(Boolean)
        .join('\n');
    }
    if (damageFee) {
      booking.charges.damageFee = Number(damageFee);
      booking.charges.status = 'pending';
    }
    await booking.save();
 
    await ActivityLog.create({
      user: booking.user,
      type: 'condition_flagged',
      booking: booking._id,
      equipment: booking.equipment,
      message: damageFee ? `Admin applied a damage fee of ${damageFee}` : 'Admin cleared flagged condition',
    });
 
    res.json(booking);
  } catch (err) {
    next(err);
  }
});
 
// GET /api/admin/activity — system-wide log, not just one user's. Filter
// with ?type= to narrow (see ActivityLog's enum for valid values).
router.get('/activity', async (req, res, next) => {
  try {
    const { type, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    const activity = await ActivityLog.find(filter)
      .populate('user equipment booking')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));
    res.json(activity);
  } catch (err) {
    next(err);
  }
});
 
module.exports = router;

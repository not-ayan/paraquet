const express = require('express');
const { User, Equipment, Booking, ActivityLog } = require('../models');
const { requireUser, requireAdmin } = require('../middleware/auth');
const { moveToApproved } = require('../services/cloudinary');
const memoryCache = require('../lib/cache');
const { csvRow } = require('../lib/csv');
const {
  sendBookingApprovedEmail,
  sendBookingRejectedEmail,
  sendConditionResolvedEmail,
} = require('../services/email');
const { checkAndNotifyOverdueBookings } = require('../services/overdue');

const router = express.Router();
 
router.use(requireUser, requireAdmin);
 
// GET /api/admin/users — view users, ?q= searches name/email, ?role= filters
router.get('/users', async (req, res, next) => {
  try {
    const { q, role, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
      ];
    }
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();
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
      .skip((Number(page) - 1) * Number(limit))
      .lean();
    res.json(items);
  } catch (err) {
    next(err);
  }
});
 
// GET /api/admin/equipment/pending
router.get('/equipment/pending', async (req, res, next) => {
  try {
    const items = await Equipment.find({ approvalStatus: 'pending' })
      .sort({ createdAt: 1 })
      .lean();
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
 
    // Promote images in Cloudinary from 'submitted' to 'approved' folder
    if (item.images && item.images.length > 0) {
      const updatedImages = await Promise.all(
        item.images.map((img) => moveToApproved(img))
      );
      item.images = updatedImages;
    }

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
    memoryCache.clearPrefix('equipment:');
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
    memoryCache.clearPrefix('equipment:');
    res.json(item);
  } catch (err) {
    next(err);
  }
});
 
// DELETE /api/admin/equipment/:id — permanently delete equipment
router.delete('/equipment/:id', async (req, res, next) => {
  try {
    const item = await Equipment.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });

    // Cancel any pending or approved bookings for this item to prevent orphans
    await Booking.updateMany(
      { equipment: item._id, status: { $in: ['pending', 'approved'] } },
      { status: 'cancelled', cancelReason: 'Equipment deleted by administrator' }
    );

    await item.deleteOne();

    if (item.addedBy) {
      await ActivityLog.create({
        user: req.dbUser._id,
        type: 'equipment_rejected',
        equipment: item._id,
        message: `Admin deleted equipment: ${item.name}`,
      });
    }

    memoryCache.clearPrefix('equipment:');
    res.json({ success: true, message: `Equipment "${item.name}" deleted successfully` });
  } catch (err) {
    next(err);
  }
});
 
// GET /api/admin/bookings/pending
router.get('/bookings/pending', async (req, res, next) => {
  try {
    const bookings = await Booking.find({ status: 'pending' })
      .populate('equipment user')
      .sort({ createdAt: 1 })
      .lean();
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
    await booking.populate('equipment user');

    const now = new Date();
    const equipId = booking.equipment?._id || booking.equipment;
    if (new Date(booking.startDate) <= now && new Date(booking.endDate) >= now) {
      await Equipment.findByIdAndUpdate(equipId, { availability: 'booked' });
    } else {
      await Equipment.findByIdAndUpdate(equipId, { availability: 'available' });
    }

    await ActivityLog.create({
      user: booking.user?._id || booking.user,
      type: 'booking_approved',
      booking: booking._id,
      equipment: equipId,
      message: 'Booking approved',
    });

    // Fire-and-forget approval confirmation email to borrower
    sendBookingApprovedEmail({
      user: booking.user,
      equipment: booking.equipment,
      booking,
    }).catch((err) => console.warn('[Email] Error sending approval email:', err.message));

    memoryCache.clearPrefix('equipment:');
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
    booking.cancelReason = req.body?.reason;
    await booking.save();
    await booking.populate('equipment user');

    const equipId = booking.equipment?._id || booking.equipment;
    await ActivityLog.create({
      user: booking.user?._id || booking.user,
      type: 'booking_rejected',
      booking: booking._id,
      equipment: equipId,
      message: req.body?.reason ? `Booking rejected: ${req.body.reason}` : 'Booking rejected',
    });

    // Fire-and-forget rejection notice email to borrower
    sendBookingRejectedEmail({
      user: booking.user,
      equipment: booking.equipment,
      booking,
      reason: req.body?.reason,
    }).catch((err) => console.warn('[Email] Error sending rejection email:', err.message));

    memoryCache.clearPrefix('equipment:');
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
      .sort({ updatedAt: -1 })
      .lean();
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
      if (!booking.charges) {
        booking.charges = { overdueFee: 0, damageFee: 0, status: 'none' };
      }
      booking.charges.damageFee = Number(damageFee);
      booking.charges.status = 'pending';
    }
    await booking.save();
    await booking.populate('equipment user');

    const equipId = booking.equipment?._id || booking.equipment;
    await ActivityLog.create({
      user: booking.user?._id || booking.user,
      type: 'condition_flagged',
      booking: booking._id,
      equipment: equipId,
      message: damageFee ? `Admin applied a damage fee of ₹${damageFee}` : 'Admin cleared flagged condition',
    });

    // Fire-and-forget condition resolution email to borrower
    sendConditionResolvedEmail({
      user: booking.user,
      equipment: booking.equipment,
      booking,
      damageFee: Number(damageFee || 0),
      note,
    }).catch((err) => console.warn('[Email] Error sending condition resolved email:', err.message));

    res.json(booking);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/bookings/check-overdue — sweep overdue loans past endDate and email borrowers
router.post('/bookings/check-overdue', async (req, res, next) => {
  try {
    const report = await checkAndNotifyOverdueBookings();
    res.json({ success: true, ...report });
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
      .skip((Number(page) - 1) * Number(limit))
      .lean();
    res.json(activity);
  } catch (err) {
    next(err);
  }
});
 
// GET /api/admin/export/csv — full data export as one CSV file: users,
// activity log, and equipment (each as its own section, since they don't
// share a column schema). Meant for offline reporting/backup, not pagination.
router.get('/export/csv', async (req, res, next) => {
  try {
    const [users, activity, equipment] = await Promise.all([
      User.find().sort({ createdAt: -1 }).lean(),
      ActivityLog.find().populate('user equipment booking').sort({ createdAt: -1 }).lean(),
      Equipment.find().populate('addedBy').sort({ createdAt: -1 }).lean(),
    ]);

    let csv = '';

    csv += csvRow(['USERS']);
    csv += csvRow(['ID', 'Name', 'Email', 'Role', 'Phone', 'Created At']);
    for (const u of users) {
      csv += csvRow([u._id, u.name || '', u.email, u.role, u.phone || '', u.createdAt]);
    }
    csv += '\r\n';

    csv += csvRow(['ACTIVITY LOG']);
    csv += csvRow(['ID', 'Type', 'User', 'Equipment', 'Booking ID', 'Message', 'Created At']);
    for (const log of activity) {
      csv += csvRow([
        log._id,
        log.type,
        log.user ? log.user.name || log.user.email : '',
        log.equipment ? log.equipment.name : '',
        log.booking?._id || log.booking || '',
        log.message || '',
        log.createdAt,
      ]);
    }
    csv += '\r\n';

    csv += csvRow(['EQUIPMENT']);
    csv += csvRow([
      'ID', 'Name', 'Category', 'Quantity', 'Condition', 'Condition Notes',
      'Approval Status', 'Availability', 'Max Borrow Days', 'Added By', 'Created At',
    ]);
    for (const e of equipment) {
      csv += csvRow([
        e._id,
        e.name,
        e.category || '',
        e.quantity,
        e.condition?.status || '',
        e.condition?.notes || '',
        e.approvalStatus,
        e.availability,
        e.maxBorrowDays,
        e.addedBy ? e.addedBy.name || e.addedBy.email : '',
        e.createdAt,
      ]);
    }

    const filename = `admin-export-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

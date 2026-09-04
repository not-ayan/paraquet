const express = require('express');
const { Equipment, Booking, ActivityLog } = require('../models');
const { requireUser, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(requireUser, requireAdmin);

// GET /api/admin/equipment/pending
router.get('/equipment/pending', async (req, res, next) => {
  try {
    const items = await Equipment.find({ approvalStatus: 'pending' }).sort({ createdAt: 1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

const { moveToApproved } = require('../services/cloudinary');

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

module.exports = router;

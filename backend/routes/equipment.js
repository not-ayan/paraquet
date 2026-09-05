const express = require('express');
const { Equipment, Booking, ActivityLog } = require('../models');
const { requireUser } = require('../middleware/auth');
const memoryCache = require('../lib/cache');
const { isDbConnected } = require('../lib/db');

const router = express.Router();

// GET /api/equipment — public catalogue + search + date-wise availability checking
router.get('/', async (req, res, next) => {
  try {
    const { q, category, tag, startDate, endDate, availableOnly, page = 1, limit = 50 } = req.query;

    // Fast-path: return cached catalogue response if present
    const cacheKey = `equipment:list:${JSON.stringify(req.query)}`;
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    if (!isDbConnected()) {
      return res.status(503).json({ 
        error: 'Database connection is initializing or reconnecting. Please retry in a moment.' 
      });
    }

    const filter = { approvalStatus: 'approved' };
    if (category && category !== 'All') filter.category = category;
    if (tag) filter.tags = tag;
    if (q) filter.$text = { $search: q };

    let items = await Equipment.find(filter)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 })
      .lean();

    const now = new Date();
    const equipmentIds = items.map((i) => i._id);

    // Fetch active & upcoming bookings that haven't ended yet
    const activeAndFutureBookings = await Booking.find({
      equipment: { $in: equipmentIds },
      status: { $in: ['pending', 'approved', 'active'] },
      endDate: { $gte: now },
    }).sort({ startDate: 1 }).lean();

    // Map each item with dynamic real-time status and upcoming reservation metadata
    items = items.map((item) => {
      const itemBookings = activeAndFutureBookings.filter(
        (b) => b.equipment.toString() === item._id.toString()
      );

      // Truly in custody right now
      const currentInUse = itemBookings.find(
        (b) => b.status === 'active' || (b.status === 'approved' && new Date(b.startDate) <= now && new Date(b.endDate) >= now)
      );

      // Future booked reservation
      const futureBooking = itemBookings.find(
        (b) => (b.status === 'approved' || b.status === 'pending') && new Date(b.startDate) > now
      );

      let effectiveAvailability = item.availability;
      if (item.availability !== 'maintenance' && item.availability !== 'retired') {
        effectiveAvailability = currentInUse ? 'booked' : 'available';
      }

      let upcomingReservation = null;
      if (futureBooking) {
        const startStr = new Date(futureBooking.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = new Date(futureBooking.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        upcomingReservation = {
          startDate: futureBooking.startDate,
          endDate: futureBooking.endDate,
          status: futureBooking.status,
          formatted: `Booked ${startStr} – ${endStr}`,
        };
      }

      return {
        ...item,
        maxBorrowDays: item.maxBorrowDays || 3,
        availability: effectiveAvailability,
        effectiveAvailability,
        upcomingReservation,
      };
    });

    // If date range is specified, evaluate overlapping bookings for each equipment
    if (startDate && endDate) {
      const reqStart = new Date(startDate);
      const reqEnd = new Date(endDate);

      if (!isNaN(reqStart.getTime()) && !isNaN(reqEnd.getTime())) {
        items = items.map((item) => {
          const itemBookings = activeAndFutureBookings.filter(
            (b) => b.equipment.toString() === item._id.toString()
          );

          // An interval conflict only happens if dates overlap
          const itemConflicts = itemBookings.filter(
            (b) => new Date(b.startDate) < reqEnd && new Date(b.endDate) > reqStart
          );

          const isUnderMaintenance = item.availability === 'maintenance';
          const isRetired = item.availability === 'retired';
          const hasBookingConflict = itemConflicts.length > 0;

          const isAvailable = !isUnderMaintenance && !isRetired && !hasBookingConflict;

          let conflictReason = undefined;
          if (isUnderMaintenance) {
            conflictReason = 'Under maintenance';
          } else if (isRetired) {
            conflictReason = 'Equipment retired';
          } else if (hasBookingConflict) {
            const conflict = itemConflicts[0];
            const startStr = new Date(conflict.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const endStr = new Date(conflict.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            conflictReason = `Booked (${startStr} – ${endStr})`;
          }

          return {
            ...item,
            dateAvailability: {
              isAvailable,
              conflictReason,
              conflictCount: itemConflicts.length,
            },
          };
        });

        if (availableOnly === 'true' || availableOnly === true) {
          items = items.filter((item) => item.dateAvailability?.isAvailable);
        }
      }
    }

    // Cache catalogue results for 20 seconds
    memoryCache.set(cacheKey, items, 20);
    res.setHeader('X-Cache', 'MISS');
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// GET /api/equipment/:id
router.get('/:id', async (req, res, next) => {
  try {
    const cacheKey = `equipment:detail:${req.params.id}`;
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database is reconnecting. Please retry.' });
    }

    const item = await Equipment.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });

    const now = new Date();
    const itemBookings = await Booking.find({
      equipment: item._id,
      status: { $in: ['pending', 'approved', 'active'] },
      endDate: { $gte: now },
    }).sort({ startDate: 1 }).lean();

    const currentInUse = itemBookings.find(
      (b) => b.status === 'active' || (b.status === 'approved' && new Date(b.startDate) <= now && new Date(b.endDate) >= now)
    );

    const futureBooking = itemBookings.find(
      (b) => (b.status === 'approved' || b.status === 'pending') && new Date(b.startDate) > now
    );

    let effectiveAvailability = item.availability;
    if (item.availability !== 'maintenance' && item.availability !== 'retired') {
      effectiveAvailability = currentInUse ? 'booked' : 'available';
    }

    let upcomingReservation = null;
    if (futureBooking) {
      const startStr = new Date(futureBooking.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endStr = new Date(futureBooking.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      upcomingReservation = {
        startDate: futureBooking.startDate,
        endDate: futureBooking.endDate,
        status: futureBooking.status,
        formatted: `Booked ${startStr} – ${endStr}`,
      };
    }

    const payload = {
      ...item,
      maxBorrowDays: item.maxBorrowDays || 3,
      availability: effectiveAvailability,
      effectiveAvailability,
      upcomingReservation,
    };

    memoryCache.set(cacheKey, payload, 30);
    res.setHeader('X-Cache', 'MISS');
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

// POST /api/equipment — any signed-in user can propose an item; starts pending
router.post('/', requireUser, async (req, res, next) => {
  try {
    const { name, description, category, tags, images, quantity, location, maxBorrowDays } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const item = await Equipment.create({
      name,
      description,
      category,
      tags,
      images,
      quantity,
      location,
      maxBorrowDays: maxBorrowDays ? Math.max(1, Math.min(30, Number(maxBorrowDays))) : 3,
      addedBy: req.dbUser._id,
    });

    await ActivityLog.create({
      user: req.dbUser._id,
      type: 'equipment_added',
      equipment: item._id,
      message: `Added ${item.name} (pending approval)`,
    });

    memoryCache.clearPrefix('equipment:');
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/equipment/:id — owner or admin only
router.patch('/:id', requireUser, async (req, res, next) => {
  try {
    const item = await Equipment.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });

    const isOwner = item.addedBy?.toString() === req.dbUser._id.toString();
    if (!isOwner && req.dbUser.role !== 'admin') {
      return res.status(403).json({ error: 'Not allowed' });
    }

    const editable = ['name', 'description', 'category', 'tags', 'images', 'quantity', 'location', 'condition', 'availability', 'maxBorrowDays'];
    editable.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'maxBorrowDays') {
          item.maxBorrowDays = Math.max(1, Math.min(30, Number(req.body[field]) || 3));
        } else {
          item[field] = req.body[field];
        }
      }
    });

    await item.save();
    memoryCache.clearPrefix('equipment:');
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/equipment/:id/status — WEB-C08: Record status change with previousValue, newValue, time, and reason
router.patch('/:id/status', requireUser, async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    if (!status) return res.status(400).json({ error: 'New status is required' });
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'A justification reason is required for status changes (WEB-C08)' });
    }

    const validStatuses = ['available', 'booked', 'maintenance', 'retired'];
    const normalizedStatus = status.toLowerCase();
    if (!validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ 
        error: `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const item = await Equipment.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Equipment not found' });

    const previousValue = item.availability || 'available';
    const newValue = normalizedStatus;

    item.availability = newValue;

    const rawUserName = req.headers['x-user-name'];
    const authorName = rawUserName 
      ? decodeURIComponent(rawUserName) 
      : (req.dbUser?.name || 'Community Steward');

    const historyRecord = {
      previousValue,
      newValue,
      reason: reason.trim(),
      changedAt: new Date(),
      changedBy: req.dbUser?._id,
      changedByName: authorName,
    };

    if (!Array.isArray(item.statusHistory)) {
      item.statusHistory = [];
    }
    item.statusHistory.unshift(historyRecord);

    await item.save();

    // Create activity audit entry for the event stream
    await ActivityLog.create({
      user: req.dbUser._id,
      type: 'equipment_status_changed',
      equipment: item._id,
      message: `Equipment status changed from ${previousValue.toUpperCase()} to ${newValue.toUpperCase()}: "${reason.trim()}"`,
    });

    memoryCache.clearPrefix('equipment:');
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/equipment/:id — owner or admin only
router.delete('/:id', requireUser, async (req, res, next) => {
  try {
    const item = await Equipment.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });

    const isOwner = item.addedBy?.toString() === req.dbUser._id.toString();
    if (!isOwner && req.dbUser.role !== 'admin') {
      return res.status(403).json({ error: 'Not allowed' });
    }

    await item.deleteOne();
    memoryCache.clearPrefix('equipment:');
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;

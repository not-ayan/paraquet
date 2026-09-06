const express = require('express');
const { Equipment, Booking, ActivityLog } = require('../models');
const { requireUser } = require('../middleware/auth');
const { sendEquipmentSubmittedEmail } = require('../services/email');
const memoryCache = require('../lib/cache');
const { isDbConnected } = require('../lib/db');
const {
  isValidObjectId,
  sanitizeString,
  sanitizeNumber,
  sanitizeArray,
} = require('../lib/sanitize');

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
      .populate('addedBy', 'name email clerkId avatarUrl')
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

// GET /api/equipment/my — all equipment listed by logged-in user
router.get('/my', requireUser, async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database is reconnecting. Please retry.' });
    }
    const items = await Equipment.find({ addedBy: req.dbUser._id })
      .populate('addedBy', 'name email clerkId avatarUrl')
      .sort({ createdAt: -1 })
      .lean();
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// GET /api/equipment/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid equipment ID format' });
    }

    const cacheKey = `equipment:${id}`;
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database is reconnecting. Please retry.' });
    }

    const item = await Equipment.findById(id)
      .populate('addedBy', 'name email clerkId avatarUrl')
      .lean();
    if (!item) return res.status(404).json({ error: 'Equipment not found' });

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
    const name = sanitizeString(req.body.name, 150);
    const description = sanitizeString(req.body.description, 2000);
    const category = sanitizeString(req.body.category, 60) || 'General';
    const location = sanitizeString(req.body.location, 200) || 'Tezpur University, Assam';
    const tags = sanitizeArray(req.body.tags, 10, (t) => sanitizeString(t, 40));
    const images = sanitizeArray(req.body.images, 10, (img) => sanitizeString(img, 1000));
    const quantity = sanitizeNumber(req.body.quantity, 1, 100, 1);
    const maxBorrowDays = sanitizeNumber(req.body.maxBorrowDays, 1, 30, 3);
    const rawCondition = req.body.condition?.status || req.body.condition || 'good';
    const conditionStatus = ['excellent', 'good', 'fair'].includes(String(rawCondition).toLowerCase())
      ? String(rawCondition).toLowerCase()
      : 'good';

    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Equipment name is required and must be at least 2 characters.' });
    }

    const item = await Equipment.create({
      name,
      description,
      category,
      tags,
      images,
      quantity,
      location,
      condition: { status: conditionStatus },
      maxBorrowDays,
      addedBy: req.dbUser._id,
    });

    await ActivityLog.create({
      user: req.dbUser._id,
      type: 'equipment_added',
      equipment: item._id,
      message: `Added ${item.name} (pending approval)`,
    });

    // Send confirmation email to the equipment submitter
    sendEquipmentSubmittedEmail({
      user: req.dbUser,
      equipment: item,
    }).catch((err) => console.warn('[Email] Error sending equipment submitted email:', err.message));

    memoryCache.clearPrefix('equipment:');
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/equipment/:id — owner or admin only
router.patch('/:id', requireUser, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid equipment ID format' });
    }

    const item = await Equipment.findById(id);
    if (!item) return res.status(404).json({ error: 'Equipment not found' });

    const isOwner = item.addedBy?.toString() === req.dbUser._id.toString();
    if (!isOwner && req.dbUser.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to modify this equipment.' });
    }

    if (req.body.name !== undefined) item.name = sanitizeString(req.body.name, 150);
    if (req.body.description !== undefined) item.description = sanitizeString(req.body.description, 2000);
    if (req.body.category !== undefined) item.category = sanitizeString(req.body.category, 60);
    if (req.body.location !== undefined) item.location = sanitizeString(req.body.location, 200);
    if (req.body.tags !== undefined) item.tags = sanitizeArray(req.body.tags, 10, (t) => sanitizeString(t, 40));
    if (req.body.images !== undefined) item.images = sanitizeArray(req.body.images, 10, (img) => sanitizeString(img, 1000));
    if (req.body.quantity !== undefined) item.quantity = sanitizeNumber(req.body.quantity, 1, 100, item.quantity);
    if (req.body.maxBorrowDays !== undefined) item.maxBorrowDays = sanitizeNumber(req.body.maxBorrowDays, 1, 30, item.maxBorrowDays || 3);
    if (req.body.condition !== undefined) {
      const rawCondition = req.body.condition?.status || req.body.condition;
      if (['excellent', 'good', 'fair'].includes(String(rawCondition).toLowerCase())) {
        item.condition = { status: String(rawCondition).toLowerCase() };
      }
    }

    const rawAvailability = req.body.availability !== undefined ? req.body.availability : req.body.status;
    if (rawAvailability !== undefined) {
      const validStatuses = ['available', 'booked', 'maintenance', 'retired'];
      const normalizedStatus = sanitizeString(rawAvailability, 30).toLowerCase();
      if (validStatuses.includes(normalizedStatus)) {
        const previousValue = item.availability || 'available';
        if (previousValue !== normalizedStatus) {
          item.availability = normalizedStatus;
          const rawUserName = req.headers['x-user-name'];
          const authorName = rawUserName 
            ? sanitizeString(decodeURIComponent(rawUserName), 100) 
            : (req.dbUser?.name || 'Administrator');
          const historyRecord = {
            previousValue,
            newValue: normalizedStatus,
            reason: sanitizeString(req.body.reason, 500) || 'Updated via Admin Console',
            changedAt: new Date(),
            changedBy: req.dbUser?._id,
            changedByName: authorName,
          };
          if (!Array.isArray(item.statusHistory)) {
            item.statusHistory = [];
          }
          item.statusHistory.unshift(historyRecord);
          await ActivityLog.create({
            user: req.dbUser._id,
            type: 'equipment_status_changed',
            equipment: item._id,
            message: `Equipment status changed from ${previousValue.toUpperCase()} to ${normalizedStatus.toUpperCase()}: "${historyRecord.reason}"`,
          });
        }
      }
    }

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
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid equipment ID format' });
    }

    const rawStatus = sanitizeString(req.body.status, 30);
    const reason = sanitizeString(req.body.reason, 500);

    if (!rawStatus) return res.status(400).json({ error: 'New status is required' });
    if (!reason || reason.length < 3) {
      return res.status(400).json({ error: 'A justification reason of at least 3 characters is required for status changes (WEB-C08)' });
    }

    const validStatuses = ['available', 'booked', 'maintenance', 'retired'];
    const normalizedStatus = rawStatus.toLowerCase();
    if (!validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ 
        error: `Invalid status: ${rawStatus}. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const item = await Equipment.findById(id);
    if (!item) return res.status(404).json({ error: 'Equipment not found' });

    const previousValue = item.availability || 'available';
    const newValue = normalizedStatus;

    item.availability = newValue;

    const rawUserName = req.headers['x-user-name'];
    const authorName = rawUserName 
      ? sanitizeString(decodeURIComponent(rawUserName), 100) 
      : (req.dbUser?.name || 'Community Steward');

    const historyRecord = {
      previousValue,
      newValue,
      reason,
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
      message: `Equipment status changed from ${previousValue.toUpperCase()} to ${newValue.toUpperCase()}: "${reason}"`,
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
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid equipment ID format' });
    }

    const item = await Equipment.findById(id);
    if (!item) return res.status(404).json({ error: 'Equipment not found' });

    const isOwner = item.addedBy?.toString() === req.dbUser._id.toString();
    if (!isOwner && req.dbUser.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this equipment.' });
    }

    // Cancel any pending or approved bookings for this item to prevent orphans
    await Booking.updateMany(
      { equipment: item._id, status: { $in: ['pending', 'approved'] } },
      { status: 'cancelled', cancelReason: 'Equipment deleted by owner/administrator' }
    );

    await item.deleteOne();
    memoryCache.clearPrefix('equipment:');
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;

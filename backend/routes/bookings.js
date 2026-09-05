const express = require('express');
const { Booking, Equipment, ActivityLog } = require('../models');
const { requireUser } = require('../middleware/auth');
const { compareConditionPhotos, analyzeIssueCondition } = require('../services/aiCondition');
const memoryCache = require('../lib/cache');
const {
  sendBookingRequestedEmail,
  sendPickupConfirmedEmail,
  sendReturnConfirmedEmail,
} = require('../services/email');
const {
  isValidObjectId,
  sanitizeString,
  sanitizeEmail,
  sanitizeDate,
  sanitizeArray,
} = require('../lib/sanitize');

const router = express.Router();

const ACTIVE_STATUSES = ['pending', 'approved', 'active'];
const OVERDUE_RATE_PER_DAY = 250; // flat fee per day late in INR (₹250/day)

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
      .populate('equipment user')
      .sort({ createdAt: -1 })
      .lean();
    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

// GET /api/bookings/equipment/:equipmentId — public schedule for equipment
router.get('/equipment/:equipmentId', async (req, res, next) => {
  try {
    const { equipmentId } = req.params;
    if (!isValidObjectId(equipmentId)) {
      return res.status(400).json({ error: 'Invalid equipment ID format' });
    }

    const bookings = await Booking.find({
      equipment: equipmentId,
      status: { $in: ['pending', 'approved', 'active', 'overdue'] },
    })
      .populate('user', 'name email avatarUrl clerkId')
      .sort({ startDate: 1 })
      .lean();
    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

// GET /api/bookings/:id
router.get('/:id', requireUser, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid booking ID format' });
    }

    const booking = await Booking.findById(id).populate('equipment user').lean();
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const ownerId = booking.user?._id ? booking.user._id.toString() : booking.user?.toString();
    const isOwner = ownerId === req.dbUser._id.toString();
    if (!isOwner && req.dbUser.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to view this booking.' });
    }
    res.json(booking);
  } catch (err) {
    next(err);
  }
});

// POST /api/bookings
router.post('/', requireUser, async (req, res, next) => {
  try {
    const equipmentId = req.body.equipmentId;
    if (!isValidObjectId(equipmentId)) {
      return res.status(400).json({ error: 'Valid equipmentId is required' });
    }

    const start = sanitizeDate(req.body.startDate);
    const end = sanitizeDate(req.body.endDate);
    if (!start || !end) {
      return res.status(400).json({ error: 'Valid startDate and endDate in ISO/Date format are required' });
    }

    if (!(start < end)) {
      return res.status(400).json({ error: 'startDate must be before endDate' });
    }

    const location = sanitizeString(req.body.location, 200);
    const purpose = sanitizeString(req.body.purpose, 500) || 'Academic / Project Work';
    const borrowerName = sanitizeString(req.body.borrowerName, 100);
    const borrowerEmail = sanitizeEmail(req.body.borrowerEmail);

    // Sync borrower name to user profile if provided
    if (borrowerName && (!req.dbUser.name || req.dbUser.name === 'Student Borrower' || req.dbUser.name !== borrowerName)) {
      req.dbUser.name = borrowerName;
      if (borrowerEmail && (!req.dbUser.email || req.dbUser.email.includes('placeholder.local'))) {
        req.dbUser.email = borrowerEmail;
      }
      await req.dbUser.save();
    }

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment || equipment.approvalStatus !== 'approved') {
      return res.status(404).json({ error: 'Equipment is not approved or unavailable' });
    }

    // Owner protection: prevent listing owners from borrowing their own gear
    if (equipment.addedBy && equipment.addedBy.toString() === req.dbUser._id.toString()) {
      return res.status(400).json({ error: 'You cannot borrow your own listed equipment.' });
    }

    const maxDays = equipment.maxBorrowDays || 3;
    const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (durationDays > maxDays) {
      return res.status(400).json({ error: `Selected loan duration (${durationDays} days) exceeds maximum allowed of ${maxDays} days` });
    }

    if (await hasConflict(equipmentId, start, end)) {
      return res.status(409).json({ error: 'Equipment is already reserved or booked for that date range' });
    }

    const booking = await Booking.create({
      user: req.dbUser._id,
      equipment: equipmentId,
      startDate: start,
      endDate: end,
      location: location || equipment.location || 'Tezpur University, Assam (Central Lab)',
      purpose,
    });

    await ActivityLog.create({
      user: req.dbUser._id,
      type: 'booking_created',
      booking: booking._id,
      equipment: equipmentId,
      message: `Requested ${equipment.name}`,
    });

    await booking.populate('equipment user');
    memoryCache.clearPrefix('equipment:');

    // Fire-and-forget confirmation email to borrower
    sendBookingRequestedEmail({
      user: booking.user,
      equipment: booking.equipment,
      booking,
    }).catch((err) => console.warn('[Email] Error sending booking requested email:', err.message));

    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/bookings/:id/cancel
router.patch('/:id/cancel', requireUser, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid booking ID format' });
    }

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const isOwner = booking.user.toString() === req.dbUser._id.toString();
    if (!isOwner && req.dbUser.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to cancel this booking.' });
    }
    if (!['pending', 'approved'].includes(booking.status)) {
      return res.status(400).json({ error: `Cannot cancel a booking in status "${booking.status}"` });
    }

    const reason = sanitizeString(req.body?.reason, 500);
    booking.status = 'cancelled';
    booking.cancelReason = reason || undefined;
    await booking.save();

    await ActivityLog.create({
      user: booking.user,
      type: 'booking_cancelled',
      booking: booking._id,
      equipment: booking.equipment,
      message: reason ? `Booking cancelled: "${reason}"` : 'Booking cancelled',
    });

    memoryCache.clearPrefix('equipment:');
    res.json(booking);
  } catch (err) {
    next(err);
  }
});

// POST /api/bookings/:id/pickup-condition
router.post('/:id/pickup-condition', requireUser, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid booking ID format' });
    }

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const isOwner = booking.user.toString() === req.dbUser._id.toString();
    if (!isOwner && req.dbUser.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to record pickup condition.' });
    }
    if (booking.status !== 'approved') {
      return res.status(400).json({ error: `Booking must be in "approved" status to record pickup, currently "${booking.status}"` });
    }

    const photos = sanitizeArray(req.body.photos, 10, (img) => sanitizeString(img, 1000));
    const notes = sanitizeString(req.body.notes, 1000);
    const rawCondition = sanitizeString(req.body.condition || 'good', 30).toLowerCase();
    const conditionNormalized = ['excellent', 'good', 'fair'].includes(rawCondition) ? rawCondition : 'good';

    if (!photos.length) {
      return res.status(400).json({ error: 'At least one clear photo is required for pickup condition inspection.' });
    }

    // Fetch equipment details for AI prompt context
    const equipment = await Equipment.findById(booking.equipment);
    const equipmentName = equipment?.name || 'Equipment Item';
    const category = equipment?.category || 'General';

    // AI hook — analyze physical baseline condition upon issue
    const aiAnalysis = await analyzeIssueCondition(photos, equipmentName, category);

    booking.pickupCondition = {
      photos,
      notes,
      condition: conditionNormalized,
      aiAnalysis,
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
      message: `Pickup inspection recorded (${conditionNormalized.toUpperCase()} • ${aiAnalysis?.detailedSummary ? 'AI Baseline Verified' : 'Standard Check'})`,
      conditionReport: {
        type: 'pickup',
        condition: conditionNormalized,
        photos,
        notes: notes ? `${notes} | AI: ${aiAnalysis?.detailedSummary || ''}` : aiAnalysis?.detailedSummary || '',
        aiAnalysis,
        recordedAt: new Date(),
      },
    });

    await booking.populate('equipment user');
    memoryCache.clearPrefix('equipment:');

    // Fire-and-forget pickup confirmation email to borrower
    sendPickupConfirmedEmail({
      user: booking.user,
      equipment: booking.equipment,
      booking,
    }).catch((err) => console.warn('[Email] Error sending pickup confirmed email:', err.message));

    res.json(booking);
  } catch (err) {
    next(err);
  }
});

// POST /api/bookings/:id/return-condition
router.post('/:id/return-condition', requireUser, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid booking ID format' });
    }

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const isOwner = booking.user.toString() === req.dbUser._id.toString();
    if (!isOwner && req.dbUser.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to record return condition.' });
    }
    if (!['active', 'overdue'].includes(booking.status)) {
      return res.status(400).json({ error: `Booking must be in "active" status to record return, currently "${booking.status}"` });
    }

    const photos = sanitizeArray(req.body.photos, 10, (img) => sanitizeString(img, 1000));
    const notes = sanitizeString(req.body.notes, 1000);
    const rawCondition = sanitizeString(req.body.condition || 'good', 30).toLowerCase();
    const conditionNormalized = ['excellent', 'good', 'fair', 'damaged'].includes(rawCondition) ? rawCondition : 'good';

    if (!photos.length) {
      return res.status(400).json({ error: 'At least one clear photo is required for return condition inspection.' });
    }

    const equipment = await Equipment.findById(booking.equipment);
    const equipmentName = equipment?.name || 'Equipment Item';

    // AI comparison hook — compares return photos against pickup photos for cosmetic vs actual damage
    const aiVerdict = await compareConditionPhotos(
      booking.pickupCondition?.photos || [],
      photos,
      equipmentName,
      booking.pickupCondition?.aiAnalysis || null
    );
    const { flagged = false, similarityScore = 1 } = aiVerdict || {};

    // If AI flagged structural/cosmetic damage, condition must reflect damage rather than unverified self-grade
    let finalCondition = conditionNormalized;
    if (flagged) {
      if (aiVerdict.damageType === 'structural' || aiVerdict.damageType === 'both') {
        finalCondition = 'damaged';
      } else if (aiVerdict.damageType === 'cosmetic' && ['excellent', 'good'].includes(conditionNormalized)) {
        finalCondition = 'fair';
      }
    }

    booking.returnCondition = {
      photos,
      notes,
      condition: finalCondition,
      aiSimilarityScore: similarityScore,
      aiFlagged: flagged,
      aiAnalysis: {
        detailedSummary: aiVerdict.detailedDiscrepancyReport,
        conditionRating: aiVerdict.conditionRating || finalCondition,
        cosmeticFlaws: aiVerdict.cosmeticDamageList || [],
        actualDamage: aiVerdict.actualDamageList || [],
        damageType: aiVerdict.damageType || 'none',
        damageDetected: aiVerdict.damageDetected,
        detailedDiscrepancyReport: aiVerdict.detailedDiscrepancyReport,
        recommendedAction: aiVerdict.recommendedAction,
      },
      recordedBy: req.dbUser._id,
      recordedAt: new Date(),
    };

    const now = new Date();
    let daysLate = 0;
    if (now > booking.endDate) {
      daysLate = Math.ceil((now - booking.endDate) / (1000 * 60 * 60 * 24));
      if (!booking.charges) {
        booking.charges = { overdueFee: 0, damageFee: 0, status: 'none' };
      }
      booking.charges.overdueFee = daysLate * OVERDUE_RATE_PER_DAY;
      booking.charges.status = 'pending';
    }

    booking.status = 'returned';
    await booking.save();

    // Reset equipment availability to available and update condition rating
    if (equipment) {
      equipment.availability = 'available';
      if (flagged && (aiVerdict.damageType === 'structural' || aiVerdict.damageType === 'both')) {
        equipment.condition.status = 'under_repair';
      } else if (['good', 'fair', 'poor', 'under_repair'].includes(finalCondition)) {
        equipment.condition.status = finalCondition;
      }
      if (notes) equipment.condition.notes = notes;
      await equipment.save();
    }

    let returnMessage = `Return inspection recorded (${finalCondition.toUpperCase()})`;
    if (flagged) {
      returnMessage += ` • ⚠️ AI Discrepancy Flagged (${(aiVerdict.damageType || 'damage').toUpperCase()})`;
    } else if (typeof similarityScore === 'number') {
      returnMessage += ` • AI Verified (${Math.round(similarityScore * 100)}% Match)`;
    }
    if (booking.charges?.overdueFee > 0) {
      returnMessage += ` (Late penalty: ₹${booking.charges.overdueFee})`;
    }

    await ActivityLog.create({
      user: booking.user,
      type: 'return_recorded',
      booking: booking._id,
      equipment: booking.equipment,
      message: returnMessage,
      conditionReport: {
        type: 'return',
        condition: finalCondition,
        photos,
        notes: notes ? `${notes} | AI: ${aiVerdict.detailedDiscrepancyReport}` : aiVerdict.detailedDiscrepancyReport,
        aiSimilarityScore: similarityScore,
        aiFlagged: flagged,
        aiAnalysis: booking.returnCondition.aiAnalysis,
        recordedAt: new Date(),
      },
    });

    if (flagged) {
      // Audit log for admins — do not attach duplicate conditionReport
      await ActivityLog.create({
        user: booking.user,
        type: 'condition_flagged',
        booking: booking._id,
        equipment: booking.equipment,
        message: 'Discrepancy flagged by AI inspection check',
      });
    }

    await booking.populate('equipment user');
    memoryCache.clearPrefix('equipment:');

    // Fire-and-forget return confirmation email with AI verdict to borrower
    sendReturnConfirmedEmail({
      user: booking.user,
      equipment: booking.equipment,
      booking,
      aiVerdict,
      overdueFee: booking.charges?.overdueFee || 0,
    }).catch((err) => console.warn('[Email] Error sending return confirmed email:', err.message));

    res.json(booking);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

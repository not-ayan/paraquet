const express = require('express');
const { ActivityLog } = require('../models');
const { requireUser } = require('../middleware/auth');

const router = express.Router();

// GET /api/activity/me
router.get('/me', requireUser, async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    const activity = await ActivityLog.find({ user: req.dbUser._id })
      .populate('equipment', 'name category images location condition')
      .populate('booking', 'startDate endDate status pickupCondition returnCondition location borrowerName borrowerEmail')
      .populate('user', 'name email avatarUrl clerkId')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();
    res.json(activity);
  } catch (err) {
    next(err);
  }
});

// GET /api/activity/equipment/:equipmentId — audit/condition trail for equipment
router.get('/equipment/:equipmentId', async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    const activity = await ActivityLog.find({ equipment: req.params.equipmentId })
      .populate('equipment', 'name category images location condition')
      .populate('booking', 'startDate endDate status pickupCondition returnCondition location borrowerName borrowerEmail')
      .populate('user', 'name email avatarUrl clerkId')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();
    res.json(activity);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

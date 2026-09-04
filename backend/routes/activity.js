const express = require('express');
const { ActivityLog } = require('../models');
const { requireUser } = require('../middleware/auth');

const router = express.Router();

// GET /api/activity/me
router.get('/me', requireUser, async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    const activity = await ActivityLog.find({ user: req.dbUser._id })
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    res.json(activity);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

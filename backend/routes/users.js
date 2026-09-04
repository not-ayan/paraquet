const express = require('express');
const { requireUser } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/me
router.get('/me', requireUser, (req, res) => {
  res.json(req.dbUser);
});

// PATCH /api/users/me
router.patch('/me', requireUser, async (req, res, next) => {
  try {
    const { name, phone, avatarUrl } = req.body;
    if (name !== undefined) req.dbUser.name = name;
    if (phone !== undefined) req.dbUser.phone = phone;
    if (avatarUrl !== undefined) req.dbUser.avatarUrl = avatarUrl;
    await req.dbUser.save();
    res.json(req.dbUser);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

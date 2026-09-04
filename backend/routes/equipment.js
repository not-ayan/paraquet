const express = require('express');
const { Equipment, ActivityLog } = require('../models');
const { requireUser } = require('../middleware/auth');

const router = express.Router();

// GET /api/equipment — public catalogue + search
router.get('/', async (req, res, next) => {
  try {
    const { q, category, tag, page = 1, limit = 20 } = req.query;
    const filter = { approvalStatus: 'approved' };
    if (category) filter.category = category;
    if (tag) filter.tags = tag;
    if (q) filter.$text = { $search: q };

    const items = await Equipment.find(filter)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (err) {
    next(err);
  }
});

// GET /api/equipment/:id
router.get('/:id', async (req, res, next) => {
  try {
    const item = await Equipment.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/equipment — any signed-in user can propose an item; starts pending
router.post('/', requireUser, async (req, res, next) => {
  try {
    const { name, description, category, tags, images, quantity, location } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const item = await Equipment.create({
      name,
      description,
      category,
      tags,
      images,
      quantity,
      location,
      addedBy: req.dbUser._id,
    });

    await ActivityLog.create({
      user: req.dbUser._id,
      type: 'equipment_added',
      equipment: item._id,
      message: `Added ${item.name} (pending approval)`,
    });

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

    const editable = ['name', 'description', 'category', 'tags', 'images', 'quantity', 'location', 'condition', 'availability'];
    editable.forEach((field) => {
      if (req.body[field] !== undefined) item[field] = req.body[field];
    });

    await item.save();
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
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;

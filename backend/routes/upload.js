const express = require('express');
const multer = require('multer');
const { uploadToCloudinary } = require('../services/cloudinary');
const { requireUser } = require('../middleware/auth');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// Middleware: only parse multipart if content-type is multipart/form-data
function handleSingleUpload(req, res, next) {
  const ct = req.headers['content-type'] || '';
  if (ct.includes('multipart/form-data')) {
    return upload.single('image')(req, res, next);
  }
  next();
}

// GET /api/upload/ping — verify Cloudinary connection
router.get('/ping', async (req, res) => {
  try {
    const { cloudinary } = require('../services/cloudinary');
    const pingResult = await cloudinary.api.ping();
    res.json({ ok: true, ping: pingResult });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/upload — upload single image to Cloudinary (folder defaults to 'submitted')
router.post('/', handleSingleUpload, async (req, res, next) => {
  try {
    const folder = req.body?.folder || 'submitted';

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, folder);
      return res.json(result);
    }

    if (req.body?.imageUrl || req.body?.dataUri) {
      const source = req.body.imageUrl || req.body.dataUri;
      const result = await uploadToCloudinary(source, folder);
      return res.json(result);
    }

    return res.status(400).json({ error: 'No image file or URL provided' });
  } catch (err) {
    console.error('Upload to Cloudinary failed:', err);
    res.status(500).json({ error: err.message || 'Image upload failed' });
  }
});

// POST /api/upload/multiple — upload multiple images to Cloudinary
router.post('/multiple', upload.array('images', 5), async (req, res, next) => {
  try {
    const folder = req.body?.folder || 'submitted';

    if (!req.files || !req.files.length) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const uploadPromises = req.files.map((file) =>
      uploadToCloudinary(file.buffer, folder)
    );
    const results = await Promise.all(uploadPromises);

    res.json({
      urls: results.map((r) => r.url),
      items: results,
    });
  } catch (err) {
    console.error('Multiple image upload to Cloudinary failed:', err);
    res.status(500).json({ error: err.message || 'Multiple image upload failed' });
  }
});

module.exports = router;

const express = require('express');
const multer = require('multer');
const Image = require('../models/Image');
const { authMiddleware } = require('./auth');

const router = express.Router();

// Use memory storage — files go straight to buffer, then to MongoDB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files and documents (PDF, DOC, DOCX) are allowed'));
  }
});

// ---------- GET /api/images — list all images (public metadata) ----------
router.get('/', async (req, res) => {
  try {
    const images = await Image.find({}, 'filename contentType size createdAt updatedAt').sort({ createdAt: -1 });
    res.json({ images });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list images' });
  }
});

// ---------- GET /api/images/:filename — serve image (public) ----------
router.get('/:filename', async (req, res) => {
  try {
    const image = await Image.findOne({ filename: req.params.filename });
    if (!image) return res.status(404).json({ error: 'Image not found' });

    res.set('Content-Type', image.contentType);
    res.set('Cache-Control', 'public, max-age=86400'); // cache 1 day
    res.send(image.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

// ---------- POST /api/images/upload — upload one or more images (protected) ----------
router.post('/upload', authMiddleware, upload.array('images', 20), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  try {
    const results = [];
    for (const file of req.files) {
      // Upsert: replace if same filename exists
      const doc = await Image.findOneAndUpdate(
        { filename: file.originalname },
        {
          filename: file.originalname,
          contentType: file.mimetype,
          data: file.buffer,
          size: file.size
        },
        { upsert: true, returnDocument: 'after' }
      );
      results.push({
        filename: doc.filename,
        contentType: doc.contentType,
        size: doc.size,
        url: `/api/images/${encodeURIComponent(doc.filename)}`
      });
    }
    res.json({ message: `${results.length} image(s) uploaded`, images: results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// ---------- DELETE /api/images/:filename — delete image (protected) ----------
router.delete('/:filename', authMiddleware, async (req, res) => {
  try {
    const result = await Image.findOneAndDelete({ filename: req.params.filename });
    if (!result) return res.status(404).json({ error: 'Image not found' });
    res.json({ message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

module.exports = router;

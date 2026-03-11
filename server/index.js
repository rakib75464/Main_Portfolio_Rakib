require('dotenv').config();
const path = require('path');
const express = require('express');
const connectDB = require('./db');
const app = require('./app');
const Image = require('./models/Image');

const PORT = process.env.PORT || 3000;

// Serve static files (local dev only)
app.use(express.static(path.join(__dirname, '..')));

// Serve MongoDB-stored images by direct filename URL (local dev convenience)
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/') || !/\.(png|jpe?g|gif|webp|svg|pdf|docx?)$/i.test(req.path)) return next();
  const filename = decodeURIComponent(req.path.replace(/^\//, ''));
  try {
    const image = await Image.findOne({ filename });
    if (!image) return next();
    res.set('Content-Type', image.contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(image.data);
  } catch (e) { next(); }
});

// SPA fallback
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Portfolio server running at http://localhost:${PORT}`);
    console.log(`Admin dashboard: http://localhost:${PORT}/admin.html`);
  });
});

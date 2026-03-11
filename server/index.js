require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db');

const { router: authRouter } = require('./routes/auth');
const configRouter = require('./routes/config');
const imagesRouter = require('./routes/images');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Middleware ----------
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ---------- API Routes ----------
app.use('/api/auth', authRouter);
app.use('/api/config', configRouter);
app.use('/api/images', imagesRouter);

// ---------- Serve Static Files ----------
app.use(express.static(path.join(__dirname, '..')));

// Image fallback: if a static image file isn't found locally, check MongoDB
const Image = require('./models/Image');
app.use(async (req, res, next) => {
  // Only intercept image-like requests (not HTML, JS, CSS, API)
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

// Fallback to index.html for SPA-like behavior
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ---------- Connect DB & Start Server ----------
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Portfolio server running at http://localhost:${PORT}`);
    console.log(`Admin dashboard: http://localhost:${PORT}/admin.html`);
  });
});

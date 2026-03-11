const express = require('express');
const fs = require('fs');
const path = require('path');
const PortfolioConfig = require('../models/PortfolioConfig');
const ConfigSnapshot = require('../models/ConfigSnapshot');
const { authMiddleware } = require('./auth');

const router = express.Router();
const CONFIG_PATH = path.join(__dirname, '..', '..', 'config.json');

// ---------- GET /api/config (public — serves portfolio data to all visitors) ----------
router.get('/', async (req, res) => {
  try {
    // Primary: read from MongoDB
    const doc = await PortfolioConfig.findOne({ key: 'main' });
    if (doc) return res.json(doc.data);

    // Fallback: if MongoDB is empty, seed from config.json file
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const fileConfig = JSON.parse(raw);
    await PortfolioConfig.create({ key: 'main', data: fileConfig });
    res.json(fileConfig);
  } catch (err) {
    // Last resort: serve from file
    try {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      res.json(JSON.parse(raw));
    } catch (e) {
      res.status(500).json({ error: 'Failed to load config' });
    }
  }
});

// ---------- PUT /api/config (protected — admin saves changes to MongoDB) ----------
router.put('/', authMiddleware, async (req, res) => {
  const configData = req.body;
  if (!configData || typeof configData !== 'object') {
    return res.status(400).json({ error: 'Invalid config data' });
  }

  try {
    // Save to MongoDB (upsert — create if not exists, update if exists)
    await PortfolioConfig.findOneAndUpdate(
      { key: 'main' },
      { data: configData },
      { upsert: true, new: true }
    );

    // Also keep a snapshot for version history
    await ConfigSnapshot.create({ userId: req.user.id, configData });

    // Also update the local file as backup
    try {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(configData, null, 2), 'utf-8');
    } catch (e) { /* file write failure is non-critical */ }

    res.json({ message: 'Config saved successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save config' });
  }
});

// ---------- GET /api/config/history (protected) ----------
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const snapshots = await ConfigSnapshot.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('_id createdAt');
    res.json({ snapshots });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ---------- GET /api/config/snapshot/:id (protected) ----------
router.get('/snapshot/:id', authMiddleware, async (req, res) => {
  try {
    const snapshot = await ConfigSnapshot.findOne({ _id: req.params.id, userId: req.user.id });
    if (!snapshot) return res.status(404).json({ error: 'Snapshot not found' });
    res.json({ config: snapshot.configData, saved_at: snapshot.createdAt });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch snapshot' });
  }
});

module.exports = router;

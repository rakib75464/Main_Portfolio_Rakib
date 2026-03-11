const mongoose = require('mongoose');

const portfolioConfigSchema = new mongoose.Schema({
  // Single document — always use key "main"
  key: { type: String, default: 'main', unique: true },
  data: { type: Object, required: true }
}, { timestamps: true });

module.exports = mongoose.model('PortfolioConfig', portfolioConfigSchema);

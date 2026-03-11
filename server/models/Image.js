const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  filename: { type: String, required: true, unique: true },
  contentType: { type: String, required: true },
  data: { type: Buffer, required: true },
  size: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('Image', imageSchema);

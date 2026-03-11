const mongoose = require('mongoose');

const loginLogSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  ipAddress: { type: String },
  userAgent: { type: String },
  success:   { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('LoginLog', loginLogSchema);

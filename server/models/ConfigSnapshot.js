const mongoose = require('mongoose');

const configSnapshotSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  configData: { type: Object, required: true }
}, { timestamps: true });

module.exports = mongoose.model('ConfigSnapshot', configSnapshotSchema);

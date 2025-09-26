const mongoose = require('mongoose');

const messageLogSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession', index: true },
  direction: { type: String, enum: ['inbound','outbound'], required: true },
  whatsappMessageId: { type: String, unique: true, sparse: true },
  text: String,
  payload: mongoose.Schema.Types.Mixed,
  provider: { type: String, default: 'meta' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: false });

// TTL index opcional para logs efímeros (ej: 90 días = 90*24*60*60)
messageLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('MessageLog', messageLogSchema);

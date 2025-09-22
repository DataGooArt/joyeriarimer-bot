const mongoose = require('mongoose');

/**
 * Esquema de sesión de chat
 * Representa una conversación activa con un cliente
 */
const chatSessionSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', index: true },
  phone: { type: String, index: true },
  status: { type: String, default: 'open', enum: ['open', 'closed', 'pending_human'] },
  context: { type: mongoose.Schema.Types.Mixed, default: {} },
  openedAt: { type: Date, default: Date.now },
  closedAt: Date
}, { timestamps: true });

chatSessionSchema.index({ openedAt: 1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  phone: { type: String, required: true, index: true },
  status: { type: String, enum: ['active', 'open', 'archived', 'escalated'], default: 'active' },
  topic: { type: String, enum: ['general', 'appointment', 'purchase', 'support'], default: 'general' },
  aiContext: { type: mongoose.Schema.Types.Mixed },
  lastActivity: { type: Date, default: Date.now },
  metadata: {
    intent: String,
    flowId: String,
    flowResponseData: mongoose.Schema.Types.Mixed,
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }
  },
  language: { type: String, default: 'es' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: false });

// Índice compuesto para optimizar consultas frecuentes
chatSessionSchema.index({ customer: 1, status: 1, lastActivity: -1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);

const mongoose = require('mongoose');

/**
 * Esquema del cliente
 * Almacena información del cliente, preferencias y score de lead
 */
const customerSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, required: true, unique: true, index: true },
  email: { type: String, lowercase: true, index: true },
  whatsappOptIn: { type: Boolean, default: true },
  language: { type: String, default: 'es' },
  leadScore: { type: Number, default: 0 },
  priority: { type: String, default: 'low' },
  tags: [String],
  termsAcceptedAt: { type: Date, default: null },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
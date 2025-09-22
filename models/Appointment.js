// Appointment.js
// 📅 Modelo de citas/appointments

const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession' },
    dateTime: { type: Date, required: true },
    serviceType: { 
        type: String, 
        required: true,
        enum: ['tasacion', 'diseño_personalizado', 'reparacion', 'compra_presencial']
    },
    status: { 
        type: String, 
        default: 'pending', 
        enum: ['pending', 'confirmed', 'cancelled', 'completed'] 
    },
    location: {
        type: String,
        default: 'taller_principal' // Por ahora una sola ubicación
    },
    reminderSent: { type: Boolean, default: false },
    notes: String, // Ej. "Viene a ver anillos de compromiso"
    appointmentSource: { type: String, default: 'whatsapp_flow' } // whatsapp_flow, chat_direct, etc.
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
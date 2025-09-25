// Appointment.js
// 📅 Modelo de citas/appointments

const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession' },
    
    // Información de la cita
    dateTime: { type: Date, required: true },
    serviceId: { 
        type: String, 
        required: true,
        // Los IDs deben coincidir con los del modelo Service
        enum: ['consulta', 'diseno', 'reparacion', 'valoracion']
    },
    locationId: {
        type: String,
        required: true,
        // Los IDs deben coincidir con los del modelo Location
        enum: ['cartagena', 'santa_marta']
    },
    // Referencias a los modelos (para consultas avanzadas)
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    
    // Estado y seguimiento
    status: { 
        type: String, 
        default: 'pending', 
        enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'] 
    },
    reminderSent: { type: Boolean, default: false },
    confirmationSent: { type: Boolean, default: false },
    
    // Datos capturados del Flow
    customerEmail: { type: String },
    customerNotes: { type: String }, // Lo que escribió el cliente
    internalNotes: { type: String }, // Notas del staff
    
    // Consentimientos legales
    termsAccepted: { type: Boolean, default: false },
    privacyAccepted: { type: Boolean, default: false },
    consentDate: { type: Date, default: Date.now },
    
    // Información del Flow
    flowId: { type: String, default: '24509326838732458' },
    appointmentSource: { type: String, default: 'whatsapp_flow' },
    
    // Métricas de seguimiento
    appointmentReference: { type: String, unique: true }, // Código único para el cliente
    estimatedDuration: { type: Number, default: 60 }, // minutos
    
    // Datos específicos del servicio
    serviceDetails: {
        urgency: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
        budget: { type: String }, // Presupuesto aproximado si lo menciona
        specificRequests: [String] // Array de requests específicos
    }
}, { timestamps: true });

// Middleware para generar código de referencia único y relacionar ObjectIds antes de guardar
appointmentSchema.pre('save', async function(next) {
    try {
        // Generar código de referencia único
        if (!this.appointmentReference) {
            const timestamp = Date.now().toString().slice(-6);
            const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
            this.appointmentReference = `JR${timestamp}${random}`;
        }

        // Relacionar serviceId con ObjectId de Service
        if (this.serviceId && !this.service) {
            const Service = require('./Service');
            const serviceDoc = await Service.findOne({ id: this.serviceId });
            if (serviceDoc) {
                this.service = serviceDoc._id;
            }
        }

        // Relacionar locationId con ObjectId de Location  
        if (this.locationId && !this.location) {
            const Location = require('./Location');
            const locationDoc = await Location.findOne({ id: this.locationId });
            if (locationDoc) {
                this.location = locationDoc._id;
            }
        }

        next();
    } catch (error) {
        next(error);
    }
});

// Método para obtener resumen de la cita
appointmentSchema.methods.getSummary = function() {
    return {
        reference: this.appointmentReference,
        service: this.serviceType,
        location: this.location,
        dateTime: this.dateTime,
        status: this.status,
        customerName: this.customer?.name || 'Cliente'
    };
};

module.exports = mongoose.model('Appointment', appointmentSchema);
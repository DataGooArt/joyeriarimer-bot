// Location.js
// 📍 Modelo de ubicaciones/sedes disponibles para citas

const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    id: { 
        type: String, 
        required: true, 
        unique: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    address: { 
        type: String, 
        required: true 
    },
    city: { 
        type: String, 
        required: true 
    },
    phone: { 
        type: String 
    },
    coordinates: {
        lat: { type: Number },
        lng: { type: Number }
    },
    businessHours: {
        monday: { open: String, close: String },
        tuesday: { open: String, close: String },
        wednesday: { open: String, close: String },
        thursday: { open: String, close: String },
        friday: { open: String, close: String },
        saturday: { open: String, close: String },
        sunday: { open: String, close: String }
    },
    active: { 
        type: Boolean, 
        default: true 
    },
    // Para el Flow de WhatsApp
    flowDisplayName: { 
        type: String,
        required: true 
    }
}, { timestamps: true });

// Método para obtener datos optimizados para el Flow
locationSchema.statics.getForFlow = async function() {
    const locations = await this.find({ active: true }).select('id flowDisplayName address -_id');
    return locations.map(location => ({
        id: location.id,
        title: location.flowDisplayName, // ✅ CORREGIDO: title en lugar de name
        address: location.address
    }));
};

module.exports = mongoose.model('Location', locationSchema);
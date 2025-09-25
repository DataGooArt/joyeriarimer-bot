// Service.js
// 🛠️ Modelo de servicios disponibles para citas

const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    id: { 
        type: String, 
        required: true, 
        unique: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String 
    },
    duration: { 
        type: Number, 
        required: true,
        default: 30 // minutos
    },
    price: { 
        type: Number,
        default: 0 
    },
    active: { 
        type: Boolean, 
        default: true 
    },
    category: {
        type: String,
        enum: ['consultation', 'repair', 'design', 'valuation', 'cleaning'],
        default: 'consultation'
    },
    // Para el Flow de WhatsApp
    flowDisplayName: { 
        type: String,
        required: true 
    }
}, { timestamps: true });

// Método para obtener datos optimizados para el Flow
serviceSchema.statics.getForFlow = async function() {
    const services = await this.find({ active: true }).select('id flowDisplayName duration -_id');
    return services.map(service => ({
        id: service.id,
        name: service.flowDisplayName,
        duration: `${service.duration} min`
    }));
};

module.exports = mongoose.model('Service', serviceSchema);
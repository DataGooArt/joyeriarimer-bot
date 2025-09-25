// web-dashboard.js
// Dashboard web simple para gestión de citas

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Appointment = require('../models/Appointment');
const Customer = require('../models/Customer');
const Service = require('../models/Service');
const Location = require('../models/Location');

// Configurar dotenv con rutas múltiples para mayor compatibilidad
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Verificar que las variables de entorno se carguen correctamente
if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
    console.error('❌ Error: Variables de entorno MONGO_URI o MONGODB_URI no encontradas');
    console.log('Variables de entorno disponibles:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- PATH del .env:', path.join(__dirname, '../.env'));
    process.exit(1);
}

const app = express();
const PORT = process.env.WEB_PORT || 3001;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Conectar a MongoDB
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
console.log('🔗 Conectando a MongoDB...');
mongoose.connect(mongoUri)
    .then(() => console.log('✅ Conectado a MongoDB exitosamente'))
    .catch(err => {
        console.error('❌ Error conectando a MongoDB:', err.message);
        process.exit(1);
    });

// Rutas API
app.get('/api/appointments', async (req, res) => {
    try {
        const { status, locationId, limit = 50 } = req.query;
        
        let query = {};
        if (status) query.status = status;
        if (locationId) query.locationId = locationId;
        
        const appointments = await Appointment.find(query)
            .populate('customer')
            .populate('service')
            .populate('location')
            .sort({ dateTime: -1 })
            .limit(parseInt(limit));
            
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const stats = {
            total: await Appointment.countDocuments(),
            scheduled: await Appointment.countDocuments({ status: 'scheduled' }),
            confirmed: await Appointment.countDocuments({ status: 'confirmed' }),
            completed: await Appointment.countDocuments({ status: 'completed' }),
            cancelled: await Appointment.countDocuments({ status: 'cancelled' }),
            
            // Esta semana
            thisWeek: await Appointment.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            })
        };
        
        // Servicios más populares
        const serviceStats = await Appointment.aggregate([
            { $group: { _id: '$serviceId', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        stats.services = serviceStats;
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener servicios disponibles
app.get('/api/services', async (req, res) => {
    try {
        const services = await Service.find({ active: true });
        res.json(services);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener ubicaciones disponibles
app.get('/api/locations', async (req, res) => {
    try {
        const locations = await Location.find({ active: true });
        res.json(locations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/appointments/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const appointment = await Appointment.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).populate('customer');
        
        res.json(appointment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/appointments/today', async (req, res) => {
    try {
        const today = new Date();
        const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD
        
        const appointments = await Appointment.find({
            appointmentDate: todayString
        }).populate('customer').sort({ appointmentTime: 1 });
        
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Dashboard web disponible en: http://localhost:${PORT}`);
    console.log(`API endpoints:`);
    console.log(`   GET /api/appointments - Lista de citas`);
    console.log(`   GET /api/stats - Estadísticas`);
    console.log(`   GET /api/appointments/today - Citas de hoy`);
    console.log(`   PUT /api/appointments/:id/status - Actualizar estado`);
});

module.exports = app;

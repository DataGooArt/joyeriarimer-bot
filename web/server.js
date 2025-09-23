// web-dashboard.js
// 🌐 Dashboard web simple para gestión de citas

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Appointment = require('../models/Appointment');
const Customer = require('../models/Customer');
require('dotenv').config();

const app = express();
const PORT = process.env.WEB_PORT || 3001;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI);

// Rutas API
app.get('/api/appointments', async (req, res) => {
    try {
        const { status, location, limit = 50 } = req.query;
        
        let query = {};
        if (status) query.status = status;
        if (location) query.location = location;
        
        const appointments = await Appointment.find(query)
            .populate('customer')
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
            pending: await Appointment.countDocuments({ status: 'pending' }),
            confirmed: await Appointment.countDocuments({ status: 'confirmed' }),
            completed: await Appointment.countDocuments({ status: 'completed' }),
            cancelled: await Appointment.countDocuments({ status: 'cancelled' }),
            
            // Por ubicación
            cartagena: await Appointment.countDocuments({ location: 'cartagena' }),
            santa_marta: await Appointment.countDocuments({ location: 'santa_marta' }),
            
            // Esta semana
            thisWeek: await Appointment.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            })
        };
        
        // Servicios más populares
        const serviceStats = await Appointment.aggregate([
            { $group: { _id: '$serviceType', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        stats.services = serviceStats;
        res.json(stats);
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
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));
        
        const appointments = await Appointment.find({
            dateTime: { $gte: startOfDay, $lte: endOfDay }
        }).populate('customer').sort({ dateTime: 1 });
        
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
    console.log(`🌐 Dashboard web disponible en: http://localhost:${PORT}`);
    console.log(`📊 API endpoints:`);
    console.log(`   GET /api/appointments - Lista de citas`);
    console.log(`   GET /api/stats - Estadísticas`);
    console.log(`   GET /api/appointments/today - Citas de hoy`);
    console.log(`   PUT /api/appointments/:id/status - Actualizar estado`);
});

module.exports = app;
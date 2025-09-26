class AppointmentService {
    constructor() {
        this.businessHours = {
            start: 9,  // 9 AM
            end: 18,   // 6 PM
            days: [1, 2, 3, 4, 5, 6] // Lunes a Sábado
        };
        this.appointmentDuration = 60; // 60 minutos por cita
    }

    generateAvailableDates(daysAhead = 30) {
        const dates = [];
        const today = new Date();
        
        for (let i = 1; i <= daysAhead; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            // Verificar si es día laborable
            if (this.businessHours.days.includes(date.getDay())) {
                const dateString = date.toISOString().split('T')[0];
                const timeSlots = this.generateTimeSlots(date);
                
                if (timeSlots.length > 0) {
                    dates.push({
                        date: dateString,
                        displayDate: date.toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        }),
                        timeSlots: timeSlots
                    });
                }
            }
        }
        
        return dates;
    }

    generateTimeSlots(date) {
        const slots = [];
        const { start, end } = this.businessHours;
        
        for (let hour = start; hour < end; hour++) {
            for (let minutes of [0, 30]) { // Citas cada 30 minutos
                const timeSlot = {
                    time: `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
                    display: this.formatTime(hour, minutes),
                    available: true // Aquí podrías verificar disponibilidad real
                };
                slots.push(timeSlot);
            }
        }
        
        return slots;
    }

    formatTime(hour, minutes) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
    }

    async createAppointment(appointmentData) {
        try {
            const Appointment = require('../models/Appointment');
            
            const appointment = new Appointment({
                customerPhone: appointmentData.customerPhone,
                customerName: appointmentData.customerName,
                customerEmail: appointmentData.customerEmail,
                appointmentDate: appointmentData.appointmentDate,
                appointmentTime: appointmentData.appointmentTime,
                serviceType: appointmentData.serviceType || 'Consulta general',
                status: 'scheduled',
                notes: appointmentData.notes || '',
                createdAt: new Date()
            });

            const savedAppointment = await appointment.save();
            console.log('✅ Cita creada:', savedAppointment._id);
            return savedAppointment;
        } catch (error) {
            console.error('❌ Error creando cita:', error.message);
            throw error;
        }
    }

    async getAppointmentById(appointmentId) {
        try {
            const Appointment = require('../models/Appointment');
            return await Appointment.findById(appointmentId);
        } catch (error) {
            console.error('❌ Error obteniendo cita:', error.message);
            throw error;
        }
    }

    async getAppointmentsByPhone(phoneNumber) {
        try {
            const Appointment = require('../models/Appointment');
            return await Appointment.find({ customerPhone: phoneNumber }).sort({ appointmentDate: 1 });
        } catch (error) {
            console.error('❌ Error obteniendo citas por teléfono:', error.message);
            throw error;
        }
    }

    validateAppointmentData(data) {
        const required = ['customerPhone', 'customerName', 'appointmentDate', 'appointmentTime'];
        const missing = required.filter(field => !data[field]);
        
        if (missing.length > 0) {
            throw new Error(`Campos requeridos faltantes: ${missing.join(', ')}`);
        }

        // Validar formato de fecha
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(data.appointmentDate)) {
            throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
        }

        // Validar formato de hora
        const timeRegex = /^\d{2}:\d{2}$/;
        if (!timeRegex.test(data.appointmentTime)) {
            throw new Error('Formato de hora inválido. Use HH:MM');
        }

        return true;
    }
}

const appointmentService = new AppointmentService();

module.exports = { appointmentService };

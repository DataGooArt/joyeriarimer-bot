// appointmentService.js
// 📅 Servicio para gestión de citas de joyería

const Appointment = require('../models/Appointment');
const Customer = require('../models/Customer');

class AppointmentService {
  
  // Tipos de servicios disponibles en la joyería
  static SERVICES = {
    TASACION: {
      id: 'tasacion',
      title: '💎 Tasación de Joyas',
      duration: 30, // minutos
      description: 'Evaluación profesional del valor de tus joyas'
    },
    DISEÑO_PERSONALIZADO: {
      id: 'diseño_personalizado', 
      title: '✨ Diseño Personalizado',
      duration: 60,
      description: 'Consultoría para crear tu joya única'
    },
    REPARACION: {
      id: 'reparacion',
      title: '🔧 Reparación de Joyas', 
      duration: 45,
      description: 'Restauración y reparación de joyas'
    },
    COMPRA_PRESENCIAL: {
      id: 'compra_presencial',
      title: '🛍️ Asesoría de Compra',
      duration: 45, 
      description: 'Asesoría personalizada para seleccionar joyas'
    }
  };

  // Horarios disponibles por día
  static AVAILABLE_TIMES = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  /**
   * Generar fechas disponibles para los próximos 30 días (excluyendo domingos)
   */
  static getAvailableDates() {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Excluir domingos (0 = domingo)
      if (date.getDay() !== 0) {
        dates.push({
          id: date.toISOString().split('T')[0], // YYYY-MM-DD
          title: date.toLocaleDateString('es-ES', { 
            weekday: 'short', 
            day: '2-digit', 
            month: 'short' 
          })
        });
      }
    }
    
    return dates;
  }

  /**
   * Obtener horarios disponibles para una fecha específica
   */
  static async getAvailableTimesForDate(date) {
    // Buscar citas existentes para esa fecha
    const existingAppointments = await Appointment.find({
      dateTime: {
        $gte: new Date(date + 'T00:00:00.000Z'),
        $lt: new Date(date + 'T23:59:59.999Z')
      },
      status: { $in: ['pending', 'confirmed'] }
    });

    const bookedTimes = existingAppointments.map(apt => {
      return apt.dateTime.toTimeString().slice(0, 5); // HH:MM
    });

    // Filtrar horarios disponibles
    return this.AVAILABLE_TIMES
      .filter(time => !bookedTimes.includes(time))
      .map(time => ({
        id: time,
        title: time,
        enabled: true
      }));
  }

  /**
   * Crear nueva cita
   */
  static async createAppointment(appointmentData) {
    const {
      customerPhone,
      customerName,
      service,
      date,
      time,
      notes,
      conversationId
    } = appointmentData;

    // Buscar o crear cliente
    let customer = await Customer.findOne({ phoneNumber: customerPhone });
    if (!customer) {
      customer = new Customer({
        phoneNumber: customerPhone,
        name: customerName,
        source: 'whatsapp_appointment'
      });
      await customer.save();
    }

    // Crear fecha y hora completa
    const appointmentDateTime = new Date(`${date}T${time}:00.000Z`);

    // Crear cita
    const appointment = new Appointment({
      customer: customer._id,
      conversation: conversationId,
      dateTime: appointmentDateTime,
      serviceType: service,
      status: 'pending',
      notes: notes || ''
    });

    await appointment.save();
    return appointment.populate('customer');
  }

  /**
   * Confirmar cita
   */
  static async confirmAppointment(appointmentId) {
    return await Appointment.findByIdAndUpdate(
      appointmentId,
      { status: 'confirmed' },
      { new: true }
    ).populate('customer');
  }

  /**
   * Cancelar cita
   */
  static async cancelAppointment(appointmentId, reason = '') {
    return await Appointment.findByIdAndUpdate(
      appointmentId,
      { 
        status: 'cancelled',
        notes: reason 
      },
      { new: true }
    ).populate('customer');
  }

  /**
   * Obtener citas pendientes de hoy
   */
  static async getTodaysPendingAppointments() {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    return await Appointment.find({
      dateTime: { $gte: startOfDay, $lte: endOfDay },
      status: 'pending'
    }).populate('customer');
  }
}

module.exports = AppointmentService;
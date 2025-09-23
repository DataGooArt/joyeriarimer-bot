// appointmentService.js
// 📅 Servicio para gestión de citas de joyería

const Appointment = require('../models/Appointment');
const Customer = require('../models/Customer');

// 🏪 Configuración de sedes para Joyería Rimer
const JOYERIA_LOCATIONS = [
    {
        id: "cartagena",
        title: "Cartagena de Indias"
    },
    {
        id: "santa_marta", 
        title: "Santa Marta"
    }
];

class AppointmentService {
  
  // Tipos de servicios disponibles en la joyería (formato para Flow)
  static SERVICES = [
    {
      id: 'tasacion',
      title: '💎 Tasación de Joyas'
    },
    {
      id: 'diseño_personalizado', 
      title: '✨ Diseño Personalizado'
    },
    {
      id: 'reparacion',
      title: '🔧 Reparación de Joyas'
    },
    {
      id: 'compra_presencial',
      title: '🛍️ Asesoría de Compra'
    },
    {
      id: 'limpieza',
      title: '✨ Limpieza y Mantenimiento'
    }
  ];

  /**
   * Configuración de horarios disponibles (Lunes a Viernes)
   */
  static AVAILABLE_TIMES = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  /**
   * 📅 Genera fechas disponibles para las próximas 3 semanas (solo días laborales)
   */
  static getAvailableDates() {
    const dates = [];
    const today = new Date();
    
    // Generar fechas para las próximas 3 semanas
    for (let i = 1; i <= 21; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        // Solo incluir días laborales (Lunes = 1, Viernes = 5)
        const dayOfWeek = date.getDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            dates.push({
                id: date.toISOString().split('T')[0], // YYYY-MM-DD
                title: date.toLocaleDateString('es-CO', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                })
            });
        }
    }
    
    return dates;
  }

  /**
   * ⏰ Obtiene horarios disponibles para una fecha específica
   */
  static async getAvailableTimesForDate(dateString) {
    console.log('⏰ Obteniendo horarios disponibles para:', dateString);
    
    try {
        // Obtener citas existentes para esa fecha
        const existingAppointments = await Appointment.find({
            dateTime: {
                $gte: new Date(dateString + 'T00:00:00.000Z'),
                $lte: new Date(dateString + 'T23:59:59.999Z')
            },
            status: { $in: ['pending', 'confirmed'] }
        });

        // Extraer horarios ocupados en formato AM/PM
        const occupiedTimes = existingAppointments.map(apt => {
            const hour = apt.dateTime.getHours();
            const minutes = apt.dateTime.getMinutes();
            return this.formatTimeFromHourMinute(hour, minutes);
        });

        console.log(`📋 Horarios ocupados en ${dateString}:`, occupiedTimes);

        // Filtrar horarios disponibles
        const availableTimes = this.AVAILABLE_TIMES
            .filter(time => !occupiedTimes.includes(time))
            .map(time => ({ id: time, title: time }));

        console.log('✅ Horarios disponibles:', availableTimes);
        return availableTimes;
        
    } catch (error) {
        console.error('❌ Error obteniendo horarios disponibles:', error);
        // En caso de error, devolver todos los horarios
        return this.AVAILABLE_TIMES.map(time => ({ id: time, title: time }));
    }
  }

  /**
   * 🕐 Convierte hora y minutos a formato AM/PM
   */
  static formatTimeFromHourMinute(hour, minute) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    const displayMinute = minute.toString().padStart(2, '0');
    
    return `${displayHour.toString().padStart(2, '0')}:${displayMinute} ${period}`;
  }

  /**
   * ⏰ Convierte formato AM/PM a 24 horas (HH:MM)
   */
  static convertTo24Hour(timeAMPM) {
    const [time, period] = timeAMPM.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    
    if (period === 'PM' && hour24 !== 12) {
        hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
        hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}`;
  }

  /**
   * Crear nueva cita con campos expandidos
   */
  static async createAppointment(appointmentData) {
    const {
      customerPhone,
      customerName,
      customerEmail,
      service,
      location,
      date,
      time,
      customerNotes,
      conversationId
    } = appointmentData;

    // Buscar o crear cliente
    let customer = await Customer.findOne({ phone: customerPhone });
    if (!customer) {
      customer = new Customer({
        phone: customerPhone,
        name: customerName,
        email: customerEmail,
        metadata: { source: 'whatsapp_flow_appointment' }
      });
      await customer.save();
    } else if (customerName && !customer.name) {
      // Actualizar información si no existía
      customer.name = customerName;
      customer.email = customerEmail || customer.email;
      await customer.save();
    }

    // Crear fecha y hora completa
    const time24 = this.convertTo24Hour(time);
    const appointmentDateTime = new Date(`${date}T${time24}:00.000Z`);

    // Crear cita con campos expandidos
    const appointment = new Appointment({
      customer: customer._id,
      conversation: conversationId,
      dateTime: appointmentDateTime,
      serviceType: service,
      location: location,
      status: 'pending',
      customerEmail: customerEmail,
      customerNotes: customerNotes || '',
      flowId: '24509326838732458',
      appointmentSource: 'whatsapp_flow'
    });

    await appointment.save();
    console.log(`💾 Cita creada con referencia: ${appointment.appointmentReference}`);
    
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

  /**
   * 🔄 Maneja el Flow de agendamiento específico (ID: 24509326838732458)
   */
  static async handleAppointmentFlow(decryptedBody) {
    console.log('📅 Procesando Flow de agendamiento:', JSON.stringify(decryptedBody, null, 2));
    
    const { screen, data: formData, action } = decryptedBody;
    
    try {
        switch (screen) {
            case 'APPOINTMENT':
                return await this.handleAppointmentScreen(formData, action);
                
            case 'DETAILS':
                return await this.handleDetailsScreen(formData);
                
            case 'SUMMARY':
                return await this.handleSummaryScreen(formData);
                
            default:
                console.log(`⚠️ Pantalla no reconocida: ${screen}`);
                return {
                    version: "3.0",
                    screen: "APPOINTMENT",
                    data: this.getInitialAppointmentData()
                };
        }
    } catch (error) {
        console.error('❌ Error procesando Flow de agendamiento:', error);
        return {
            version: "3.0",
            screen: "APPOINTMENT", // Volver al inicio en caso de error
            data: this.getInitialAppointmentData()
        };
    }
  }

  /**
   * 📋 Maneja la pantalla de selección de cita
   */
  static async handleAppointmentScreen(formData, action) {
    console.log('📋 Procesando pantalla APPOINTMENT, acción:', action);
    
    const baseData = {
        department: this.SERVICES,
        location: JOYERIA_LOCATIONS,
        is_location_enabled: true,
        date: this.getAvailableDates(),
        is_date_enabled: false, // Se habilita después de seleccionar servicio
        time: this.AVAILABLE_TIMES.map(time => ({ id: time, title: time })),
        is_time_enabled: false  // Se habilita después de seleccionar fecha
    };
    
    // Manejar acciones específicas de data_exchange
    if (formData && formData.trigger) {
        switch (formData.trigger) {
            case 'department_selected':
                console.log('🎯 Servicio seleccionado:', formData.department);
                baseData.is_date_enabled = true;
                break;
                
            case 'location_selected':
                console.log('📍 Ubicación seleccionada:', formData.location);
                baseData.is_date_enabled = true;
                break;
                
            case 'date_selected':
                console.log('📅 Fecha seleccionada:', formData.date);
                // Obtener horarios disponibles para la fecha
                const availableTimes = await this.getAvailableTimesForDate(formData.date);
                baseData.time = availableTimes;
                baseData.is_time_enabled = true;
                break;
        }
    }
    
    return {
        version: "3.0",
        screen: "APPOINTMENT", 
        data: baseData
    };
  }

  /**
   * 👤 Maneja la pantalla de detalles del cliente
   */
  static async handleDetailsScreen(formData) {
    console.log('👤 Procesando pantalla DETAILS con datos:', formData);
    
    // Preparar datos para la pantalla de resumen
    const appointmentSummary = this.generateAppointmentSummary(formData);
    const detailsSummary = this.generateDetailsSummary(formData);
    
    return {
        version: "3.0",
        screen: "SUMMARY",
        data: {
            appointment: appointmentSummary,
            details: detailsSummary,
            department: formData.department,
            location: formData.location,
            date: formData.date,
            time: formData.time,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            more_details: formData.more_details || ''
        }
    };
  }

  /**
   * ✅ Maneja la confirmación final y guarda la cita
   */
  static async handleSummaryScreen(formData) {
    console.log('✅ Confirmando cita con datos:', formData);
    
    try {
        // Crear la cita con datos completos del Flow
        const appointmentData = {
            customerPhone: formData.phone,
            customerName: formData.name,
            customerEmail: formData.email,
            service: formData.department,
            location: formData.location,
            date: formData.date,
            time: formData.time,
            customerNotes: formData.more_details || '',
            termsAccepted: formData.terms_accepted || false,
            privacyAccepted: formData.privacy_accepted || false,
            conversationId: null // TODO: Obtener del contexto
        };
        
        const appointment = await this.createAppointment(appointmentData);
        console.log('💾 Cita guardada con referencia:', appointment.appointmentReference);
        
        // Enviar notificación inmediata
        const notificationService = require('./notificationService');
        await notificationService.sendAppointmentConfirmationFromFlow(appointment);
        
        return {
            version: "3.0",
            screen: "SUCCESS",
            data: {
                success_message: `¡Cita confirmada exitosamente! 
Tu referencia es: ${appointment.appointmentReference}
Te contactaremos pronto para confirmar los detalles.`,
                appointment_details: `Referencia: ${appointment.appointmentReference}`
            }
        };
        
    } catch (error) {
        console.error('❌ Error guardando cita:', error);
        return {
            version: "3.0", 
            screen: "APPOINTMENT", // Volver al inicio
            data: this.getInitialAppointmentData()
        };
    }
  }

  /**
   * 📝 Genera resumen de la cita
   */
  static generateAppointmentSummary(formData) {
    const service = this.SERVICES.find(s => s.id === formData.department);
    const location = JOYERIA_LOCATIONS.find(l => l.id === formData.location);
    
    const date = new Date(formData.date);
    const formattedDate = date.toLocaleDateString('es-CO', {
        weekday: 'long',
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
    });
    
    return `${service?.title || 'Servicio'} en ${location?.title || 'Sede'}\n${formattedDate} a las ${formData.time}`;
  }

  /**
   * 👤 Genera resumen de detalles del cliente
   */
  static generateDetailsSummary(formData) {
    let summary = `Nombre: ${formData.name || 'No especificado'}\n`;
    summary += `Email: ${formData.email || 'No especificado'}\n`;
    summary += `Teléfono: ${formData.phone || 'No especificado'}`;
    
    if (formData.more_details) {
        summary += `\n\nDetalles adicionales:\n${formData.more_details}`;
    }
    
    return summary;
  }

  /**
   * 🔄 Obtiene datos iniciales para la pantalla de cita
   */
  static getInitialAppointmentData() {
    return {
        department: this.SERVICES,
        location: JOYERIA_LOCATIONS,
        is_location_enabled: true,
        date: this.getAvailableDates(),
        is_date_enabled: false,
        time: this.AVAILABLE_TIMES.map(time => ({ id: time, title: time })),
        is_time_enabled: false
    };
  }
}

module.exports = AppointmentService;
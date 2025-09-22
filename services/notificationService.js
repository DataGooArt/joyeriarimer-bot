// notificationService.js
// 📢 Servicio para notificaciones y recordatorios de citas

const cron = require('node-cron');
const AppointmentService = require('./appointmentService');
const { sendWhatsAppMessage } = require('./whatsappService');

class NotificationService {
  
  /**
   * Inicializar el servicio de notificaciones con tareas programadas
   */
  static init() {
    console.log('📢 Inicializando servicio de notificaciones...');
    
    // Ejecutar cada día a las 10:00 AM
    cron.schedule('0 10 * * *', async () => {
      console.log('📅 Ejecutando recordatorios diarios de citas...');
      await NotificationService.sendDailyReminders();
    });

    // Ejecutar cada día a las 6:00 PM para confirmaciones del día siguiente
    cron.schedule('0 18 * * *', async () => {
      console.log('📋 Enviando confirmaciones de citas del día siguiente...');
      await NotificationService.sendTomorrowConfirmations();
    });

    console.log('✅ Servicio de notificaciones iniciado');
  }

  /**
   * Enviar recordatorios para las citas de hoy
   */
  static async sendDailyReminders() {
    try {
      const todaysAppointments = await AppointmentService.getTodaysPendingAppointments();
      
      for (const appointment of todaysAppointments) {
        if (!appointment.reminderSent) {
          await NotificationService.sendAppointmentReminder(appointment);
          
          // Marcar recordatorio como enviado
          await appointment.updateOne({ reminderSent: true });
        }
      }
      
      console.log(`📨 Enviados ${todaysAppointments.length} recordatorios de citas`);
      
    } catch (error) {
      console.error('❌ Error enviando recordatorios diarios:', error);
    }
  }

  /**
   * Enviar confirmaciones para citas del día siguiente
   */
  static async sendTomorrowConfirmations() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
      const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

      const Appointment = require('../models/Appointment');
      const tomorrowAppointments = await Appointment.find({
        dateTime: { $gte: startOfTomorrow, $lte: endOfTomorrow },
        status: 'pending'
      }).populate('customer');

      for (const appointment of tomorrowAppointments) {
        await NotificationService.sendAppointmentConfirmation(appointment);
      }
      
      console.log(`📋 Enviadas ${tomorrowAppointments.length} confirmaciones de citas`);
      
    } catch (error) {
      console.error('❌ Error enviando confirmaciones:', error);
    }
  }

  /**
   * Enviar recordatorio de cita individual
   */
  static async sendAppointmentReminder(appointment) {
    const customer = appointment.customer;
    const serviceInfo = AppointmentService.SERVICES[appointment.serviceType];
    const appointmentTime = appointment.dateTime.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const reminderMessage = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: customer.phoneNumber,
      type: "text",
      text: {
        body: `🔔 *Recordatorio de Cita - Joyería Rimer*\n\n` +
              `¡Hola ${customer.name}! 👋\n\n` +
              `Te recordamos tu cita para HOY:\n\n` +
              `🕐 *Hora:* ${appointmentTime}\n` +
              `🔧 *Servicio:* ${serviceInfo?.title}\n` +
              `📍 *Ubicación:* Taller de Joyería Rimer\n\n` +
              `¿Podrás asistir? Responde:\n` +
              `✅ "CONFIRMO" para confirmar\n` +
              `❌ "CANCELAR" si no puedes asistir\n\n` +
              `¡Esperamos verte pronto! 💎`
      }
    };

    await sendWhatsAppMessage(customer.phoneNumber, reminderMessage);
    console.log(`📨 Recordatorio enviado a ${customer.name} (${customer.phoneNumber})`);
  }

  /**
   * Enviar confirmación de cita para mañana
   */
  static async sendAppointmentConfirmation(appointment) {
    const customer = appointment.customer;
    const serviceInfo = AppointmentService.SERVICES[appointment.serviceType];
    const appointmentDate = appointment.dateTime.toLocaleDateString('es-ES');
    const appointmentTime = appointment.dateTime.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const confirmationMessage = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: customer.phoneNumber,
      type: "text",
      text: {
        body: `📋 *Confirmación de Cita - Joyería Rimer*\n\n` +
              `Hola ${customer.name}, 👋\n\n` +
              `Te confirmamos tu cita para MAÑANA:\n\n` +
              `📅 *Fecha:* ${appointmentDate}\n` +
              `🕐 *Hora:* ${appointmentTime}\n` +
              `🔧 *Servicio:* ${serviceInfo?.title}\n` +
              `📍 *Ubicación:* Taller de Joyería Rimer\n\n` +
              `📝 *¿Qué llevar?*\n` +
              `• Documento de identidad\n` +
              `• Si es reparación: traer la joya\n` +
              `• Si es tasación: documentos de la joya\n\n` +
              `¡Nos vemos mañana! Si necesitas reprogramar, avísanos. 💎`
      }
    };

    await sendWhatsAppMessage(customer.phoneNumber, confirmationMessage);
    console.log(`📋 Confirmación enviada a ${customer.name} (${customer.phoneNumber})`);
  }

  /**
   * Enviar notificación inmediata de nueva cita (para el administrador)
   */
  static async sendNewAppointmentNotification(appointment) {
    // Aquí podrías enviar notificación a un número de administrador
    // Por ahora solo logueamos
    const customer = appointment.customer;
    const serviceInfo = AppointmentService.SERVICES[appointment.serviceType];
    
    console.log(`🆕 NUEVA CITA AGENDADA:`);
    console.log(`👤 Cliente: ${customer.name} (${customer.phoneNumber})`);
    console.log(`📅 Fecha: ${appointment.dateTime.toLocaleString('es-ES')}`);
    console.log(`🔧 Servicio: ${serviceInfo?.title}`);
    console.log(`📝 Notas: ${appointment.notes || 'Ninguna'}`);
    
    // Si tienes un número de administrador, podrías enviar:
    // const adminPhone = process.env.ADMIN_PHONE_NUMBER;
    // if (adminPhone) {
    //   await sendWhatsAppMessage(adminPhone, adminNotificationMessage);
    // }
  }
}

module.exports = NotificationService;
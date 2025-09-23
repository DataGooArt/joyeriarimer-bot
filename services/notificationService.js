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
   * 📅 Enviar confirmación inmediata al cliente después de agendar cita desde Flow
   */
  static async sendAppointmentConfirmationFromFlow(appointment) {
    try {
      const customer = appointment.customer;
      const service = AppointmentService.SERVICES.find(s => s.id === appointment.serviceType);
      
      // Extraer ubicación de las notas (formato: "Sede: Cartagena\nEmail...")
      let location = 'Nuestro taller';
      if (appointment.notes && appointment.notes.includes('Sede:')) {
        const locationMatch = appointment.notes.match(/Sede: ([^\n]+)/);
        if (locationMatch) {
          location = locationMatch[1];
        }
      }
      
      const appointmentDate = appointment.dateTime.toLocaleDateString('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      const appointmentTime = appointment.dateTime.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      const confirmationMessage = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: customer.phoneNumber,
        type: "text",
        text: {
          body: `✅ *¡Cita Confirmada Exitosamente!*\n\n` +
                `¡Hola ${customer.name}! 🤗\n\n` +
                `Tu cita ha sido agendada:\n\n` +
                `📅 **${appointmentDate}**\n` +
                `🕐 **${appointmentTime}**\n` +
                `💎 **${service?.title || appointment.serviceType}**\n` +
                `📍 **${location}**\n\n` +
                `📝 *Código de cita:* #${appointment._id.toString().slice(-8)}\n\n` +
                `🔔 *Recordatorios automáticos:*\n` +
                `• Te recordaremos 1 día antes\n` +
                `• Confirmaremos el día de la cita\n\n` +
                `📞 *¿Necesitas cambios?*\n` +
                `Solo escríbenos y te ayudamos.\n\n` +
                `¡Esperamos verte pronto! ✨\n` +
                `*Joyería Rimer* 💎`
        }
      };

      await sendWhatsAppMessage(customer.phoneNumber, confirmationMessage);
      console.log(`✅ Confirmación de Flow enviada a ${customer.name} (${customer.phoneNumber})`);
      
    } catch (error) {
      console.error('❌ Error enviando confirmación de cita desde Flow:', error);
    }
  }

  /**
   * Enviar notificación inmediata de nueva cita (para el administrador)
   */
  static async sendNewAppointmentNotification(appointment) {
    // Llamar a la confirmación del cliente
    await this.sendAppointmentConfirmationFromFlow(appointment);
    
    // Log para administrador
    const customer = appointment.customer;
    const service = AppointmentService.SERVICES.find(s => s.id === appointment.serviceType);
    
    console.log(`🆕 NUEVA CITA AGENDADA VIA FLOW:`);
    console.log(`👤 Cliente: ${customer.name} (${customer.phoneNumber})`);
    console.log(`📅 Fecha: ${appointment.dateTime.toLocaleString('es-CO')}`);
    console.log(`� Servicio: ${service?.title || appointment.serviceType}`);
    console.log(`📝 Notas: ${appointment.notes || 'Ninguna'}`);
    console.log(`🆔 ID: ${appointment._id}`);
    
    // Si tienes un número de administrador, podrías enviar:
    // const adminPhone = process.env.ADMIN_PHONE_NUMBER;
    // if (adminPhone) {
    //   await sendWhatsAppMessage(adminPhone, adminNotificationMessage);
    // }
  }
}

module.exports = NotificationService;
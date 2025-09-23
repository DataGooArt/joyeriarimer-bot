// flowService.js  
// 🔄 Servicio para manejar WhatsApp Flows de citas

const AppointmentService = require('./appointmentService');

class FlowService {
  
  /**
   * Iniciar flow de reserva de cita desde el bot
   */
  static async sendAppointmentFlow(phoneNumber, flowId = process.env.WHATSAPP_APPOINTMENT_FLOW_ID) {
    const message = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "interactive",
      interactive: {
        type: "flow",
        header: {
          type: "text",
          text: "📅 Reservar Cita"
        },
        body: {
          text: "Selecciona el servicio que necesitas y agenda tu cita con nosotros:"
        },
        footer: {
          text: "Taller de Joyería Rimer"
        },
        action: {
          name: "flow",
          parameters: {
            flow_message_version: "3",
            flow_token: `appointment_${Date.now()}`,
            flow_id: flowId,
            flow_cta: "Agendar Cita",
            flow_action: "navigate",
            flow_action_payload: {
              screen: "APPOINTMENT"
            }
          }
        }
      }
    };
    
    return message;
  }

  /**
   * Procesar respuesta del flow de citas
   */
  static async processAppointmentFlowResponse(decryptedBody) {
    try {
      console.log('🔄 Procesando Flow interactivo:', JSON.stringify(decryptedBody, null, 2));
      
      // Manejar peticiones de "ping" de Meta para validación
      if (decryptedBody.action === 'ping') {
        console.log('🏓 Respondiendo ping de Meta para validación');
        return {
          responseRequired: true,
          data: { status: "active" }
        };
      }
      
      // Si es una petición de datos (data_exchange), manejar con AppointmentService
      if (decryptedBody.action === 'data_exchange' || decryptedBody.screen) {
        const flowResult = await AppointmentService.handleAppointmentFlow(decryptedBody);
        
        // Determinar si se requiere respuesta encriptada (navegación entre pantallas)
        const requiresResponse = flowResult.screen !== 'SUCCESS';
        
        return {
          responseRequired: requiresResponse,
          data: flowResult
        };
      }
      
      // Formato legacy para compatibilidad (si viene response directa)
      if (decryptedBody.response) {
        return await this.processLegacyAppointmentFlow(decryptedBody);
      }
      
      console.log('⚠️ Formato de Flow no reconocido');
      return {
        responseRequired: false,
        message: 'Formato no reconocido'
      };
      
    } catch (error) {
      console.error('❌ Error procesando Flow de citas:', error);
      
      // En caso de error, redirigir al inicio del Flow
      return {
        responseRequired: true,
        data: {
          version: "3.0",
          screen: "APPOINTMENT",
          data: AppointmentService.getInitialAppointmentData()
        }
      };
    }
  }

  /**
   * Procesar respuesta del Flow de citas (LEGACY - mantener para compatibilidad)
   */
  static async processLegacyAppointmentFlow(flowData) {
    try {
      const { 
        flow_token,
        response: { 
          name,
          phone_number,
          department,
          date,
          time,
          additional_notes 
        }
      } = flowData;

      // Crear la cita usando el servicio
      const appointment = await AppointmentService.createAppointment({
        customerPhone: phone_number,
        customerName: name,
        service: department,
        date: date,
        time: time,
        notes: additional_notes || ''
      });

      // Enviar notificación de nueva cita
      const NotificationService = require('./notificationService');
      await NotificationService.sendNewAppointmentNotification(appointment);

      // Mensaje de confirmación
      const confirmationMessage = {
        messaging_product: "whatsapp",
        recipient_type: "individual", 
        to: phone_number,
        type: "text",
        text: {
          body: `✅ *Cita Confirmada*\n\n` +
                `👤 *Cliente:* ${name}\n` +
                `📅 *Fecha:* ${new Date(date).toLocaleDateString('es-ES')}\n` +
                `⏰ *Hora:* ${time}\n` +
                `🔧 *Servicio:* ${AppointmentService.SERVICES[department]?.title}\n\n` +
                `📍 *Ubicación:* Taller de Joyería Rimer\n\n` +
                `Te enviaremos un recordatorio 1 día antes de tu cita. ¡Nos vemos pronto! 💎`
        }
      };

      return {
        success: true,
        appointment,
        confirmationMessage,
        responseRequired: false
      };

    } catch (error) {
      console.error('Error procesando flow de citas legacy:', error);
      return {
        success: false,
        error: error.message,
        responseRequired: false
      };
    }
  }

  /**
   * Generar mensaje con botón para agendar cita
   */
  static createAppointmentButton(phoneNumber, context = '') {
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "interactive",
      interactive: {
        type: "button",
        header: {
          type: "text", 
          text: "📅 ¿Te gustaría agendar una cita?"
        },
        body: {
          text: context || "Podemos atenderte personalmente en nuestro taller para brindarte la mejor asesoría."
        },
        footer: {
          text: "Taller de Joyería Rimer"
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: "start_appointment_flow",
                title: "📅 Agendar Cita"
              }
            },
            {
              type: "reply", 
              reply: {
                id: "continue_chat",
                title: "💬 Seguir Conversando"
              }
            }
          ]
        }
      }
    };
  }
}

module.exports = FlowService;
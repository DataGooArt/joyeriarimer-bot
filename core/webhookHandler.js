'use strict';

const { decryptRequest, encryptResponse, FlowEndpointException } = require('./encryption.js');
const { 
    handleSmartReply, 
    handleProductSelection, 
    handleTermsAcceptance, 
    handleCategorySelection,
    handleProductDetailRequest,
    handleProductAction,
    getModel 
} = require('./bot.js');
const whatsapp = require('../api/whatsapp.js');

/**
 * Procesa el cuerpo de la petición del webhook de WhatsApp.
 * @param {object} body - El cuerpo de la petición (req.body).
 */
async function processWebhook(body) {
    console.log('--- PROCESANDO WEBHOOK ---');
    console.log(JSON.stringify(body, null, 2));

    // --- MANEJO DE FLOWS CIFRADOS ---
    // Si el body contiene los campos de cifrado, es una solicitud de un Flow.
    if (body.encrypted_flow_data && body.encrypted_aes_key && body.initial_vector) {
        console.log('🔄 Detectada solicitud de Flow cifrada.');
        const privateKey = process.env.WHATSAPP_FLOW_PRIVATE_KEY;
        if (!privateKey) {
            console.error('❌ Falta la variable de entorno WHATSAPP_FLOW_PRIVATE_KEY.');
            return; // No podemos hacer nada sin la clave.
        }

        try {
            const { decryptedBody, aesKeyBuffer, initialVectorBuffer } = decryptRequest(body, privateKey);
            console.log('✅ Flow descifrado:', JSON.stringify(decryptedBody, null, 2));
            // Aquí procesaríamos la lógica del flow y generaríamos una respuesta.
            // Por ahora, solo acusamos de recibido para la prueba de salud.
            const response = { data: { acknowledged: true } };
            return encryptResponse(response, aesKeyBuffer, initialVectorBuffer);
        } catch (error) {
            console.error('❌ Error en el procesamiento del Flow cifrado:', error);
            // Si hay un error de descifrado, FlowEndpointException ya tiene el código de estado correcto.
            throw error;
        }
    }

    // --- MANEJO DE WEBHOOKS NORMALES (NO CIFRADOS) ---
    if (body.object !== 'whatsapp_business_account') {
        console.log('⏩ Ignorando evento que no es de WhatsApp Business Account.');
        return;
    }

    const entry = body.entry && body.entry[0];
    const change = entry.changes && entry.changes[0];
    const message = change.value.messages && change.value.messages[0];

    if (!message) {
        console.log('⏩ Ignorando notificación sin mensaje (ej. estado de entrega).');
        return;
    }

    const from = message.from;

    switch (message.type) {
        case 'text':
            console.log(`💬 Mensaje de texto recibido de ${from}: "${message.text.body}"`);
            await handleSmartReply(from, message.text.body);
            break;

        case 'button':
            // NUEVO: Manejar mensajes de tipo 'button' (botones de plantillas)
            const buttonPayload = message.button.payload;
            const buttonText = message.button.text;
            console.log(`🔘 Usuario ${from} presionó botón: "${buttonText}" (payload: "${buttonPayload}")`);
            
            if (buttonPayload === 'Aceptar y continuar' || buttonText === 'Aceptar y continuar') {
                console.log(`✅ Usuario ${from} ha aceptado los términos via botón.`);
                await handleTermsAcceptance(from);
            } else {
                await handleSmartReply(from, `Presionó el botón: ${buttonText}`);
            }
            break;

        case 'interactive':
            if (message.interactive.type === 'list_reply') {
                const selectedProductId = message.interactive.list_reply.id.replace('product_', '');
                console.log(`🛍️ Usuario ${from} seleccionó un producto de la lista (ID: ${selectedProductId})`);
                await handleProductSelection(from, selectedProductId);
            } else if (message.interactive.type === 'button_reply') {
                const buttonId = message.interactive.button_reply.id;
                const buttonTitle = message.interactive.button_reply.title;
                console.log(`🔘 Usuario ${from} presionó el botón con ID: '${buttonId}' y título: '${buttonTitle}'`);

                // Si el botón es el de "Aceptar y continuar" de la plantilla de bienvenida...
                if (buttonTitle === 'Aceptar y continuar') {
                    console.log(`✅ Usuario ${from} ha aceptado los términos.`);
                    await handleTermsAcceptance(from);
                } 
                // Manejar botones de categorías
                else if (buttonId.startsWith('cat_')) {
                    await handleCategorySelection(from, buttonId);
                }
                // Manejar botones de productos
                else if (buttonId.startsWith('prod_')) {
                    await handleProductDetailRequest(from, buttonId);
                }
                // Manejar botones de acciones finales
                else if (['cotizar_producto', 'agendar_cita', 'ver_mas_productos'].includes(buttonId)) {
                    await handleProductAction(from, buttonId);
                }
                // Manejar botón de iniciar flow de citas
                else if (buttonId === 'start_appointment_flow') {
                    const FlowService = require('../services/flowService');
                    const appointmentFlow = await FlowService.sendAppointmentFlow(from);
                    
                    const { sendWhatsAppMessage } = require('../services/whatsappService');
                    await sendWhatsAppMessage(from, appointmentFlow);
                }
                else {
                    // Manejar otros botones con IA
                    await handleSmartReply(from, `Presionó el botón: ${buttonTitle}`);
                }
            } else if (message.interactive.type === 'nfm_reply') {
                // El usuario ha visto el Flow de bienvenida (solo informativo).
                // Ya enviamos el mensaje de IA en handleTermsAcceptance, así que aquí solo confirmamos.
                console.log(`✅ Usuario ${from} vio el Flow de bienvenida. IA ya iniciada.`);
                // No enviamos otro mensaje aquí porque ya se envió en handleTermsAcceptance
            } else if (message.interactive.type === 'flow_completion') {
                const flowResponse = JSON.parse(message.interactive.flow_completion.response_json);
                console.log(`✅ Usuario ${from} completó el Flow.`);
                console.log('Datos recibidos del Flow:', JSON.stringify(flowResponse, null, 2));

                // Verificamos si es la respuesta del Flow de citas
                if (flowResponse.appointment_date && flowResponse.appointment_time) {
                    const { appointment_date, appointment_time } = flowResponse;
                    const appointmentDateTime = new Date(`${appointment_date}T${appointment_time}`);

                    // Guardamos la cita en la conversación
                    const Conversation = getModel('Conversation');
                    await Conversation.updateOne(
                        { phoneNumber: from },
                        { $set: { "extractedData.appointmentDate": appointmentDateTime, status: 'open' } }
                    );

                    // Enviamos la confirmación al usuario
                    const confirmationMessage = `¡Perfecto! Tu cita ha sido agendada para el ${appointment_date} a las ${appointment_time}. Te enviaremos un recordatorio. ¿Hay algo más en lo que pueda ayudarte?`;
                    await handleSmartReply(from, confirmationMessage);

                } else {
                    // Lógica para otros flows (como el de bienvenida)
                    await handleSmartReply(from, "Gracias por completar el formulario. ¿En qué te puedo ayudar ahora?");
                }
            }
            break;
        
        default:
            console.log(`⏩ Ignorando mensaje de tipo '${message.type}' de ${from}`);
            break;
    }
}

module.exports = { processWebhook };
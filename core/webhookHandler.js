'use strict';

const { decryptRequest, encryptResponse, FlowEndpointException, getPrivateKey } = require('./encryption.js');
const { handleSmartReply, handleProductSelection, handleTermsAcceptance, getModel } = require('./bot.js');
const whatsapp = require('../api/whatsapp.js');
const Customer = require('../models/Customer');
const ChatSession = require('../models/ChatSession');
const Appointment = require('../models/Appointment');

/**
 * Maneja los eventos data_exchange del WhatsApp Flow
 * @param {object} decryptedBody - Cuerpo descifrado del Flow
 * @returns {object} - Respuesta para el Flow
 */
async function handleFlowDataExchange(decryptedBody) {
    const { screen, data, action } = decryptedBody;
    
    console.log(`🔄 Procesando pantalla del Flow: ${screen}, action: ${action}`, data);
    
    // Importar modelos necesarios
    const Service = require('../models/Service');
    const Location = require('../models/Location');
    
    switch (screen) {
        case 'APPOINTMENT':
            console.log('📅 Procesando pantalla APPOINTMENT:', data);
            
            try {
                // Si es navegación hacia DETAILS, solo pasar los datos seleccionados
                if (data.department && data.location && data.date && data.time) {
                    console.log('✅ Navegando hacia DETAILS con datos:', {
                        department: data.department,
                        location: data.location,
                        date: data.date,
                        time: data.time
                    });
                    
                    return {
                        screen: 'DETAILS',
                        data: {
                            department: data.department,
                            location: data.location,
                            date: data.date,
                            time: data.time
                        }
                    };
                }
                
                // Si es data_exchange durante la selección, mantener la pantalla APPOINTMENT
                return {
                    screen: 'APPOINTMENT',
                    data: {
                        acknowledged: true,
                        // Los datos dinámicos se obtienen desde MongoDB (ya corregidos con title)
                        is_location_enabled: Boolean(data.department),
                        is_date_enabled: Boolean(data.department) && Boolean(data.location),
                        is_time_enabled: Boolean(data.department) && Boolean(data.location) && Boolean(data.date)
                    }
                };
                
            } catch (error) {
                console.error('❌ Error en pantalla APPOINTMENT:', error);
                return {
                    data: {
                        acknowledged: false,
                        error: 'Error procesando la selección'
                    }
                };
            }
            
        case 'DETAILS':
            console.log('👤 Procesando pantalla DETAILS:', data);
            
            try {
                // Obtener nombres legibles para mostrar en SUMMARY
                const service = await Service.findOne({ id: data.department });
                const location = await Location.findOne({ id: data.location });
                
                // Formatear fecha
                const dateObj = new Date(data.date);
                const formattedDate = dateObj.toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
                
                // Formatear hora
                const timeFormatted = data.time;
                
                // Crear texto de resumen para la cita
                const appointmentSummary = `💎 ${service?.flowDisplayName || service?.name}\n📍 ${location?.flowDisplayName || location?.name}\n📅 ${formattedDate}\n🕒 ${timeFormatted}`;
                
                // Crear texto de resumen para los datos del cliente
                const detailsSummary = `👤 ${data.name}\n📧 ${data.email}\n📱 ${data.phone}${data.more_details ? '\n📝 ' + data.more_details : ''}`;
                
                console.log('✅ Navegando hacia SUMMARY con datos completos');
                
                return {
                    screen: 'SUMMARY',
                    data: {
                        appointment: appointmentSummary,
                        details: detailsSummary,
                        department: data.department,
                        location: data.location,
                        date: data.date,
                        time: data.time,
                        name: data.name,
                        email: data.email,
                        phone: data.phone,
                        more_details: data.more_details || '',
                        terms_accepted: false,
                        privacy_accepted: false
                    }
                };
                
            } catch (error) {
                console.error('❌ Error en pantalla DETAILS:', error);
                return {
                    data: {
                        acknowledged: false,
                        error: 'Error procesando los datos personales'
                    }
                };
            }
            
        case 'SUMMARY':
            console.log('✅ Procesando pantalla SUMMARY (confirmación final):', data);
            
            try {
                // Primero crear o encontrar el Customer
                const Customer = require('../models/Customer');
                let customer = await Customer.findOne({ phone: data.phone });
                
                if (!customer) {
                    // Crear nuevo customer si no existe
                    customer = new Customer({
                        name: data.name,
                        phone: data.phone,
                        email: data.email,
                        termsAcceptedAt: data.terms_accepted ? new Date() : null
                    });
                    await customer.save();
                    console.log('✅ Nuevo customer creado:', customer._id);
                } else {
                    // Actualizar datos del customer existente si es necesario
                    customer.name = data.name;
                    customer.email = data.email;
                    if (data.terms_accepted && !customer.termsAcceptedAt) {
                        customer.termsAcceptedAt = new Date();
                    }
                    await customer.save();
                    console.log('✅ Customer existente actualizado:', customer._id);
                }
                
                // Crear la cita con los campos correctos del modelo
                const appointmentData = {
                    customer: customer._id, // ObjectId requerido
                    dateTime: new Date(`${data.date}T${data.time}`), // Campo requerido
                    serviceId: data.department,
                    locationId: data.location,
                    customerEmail: data.email,
                    customerNotes: data.more_details || '',
                    status: 'confirmed',
                    termsAccepted: data.terms_accepted,
                    privacyAccepted: data.privacy_accepted,
                    consentDate: new Date()
                };
                
                // Crear la cita en la base de datos
                const appointment = new Appointment(appointmentData);
                await appointment.save();
                
                // Generar referencia única
                const reference = `JR${Date.now().toString().slice(-8)}`;
                
                console.log('✅ Cita guardada exitosamente:', {
                    reference,
                    appointmentId: appointment._id
                });
                
                // ENVIAR MENSAJE DE CONFIRMACIÓN POR WHATSAPP
                try {
                    const WhatsAppService = require('../services/whatsappService');
                    const whatsappService = new WhatsAppService();
                    
                    // Formatear fecha en español
                    const fechaFormateada = new Date(`${data.date}T${data.time}`).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric', 
                        month: 'long',
                        day: 'numeric'
                    });
                    
                    const confirmationMessage = `🎉 *¡Cita confirmada exitosamente!*\n\n` +
                        `📋 *Referencia:* ${reference}\n` +
                        `💎 *Servicio:* ${data.department === 'consulta' ? 'Consulta General' : data.department}\n` +
                        `📍 *Sede:* ${data.location === 'cartagena' ? 'Cartagena' : data.location}\n` +
                        `📅 *Fecha:* ${fechaFormateada}\n` +
                        `🕒 *Hora:* ${data.time}\n\n` +
                        `👤 *Datos del cliente:*\n` +
                        `• Nombre: ${data.name}\n` +
                        `• Email: ${data.email}\n` +
                        `• Teléfono: ${data.phone}\n` +
                        `${data.more_details ? `• Detalles: ${data.more_details}\n` : ''}` +
                        `\n✨ Te esperamos en nuestra joyería. ¡Gracias por confiar en nosotros!`;
                    
                    // Enviar mensaje al usuario usando su teléfono
                    await whatsappService.sendTextMessage(data.phone, confirmationMessage);
                    console.log('✅ Mensaje de confirmación enviado al WhatsApp:', data.phone);
                    
                } catch (msgError) {
                    console.error('❌ Error enviando mensaje de confirmación:', msgError);
                    // No fallar el Flow si el mensaje no se envía
                }
                
                // Navegar a pantalla SUCCESS
                return {
                    screen: 'SUCCESS',
                    data: {
                        success_message: '¡Tu cita ha sido confirmada exitosamente!',
                        appointment_details: `📋 Referencia: ${reference}\n💎 Servicio: ${data.department}\n📍 Sede: ${data.location}\n📅 Fecha: ${data.date}\n🕒 Hora: ${data.time}`
                    }
                };
                
            } catch (error) {
                console.error('❌ Error guardando la cita:', error);
                return {
                    data: {
                        acknowledged: false,
                        error: 'Error confirmando la cita'
                    }
                };
            }
            
        case 'SUCCESS':
            console.log('🎉 Flow completado exitosamente:', data);
            return {
                data: {
                    acknowledged: true,
                    status: 'completed'
                }
            };
            
        default:
            console.log(`⚠️ Pantalla desconocida del Flow: ${screen}`, data);
            return {
                data: {
                    acknowledged: true
                }
            };
    }
}

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
        
        try {
            const privateKey = getPrivateKey();
            const passphrase = process.env.WHATSAPP_FLOW_PRIVATE_KEY_PASSPHRASE || '';
            const { decryptedBody, aesKeyBuffer, initialVectorBuffer } = decryptRequest(body, privateKey, passphrase);
            console.log('✅ Flow descifrado:', JSON.stringify(decryptedBody, null, 2));
            
            // --- Lógica del Flow ---
            let response;
            if (decryptedBody.action === 'ping') {
                // Para ping de validación, Meta espera específicamente esta respuesta
                console.log('✅ Respondiendo al ping de validación de Meta.');
                response = {
                    data: {
                        status: "active"
                    }
                };
            } else if (decryptedBody.action === 'data_exchange') {
                // Manejar eventos de intercambio de datos del Flow
                console.log('📋 Procesando data_exchange del Flow:', decryptedBody.screen);
                response = await handleFlowDataExchange(decryptedBody);
            } else {
                // Para otras acciones, acusar de recibido
                console.log(`🎬 Acción del flow recibida: ${decryptedBody.action}`);
                response = { data: { acknowledged: true } };
            }
            
            console.log('🔐 Cifrando respuesta:', JSON.stringify(response, null, 2));
            const encryptedResponse = encryptResponse(response, aesKeyBuffer, initialVectorBuffer);
            console.log('✅ Respuesta cifrada generada, longitud:', encryptedResponse.length, 'caracteres');
            console.log('🔍 Inicio de respuesta cifrada:', encryptedResponse.substring(0, 50) + '...');
            return encryptedResponse;
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
                // Cambiamos la lógica para verificar por el texto del botón, ya que el ID puede no ser configurable.
                if (buttonTitle === 'Aceptar y continuar') {
                    console.log(`✅ Usuario ${from} ha aceptado los términos.`);
                    await handleTermsAcceptance(from); // Llamamos a la función centralizada
                } else if (buttonTitle === 'Agendar Cita' || buttonId === 'schedule_appointment') {
                    console.log('📅 Usuario quiere agendar cita - enviando Flow');
                    await handleSmartReply(from, 'agendar cita');
                } else if (buttonId.startsWith('category_')) {
                    const category = buttonId.replace('category_', '');
                    console.log(`🛍️ Usuario seleccionó categoría: ${category}`);
                    await handleSmartReply(from, `ver ${category}`);
                } else if (buttonId === 'promociones') {
                    console.log('🔥 Usuario seleccionó promociones');
                    await handleSmartReply(from, 'ver promociones');
                } else {
                    // Manejar otros botones si es necesario
                    await handleSmartReply(from, `Presionó el botón: ${message.interactive.button_reply.title}`);
                }
            } else if (message.interactive.type === 'nfm_reply') {
                // El usuario ha completado el Flow de bienvenida.
                // Ahora le preguntamos en qué podemos ayudarle para que la IA pueda analizar su siguiente mensaje.
                console.log(`✅ Usuario ${from} completó el Flow de bienvenida.`);
                await handleSmartReply(from, "Gracias por confirmar. Ahora, dime, ¿en qué te puedo ayudar hoy?");
            } else if (message.interactive.type === 'flow_completion') {
                const flowResponse = JSON.parse(message.interactive.flow_completion.response_json);
                console.log(`✅ Usuario ${from} completó el Flow.`);
                console.log('Datos recibidos del Flow:', JSON.stringify(flowResponse, null, 2));

                // Verificamos si es la respuesta del Flow de citas
                if (flowResponse.appointment_date && flowResponse.appointment_time) {
                    const { appointment_date, appointment_time, service_type, additional_notes } = flowResponse;
                    const appointmentDateTime = new Date(`${appointment_date}T${appointment_time}`);

                    try {
                        const customer = await Customer.findOne({ phone: from });
                        if (!customer) {
                            console.error(`Error al guardar cita: No se encontró cliente con teléfono ${from}`);
                            await whatsapp.sendTextMessage(from, "Hubo un problema al agendar tu cita. No pudimos encontrarte en nuestro sistema. Por favor, contacta a un asesor.");
                            return;
                        }

                        const session = await ChatSession.findOne({ customer: customer._id, status: 'open' });
                        
                        const newAppointment = new Appointment({
                            customer: customer._id,
                            session: session ? session._id : null,
                            appointmentDate: appointmentDateTime,
                            service: service_type || 'No especificado',
                            notes: additional_notes || 'Agendado vía Flow de WhatsApp.',
                            status: 'scheduled'
                        });

                        await newAppointment.save();
                        console.log(`✅ Cita guardada en la base de datos con ID: ${newAppointment._id}`);

                        if (session) {
                            session.context.lastAppointmentId = newAppointment._id;
                            session.context.lastIntent = 'appointment_scheduled'; // Update context
                            await session.save();
                        }

                        const confirmationMessage = `¡Perfecto, ${customer.name || ''}! Tu cita para el servicio de "${service_type || 'consulta'}" ha sido agendada para el ${appointment_date} a las ${appointment_time}. Te enviaremos un recordatorio.`;
                        await whatsapp.sendTextMessage(from, confirmationMessage); // Using direct sendTextMessage to avoid re-triggering AI

                    } catch (dbError) {
                        console.error("❌ Error al guardar la cita en la base de datos:", dbError);
                        await whatsapp.sendTextMessage(from, "Tu cita fue recibida, pero tuvimos un problema al guardarla en nuestro sistema. Un asesor te contactará en breve para confirmar.");
                    }

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
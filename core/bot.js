'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
const whatsapp = require('../api/whatsapp.js');
const { buildMainPrompt } = require('./prompts');
const { appointmentService } = require('../services/appointmentService');
const Customer = require('../models/Customer');
const Product = require('../models/Product');

// --- CONFIGURACIÓN E INICIALIZACIÓN DEL LLM ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// --- IMPORTACIÓN DE MODELOS ---

// Los modelos ahora se importan desde archivos dedicados
const ChatSession = require('../models/ChatSession');
const MessageLog = require('../models/MessageLog');
const Order = require('../models/Order');
const Appointment = require('../models/Appointment');

// Modelos importados desde archivos dedicados

/**
 * Genera una respuesta estructurada en JSON a partir de un prompt.
 * @param {string} prompt - El prompt completo a enviar al modelo de lenguaje.
 * @returns {Promise<object>} El objeto JSON parseado de la respuesta del modelo.
 */
async function generateJsonResponse(prompt) {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(jsonText);
}

/**
 * Maneja una solicitud de productos, busca en la BD y envía una lista interactiva.
 * @param {string} to - El número de teléfono del destinatario.
 * @param {object} aiResponse - El objeto de respuesta de la IA, que contiene la intención y los datos extraídos.
 */
async function handleProductRequest(to, aiResponse) {
    try {
        const { preferences } = aiResponse.extractedData || {};
        let query = { isAvailable: true };

        // Búsqueda de texto simple en campos relevantes si hay preferencias.
        // Para que esto funcione de manera óptima, la colección 'products' en MongoDB
        // debería tener un índice de texto en campos como 'name', 'description', 'category', 'tags'.
        if (preferences && typeof preferences === 'string') {
            // Limpiamos un poco las preferencias para una mejor búsqueda
            const searchTerms = preferences.replace(/,/g, ' ').trim();
            if (searchTerms) {
                query.$text = { $search: searchTerms };
            }
        }

        const products = await Product.find(query).limit(10); // Limitar a 10 para la lista de WhatsApp

        if (products && products.length > 0) {
            console.log(`🔎 Productos encontrados para "${preferences || 'todos'}": ${products.length}`);
            
            await whatsapp.sendProductListMessage(
                to,
                products,
                aiResponse.response, // El texto generado por la IA como cuerpo del mensaje
                "Ver Catálogo"       // El texto del botón que despliega la lista
            );
        } else {
            console.log(`🚫 No se encontraron productos específicos para: "${preferences || 'búsqueda general'}"`);
            
            // Si no hay productos específicos o es una consulta general, mostrar menú de categorías
            await sendCategoryMenu(to, aiResponse.response);
        }
    } catch (error) {
        console.error("❌ Error en handleProductRequest:", error);
        await whatsapp.sendTextMessage(to, "Ups, tuve un problema al buscar en nuestro catálogo. Por favor, intenta de nuevo o pide hablar con un asesor.");
    }
}

/**
 * Procesa la pregunta del usuario, detecta la intención con Gemini y actúa en consecuencia.
 * @param {string} to - El número de teléfono del destinatario.
 * @param {string} userQuery - La pregunta del usuario.
 * @param {object|null} preloadedCustomer - (Opcional) Un objeto de cliente ya cargado para evitar una nueva consulta a la BD.
 */
async function handleSmartReply(to, userQuery, preloadedCustomer = null) {
    // 1. Buscar o crear el cliente
    let customer = preloadedCustomer;
    if (!customer) {
        customer = await Customer.findOneAndUpdate(
            { phone: to },
            { $setOnInsert: { phone: to, tags: ['Nuevo cliente'] } },
            { upsert: true, new: true }
        );
    }

    // 2. GATEKEEPER: ¿Ha aceptado términos?
    if (!customer.termsAcceptedAt) {
        console.log(`▶️ Usuario SIN consentimiento detectado.`);
        
        // ¿Está aceptando términos?
        const isAccepting = /^(aceptar|acepto|si|sí|ok|continuar|de acuerdo|aceptar y continuar)/i.test(userQuery.trim());
        
        if (isAccepting) {
            console.log("✅ Usuario aceptando términos por primera vez...");
            
            // Actualizar en BD
            customer.termsAcceptedAt = new Date();
            customer.tags.addToSet('Términos Aceptados');
            await customer.save();
            
            // ENVIAR FLOW DE BIENVENIDA (ID: 1123954915939585)
            console.log("🌟 Enviando Flow de Bienvenida...");
            
            if (process.env.DISABLE_FLOWS === 'true') {
                // Modo sin flows - mensaje de texto
                await whatsapp.sendTextMessage(to, 
                    "¡Perfecto! Bienvenido a Joyería Rimer. 💎✨\n\n" +
                    "Somos especialistas en joyería fina artesanal.\n\n" +
                    "¿En qué te podemos ayudar hoy?\n" +
                    "• Ver anillos de compromiso\n" +
                    "• Explorar cadenas y pulseras\n" +
                    "• Agendar una cita\n" +
                    "• Hablar con un asesor\n\n" +
                    "Para comenzar, ¿podrías decirme tu nombre?"
                );
            } else {
                // ENVIAR EL FLOW DE BIENVENIDA
                await whatsapp.sendFlowMessage(
                    to,
                    "1123954915939585", // ID del Flow de Bienvenida
                    "Bienvenido a Joyería Rimer",
                    "WELCOME_SCREEN", // Screen inicial del flow
                    "Empezar",
                    "¡Bienvenido! Completa tu información para una atención personalizada."
                );
            }
            return; // SALIR - Ya enviamos respuesta
        } else {
            // Enviar términos y condiciones
            console.log("📋 Enviando términos y condiciones...");
            if (process.env.DISABLE_FLOWS === 'true') {
                await whatsapp.sendTextMessage(to, 
                    "¡Hola! Bienvenido a Joyería Rimer 💎\n\n" +
                    "Antes de continuar, necesitas aceptar nuestros términos:\n\n" +
                    "📋 Términos: https://web.tallerdejoyeriarimer.com/terms\n" +
                    "🔒 Privacidad: https://web.tallerdejoyeriarimer.com/privacy\n\n" +
                    "Escribe 'ACEPTO' para continuar."
                );
            } else {
                await whatsapp.sendTemplateMessage(
                    to,
                    process.env.WHATSAPP_FLOW_TEMPLATE_NAMESPACE,
                    'es',
                    process.env.WELCOME_TEMPLATE_HEADER_IMAGE_URL,
                    ["https://web.tallerdejoyeriarimer.com/terms", "https://web.tallerdejoyeriarimer.com/privacy"]
                );
            }
            return; // SALIR - Ya enviamos respuesta
        }
    }

    // 3. CLIENTE YA TIENE CONSENTIMIENTO - Procesar con IA
    console.log(`✅ Cliente con consentimiento confirmado. Procesando: "${userQuery}"`);

    // Crear/obtener sesión
    let session = await ChatSession.findOne({ customer: customer._id, status: 'open' });
    if (!session) {
        session = new ChatSession({ 
            customer: customer._id, 
            phone: to, 
            context: {} 
        });
        await session.save();
    }

    // Verificar context
    if (!session.context) {
        session.context = {};
        await session.save();
    }

    // Log mensaje entrante
    const inboundLog = new MessageLog({
        session: session._id,
        direction: 'inbound',
        text: userQuery
    });
    await inboundLog.save();

    // Historial para IA
    const recentLogs = await MessageLog.find({ session: session._id }).sort({ createdAt: -1 }).limit(10);
    const historyForPrompt = recentLogs
        .reverse()
        .map(log => `${log.direction === 'inbound' ? 'Cliente' : 'Asistente'}: "${log.text}"`)
        .join('\n');

    try {
        // Llamar a IA
        const prompt = buildMainPrompt(customer, session, userQuery, historyForPrompt);
        const aiResponse = await generateJsonResponse(prompt);

        console.log(`🤖 Intención detectada: ${aiResponse.intent}`);
        console.log(`🤖 Respuesta generada: "${aiResponse.response}"`);
        console.log(`⭐ Prioridad asignada: ${aiResponse.priority}`);
        console.log(`💯 Lead Score: ${aiResponse.leadScore}`);

        // Actualizar cliente
        if (aiResponse.firstName && !customer.name) customer.name = aiResponse.firstName;
        if (aiResponse.tags && aiResponse.tags.length > 0) customer.tags.addToSet(...aiResponse.tags);
        customer.priority = aiResponse.priority;
        customer.leadScore = aiResponse.leadScore;
        await customer.save();

        // Actualizar sesión
        session.context.lastIntent = aiResponse.intent;
        if (aiResponse.extractedData) Object.assign(session.context, aiResponse.extractedData);
        await session.save();

        // Log mensaje saliente
        const outboundLog = new MessageLog({ 
            session: session._id, 
            direction: 'outbound', 
            text: aiResponse.response 
        });
        await outboundLog.save();

        // Enviar respuesta según intención
        switch (aiResponse.intent) {
            case 'greeting':
                // Para saludos, enviar mensaje de bienvenida con menú
                await whatsapp.sendTextMessage(to, aiResponse.response);
                await sendCategoryMenu(to, '¿En qué puedo ayudarte hoy?');
                break;
            case 'schedule_appointment':
                console.log('▶️  Iniciando Flow de Agendamiento...');
                await sendAppointmentFlow(to, aiResponse.response);
                break;
            case 'collect_name':
            case 'clarify_inquiry':
                await whatsapp.sendTextMessage(to, aiResponse.response);
                break;
            case 'list_products':
            case 'product_inquiry':
                await handleProductRequest(to, aiResponse);
                break;
            case 'human_handover':
                await whatsapp.sendTextMessage(to, aiResponse.response);
                await transferToChatwoot(to, userQuery);
                break;
            default:
                await whatsapp.sendTextMessage(to, aiResponse.response);
                break;
        }

    } catch (error) {
        console.error("❌ Error en handleSmartReply:", error);
        await whatsapp.sendTextMessage(to, "Lo siento, hay un problema técnico. Te conectaré con un asesor.");
        await transferToChatwoot(to, `Error técnico: ${error.message}. Mensaje: "${userQuery}"`);
    }
}

/**
 * Envía el Flow de agendamiento de citas con datos optimizados.
 * @param {string} to - El número de teléfono del destinatario.
 * @param {string} aiResponse - Respuesta personalizada de la IA.
 */
async function sendAppointmentFlow(to, aiResponse) {
    try {
        const flowId = process.env.WHATSAPP_FLOW_APPOINTMENT_ID || '1123954915939585';
        
        console.log('🔧 OBTENIENDO DATOS DESDE MONGODB PARA FLOW...');
        
        // Importar modelos
        const Service = require('../models/Service');
        const Location = require('../models/Location');
        
        // Obtener servicios y ubicaciones desde MongoDB
        const services = await Service.getForFlow();
        const locations = await Location.getForFlow();
        const availableDates = appointmentService.generateAvailableDates(15);

        const flowActionPayload = {
            screen: 'APPOINTMENT',
            data: {
                services: services,
                locations: locations,
                available_dates: availableDates,
                business_info: {
                    name: 'Joyería Rimer',
                    phone: process.env.WHATSAPP_PHONE_NUMBER_ID,
                    hours: 'Lun-Sáb 9:00-18:00'
                }
            }
        };

        console.log('📦 Datos sincronizados con MongoDB:', {
            servicios: services.length,
            ubicaciones: locations.length,
            fechas: availableDates.length
        });

        await whatsapp.sendFlowMessage(
            to,
            flowId,
            'Appointment',
            'APPOINTMENT',
            '📅 Agendar tu Cita',
            aiResponse || '¡Perfecto! Te ayudo a agendar tu cita. Completa la información:',
            flowActionPayload
        );

        console.log('✅ Flow de agendamiento enviado con datos sincronizados desde MongoDB');
        
    } catch (error) {
        console.error('❌ Error enviando Flow de agendamiento:', error);
        
        // Fallback con datos básicos si falla MongoDB
        try {
            const fallbackData = {
                screen: 'APPOINTMENT',
                data: {
                    services: [
                        { id: 'consulta', name: 'Consulta General', duration: '30 min' }
                    ],
                    locations: [
                        { id: 'cartagena', name: 'Cartagena', address: 'Centro Histórico' }
                    ],
                    available_dates: [
                        { date: '2025-09-25', displayDate: 'Mañana, 25 de septiembre' }
                    ]
                }
            };
            
            await whatsapp.sendFlowMessage(to, flowId, 'Appointment', 'APPOINTMENT', 
                '📅 Agendar Cita', 'Sistema básico de citas disponible:', fallbackData);
            console.log('⚠️ Flow enviado con datos de fallback');
            
        } catch (fallbackError) {
            console.error('❌ Error crítico con fallback:', fallbackError);
            await whatsapp.sendTextMessage(to, 'Hubo un problema con el sistema de citas. Por favor, escríbeme qué día y hora prefieres y te ayudo manualmente.');
        }
    }
}

/**
 * Envía un menú interactivo de categorías de productos.
 * @param {string} to - El número de teléfono del destinatario.
 * @param {string} messageText - Texto personalizado del mensaje.
 */
async function sendCategoryMenu(to, messageText) {
    try {
        const categoryButtons = [
            { id: 'category_anillos', title: '💍 Anillos' },
            { id: 'category_cadenas', title: '📿 Cadenas' },
            { id: 'category_aretes', title: '💎 Aretes' },
            { id: 'category_pulseras', title: '⛓️ Pulseras' },
            { id: 'promociones', title: '🔥 Promociones' },
            { id: 'schedule_appointment', title: '📅 Agendar Cita' }
        ];

        await whatsapp.sendInteractiveMessage(
            to,
            messageText || '¡Perfecto! Aquí está nuestro catálogo de joyas 💎\n\nSelecciona la categoría que más te interese:',
            'Selecciona una opción',
            categoryButtons
        );

        console.log('📋 Menú de categorías enviado');
    } catch (error) {
        console.error("❌ Error enviando menú de categorías:", error);
        await whatsapp.sendTextMessage(to, "Tenemos anillos 💍, cadenas 📿, aretes 💎 y pulseras ⛓️. ¿Qué te interesa ver?");
    }
}

/**
 * Maneja la selección de un producto de una lista interactiva.
 * @param {string} to - El número de teléfono del destinatario.
 * @param {string} productId - El ID del producto seleccionado.
 */
async function handleProductSelection(to, productId) {
    try {
        const product = await Product.findById(productId);
        if (!product) {
            console.error(`Producto con ID ${productId} no encontrado.`);
            await whatsapp.sendTextMessage(to, "Lo siento, hubo un problema al obtener la información de ese producto. ¿Podrías intentarlo de nuevo?");
            return;
        }

        const customer = await Customer.findOne({ phone: to });
        if (customer) {
            const session = await ChatSession.findOne({ customer: customer._id, status: 'open' });
            if (session) {
                // Asegurar que aiContext existe
                if (!session.aiContext) {
                    session.aiContext = {};
                }
                session.aiContext.lastSeenProduct = product._id;
                session.markModified('aiContext');
                await session.save();
            }
        }

        const priceString = product.maxPrice ? `Desde $${product.minPrice} hasta $${product.maxPrice}` : `Precio: $${product.minPrice}`;
        const materialInfo = product.material || 'Material premium';
        const gemInfo = product.gem || 'Sin gema';

        await whatsapp.sendImageMessage(to, product.imageUrl, `${product.name}\n\nMaterial: ${materialInfo}\nGema: ${gemInfo}\n${priceString}\n\n${product.description}`);

    } catch (error) {
        console.error("❌ Error en handleProductSelection:", error);
        await whatsapp.sendTextMessage(to, "Lo siento, no pude encontrar los detalles de ese producto.");
    }
}

/**
 * Simula la transferencia a un agente humano en Chatwoot.
 * @param {string} from - El número de teléfono del cliente.
 * @param {string} initialMessage - El último mensaje del cliente.
 */
async function transferToChatwoot(from, initialMessage) {
    // La lógica de Chatwoot permanece aquí por ahora, pero podría moverse a su propio módulo api/chatwoot.js en el futuro.
    const CHATWOOT_URL = process.env.CHATWOOT_URL;
    const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;
    const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;
    const CHATWOOT_INBOX_ID = process.env.CHATWOOT_INBOX_ID;

    if (!CHATWOOT_URL || !CHATWOOT_ACCOUNT_ID || !CHATWOOT_API_TOKEN || !CHATWOOT_INBOX_ID) {
        console.warn('⚠️  Credenciales de Chatwoot no configuradas. Omitiendo transferencia.');
        return;
    }

    console.log(`--- 🚨 INICIANDO TRANSFERENCIA A CHATWOOT PARA ${from} 🚨 ---`);

    const chatwootAPI = require('axios').create({
        baseURL: `${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}`,
        headers: {
            'Content-Type': 'application/json',
            'api_access_token': CHATWOOT_API_TOKEN
        }
    });

    try {
        let contact = null;
        const searchResponse = await chatwootAPI.get(`/contacts/search?q=${from}`);
        
        if (searchResponse.data.payload.length > 0) {
            contact = searchResponse.data.payload[0];
            console.log(`✅ Contacto encontrado en Chatwoot (ID: ${contact.id})`);
        } else {
            console.log(`Contacto no encontrado. Creando uno nuevo...`);
            const createResponse = await chatwootAPI.post('/contacts', {
                inbox_id: CHATWOOT_INBOX_ID,
                name: `Cliente WhatsApp ${from}`,
                phone_number: `+${from}`
            });
            contact = createResponse.data.payload.contact;
            console.log(`✅ Contacto nuevo creado (ID: ${contact.id})`);
        }

        const conversationResponse = await chatwootAPI.post(`/contacts/${contact.id}/conversations`, {
            inbox_id: CHATWOOT_INBOX_ID,
            source_id: contact.source_id
        });
        const conversation = conversationResponse.data;
        console.log(`✅ Conversación creada (ID: ${conversation.id})`);
        const customer = await Customer.findOne({ phone: from });
        const session = await ChatSession.findOne({ customer: customer._id });
        const historyText = (await MessageLog.find({ session: session._id }).sort({ createdAt: 1 }))
            .map(turn => `Cliente: "${turn.user}"\nAsistente: "${turn.assistant}"`)
            .join('\n\n');
        if (historyText) {
            await chatwootAPI.post(`/conversations/${conversation.id}/messages`, {
                content: `--- Historial de la conversación con el bot ---\n${historyText}`,
                private: true,
                message_type: "private"
            });
            console.log(`✅ Historial de la conversación añadido como nota privada.`);
        }

        await chatwootAPI.post(`/conversations/${conversation.id}/messages`, {
            content: initialMessage,
            message_type: "incoming"
        });
        console.log(`✅ Mensaje inicial del cliente añadido a la conversación.`);
        console.log(`--- ✅ TRANSFERENCIA COMPLETADA ---`);

        if (customer.priority === 'high') {
            await chatwootAPI.post(`/conversations/${conversation.id}/labels`, {
                labels: ["prioridad_alta"]
            });
            console.log(`🏷️ Etiqueta 'prioridad_alta' añadida a la conversación en Chatwoot.`);
        }

    } catch (error) {
        console.error("❌ Error al transferir a Chatwoot:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        await whatsapp.sendTextMessage(from, "Tuvimos un problema al transferirte con un asesor. Por favor, intenta de nuevo en un momento.");
    }
}

/**
 * Maneja la aceptación de términos y condiciones del usuario.
 * @param {string} to - El número de teléfono del usuario.
 */
async function handleTermsAcceptance(to) {
    try {
        // Actualizar el campo termsAcceptedAt en la base de datos
        const customer = await Customer.findOneAndUpdate(
            { phone: to },
            { 
                termsAcceptedAt: new Date(),
                $addToSet: { tags: 'Términos Aceptados' }
            },
            { upsert: true, new: true }
        );
        
        console.log(`✅ Términos aceptados para cliente: ${to}`);
        
        // Enviar mensaje de bienvenida personalizado
        const welcomeMessage = "¡Perfecto! Bienvenido a Joyería Rimer. 💎✨\n\n" +
            "Soy tu asistente virtual y estoy aquí para ayudarte a encontrar la joya perfecta.\n\n" +
            "Para comenzar, ¿podrías decirme tu nombre?";
            
        await whatsapp.sendTextMessage(to, welcomeMessage);
        
        return customer; // ← IMPORTANTE: Retornar el customer actualizado
    } catch (error) {
        console.error("❌ Error al procesar aceptación de términos:", error);
        await whatsapp.sendTextMessage(to, "Hubo un problema al procesar tu aceptación. Por favor, intenta nuevamente.");
        return null;
    }
}

/**
 * Retorna el modelo de Gemini inicializado.
 * @returns {object} El modelo de Gemini
 */
function getModel() {
    return model; // Retorna el modelo de Gemini ya inicializado
}

// EXPORTACIONES al final del archivo:
module.exports = {
    handleSmartReply,
    handleProductSelection,
    handleTermsAcceptance,
    getModel
};
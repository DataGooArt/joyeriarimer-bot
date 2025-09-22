'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
const whatsapp = require('../api/whatsapp.js');
const { buildMainPrompt } = require('./prompts');

// --- CONFIGURACIÓN E INICIALIZACIÓN DEL LLM ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// --- MODELOS DE DATOS (SCHEMAS) ---

const attributeSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Metal", "Talla", "Gema"
  value: { type: String, required: true }
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, index: true, lowercase: true },
  material: String,
  gem: String,
  description: String,
  imageUrl: String,
  sku: { type: String, unique: true, sparse: true, index: true },
  minPrice: { type: Number, required: true, min: 0 },
  maxPrice: { type: Number, min: 0 },
  stock: { type: Number, default: 0, min: 0, index: true },
  tags: [{ type: String, lowercase: true, index: true }],
  isAvailable: { type: Boolean, default: true, index: true },
  isArtisanal: { type: Boolean, default: true },
  size: String,
  attributes: [attributeSchema], // atributos dinámicos
  parentProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed }, // info adicional (peso, certificado, origen)
}, { timestamps: true });

productSchema.index({
  name: 'text', description: 'text', category: 'text', material: 'text', gem: 'text', tags: 'text'
}, { name: 'ProductTextIndex', default_language: 'spanish' });

const Product = mongoose.model('Product', productSchema);

const customerSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, required: true, unique: true, index: true },
  email: { type: String, lowercase: true, index: true },
  whatsappOptIn: { type: Boolean, default: true },
  language: { type: String, default: 'es' },
  leadScore: { type: Number, default: 0 },
  priority: { type: String, default: 'low' },
  tags: [String],
  termsAcceptedAt: { type: Date, default: null }, // ← AGREGAR ESTA LÍNEA
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const Customer = mongoose.model('Customer', customerSchema);

const chatSessionSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', index: true },
  phone: { type: String, index: true },
  status: { type: String, default: 'open', enum: ['open', 'closed', 'pending_human'] }, // open, closed
  context: { type: mongoose.Schema.Types.Mixed, default: {} }, // ← Agregar default: {}
  openedAt: { type: Date, default: Date.now },
  closedAt: Date
}, { timestamps: true });

chatSessionSchema.index({ openedAt: 1 });
const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

const messageLogSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession', index: true },
  direction: { type: String, enum: ['inbound','outbound'], required: true },
  whatsappMessageId: { type: String, unique: true, sparse: true }, // prevenir duplicados
  text: String,
  payload: mongoose.Schema.Types.Mixed, // botones, templates, media metadata
  provider: { type: String, default: 'meta' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: false });

// TTL index opcional para logs efímeros (ej: 90 días = 90*24*60*60)
messageLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
const MessageLog = mongoose.model('MessageLog', messageLogSchema);

const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', index: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    sku: String,
    qty: Number,
    unitPrice: Number
  }],
  total: Number,
  status: { type: String, enum: ['pending','paid','shipped','cancelled','returned'], default: 'pending' },
  payment: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });
const Order = mongoose.model('Order', orderSchema);

const appointmentSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession' },
    dateTime: { type: Date, required: true },
  status: { type: String, default: 'pending', enum: ['pending', 'confirmed', 'cancelled', 'completed'] },
    notes: String // Ej. "Viene a ver anillos de compromiso"
}, { timestamps: true });
const Appointment = mongoose.model('Appointment', appointmentSchema);

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
            console.log("✅ Usuario aceptando términos vía texto...");
            // DELEGAR a handleTermsAcceptance para mantener lógica centralizada
            await handleTermsAcceptance(to);
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

    // 3. VERIFICAR SI TIENE NOMBRE (después de consentimiento)
    if (!customer.name || customer.name === 'Desconocido') {
        console.log(`▶️ Cliente sin nombre detectado. Recolectando información...`);
        
        // Si es el primer mensaje después de términos, pedir nombre
        if (userQuery.toLowerCase().includes('acepto') || userQuery.toLowerCase().includes('ok')) {
            await whatsapp.sendTextMessage(to, 
                "¡Perfecto! Ahora, para ofrecerte una atención personalizada...\n\n¿Cuál es tu nombre? 😊"
            );
            return;
        }
        
        // Si ya preguntamos por el nombre, asumir que la respuesta ES el nombre
        const extractedName = userQuery.trim();
        if (extractedName.length > 1 && extractedName.length < 50) {
            await Customer.updateOne({ _id: customer._id }, { 
                name: extractedName,
                tags: ['Nuevo cliente', 'Información completa']
            });
            customer.name = extractedName; // Actualizar objeto local
            
            await whatsapp.sendTextMessage(to, 
                `¡Mucho gusto, ${extractedName}! 🤗\n\n` +
                "Soy tu asistente personal de Joyería Rimer ✨\n\n" +
                "¿En qué puedo ayudarte hoy? Puedo mostrarte nuestros productos organizados por categorías con botones interactivos, o si prefieres, háblame directamente sobre lo que buscas.\n\n" +
                "¡También ofrecemos joyería 100% personalizada!"
            );
            
            // Mostrar categorías con botones después de un breve delay
            setTimeout(async () => {
                await whatsapp.sendCategoriesMessage(to);
            }, 2000);
            return;
        } else {
            await whatsapp.sendTextMessage(to, 
                "Por favor, compárteme tu nombre para poder atenderte mejor 😊"
            );
            return;
        }
    }

    // 4. DETECTAR SOLICITUD DIRECTA DE CATÁLOGO
    const catalogKeywords = /\b(catálogo|catalogo|ver productos|productos|mostrar|quiero ver|categorías|categorias|opciones|anillos|cadenas|aretes|pulseras|joyería|joyeria)\b/i;
    const urgentCatalogKeywords = /\b(ver catálogo|catalogo ya|mostrar productos|quiero ver productos|ver opciones|mostrar opciones)\b/i;
    
    if (urgentCatalogKeywords.test(userQuery) || catalogKeywords.test(userQuery)) {
        console.log(`🏷️ Usuario solicita catálogo directamente: "${userQuery}"`);
        
        await whatsapp.sendTextMessage(to, 
            `¡Perfecto ${customer.name}! 🛍️ Te muestro nuestro catálogo organizado por categorías:`
        );
        
        // Mostrar categorías inmediatamente
        await whatsapp.sendCategoriesMessage(to);
        return;
    }

    // 5. CLIENTE YA TIENE CONSENTIMIENTO Y NOMBRE - Procesar con IA
    console.log(`✅ Cliente completo (${customer.name}). Procesando: "${userQuery}"`);

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
            case 'collect_name':
            case 'clarify_inquiry':
                await whatsapp.sendTextMessage(to, aiResponse.response);
                break;
            case 'list_products':
            case 'product_inquiry':
                await whatsapp.sendTextMessage(to, aiResponse.response);
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
                session.context.lastSeenProduct = product._id;
                await session.save();
            }
        }

        const priceString = product.maxPrice ? `Desde $${product.minPrice} hasta $${product.maxPrice}` : `Precio: $${product.minPrice}`;

        await whatsapp.sendImageMessage(to, product.imageUrl, `${product.name}\n\nMaterial: ${product.material}\nGema: ${product.gem}\n${priceString}\n\n${product.description}`);

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
        
        console.log("🌟 Enviando mensaje interactivo para iniciar el Flow de Bienvenida...");
        
        if (process.env.DISABLE_FLOWS === 'true') {
            // Modo sin flows - mensaje de texto
            await whatsapp.sendTextMessage(to, 
                "¡Perfecto! Bienvenido a Joyería Rimer. 💎✨\n\n" +
                "Somos especialistas en joyería fina artesanal.\n\n" +
                "Para comenzar, ¿podrías decirme tu nombre?"
            );
        } else {
            // Enviar el Flow de bienvenida (solo informativo)
            await whatsapp.sendInteractiveFlowButton(
                to,
                "¡Bienvenido a Joyería Rimer! 💎\n\nToca el botón para ver nuestro mensaje de bienvenida.",
                "Ver Bienvenida",
                process.env.WHATSAPP_FLOW_WELCOME_ID || "1520596295787894",
            );
            
            // Después del flow, pedimos el nombre primero
            await whatsapp.sendTextMessage(
                to,
                "¡Perfecto! Para ofrecerte una atención personalizada...\n\n¿Cuál es tu nombre? 😊"
            );
        }
        
        return customer; // ← IMPORTANTE: Retornar el customer actualizado
    } catch (error) {
        console.error("❌ Error al procesar aceptación de términos:", error);
        await whatsapp.sendTextMessage(to, "Hubo un problema al procesar tu aceptación. Por favor, intenta nuevamente.");
        return null;
    }
}

/**
 * Limpia todos los datos de un usuario específico (para testing)
 * @param {string} phoneNumber - El número de teléfono del usuario a limpiar
 */
async function cleanUserData(phoneNumber) {
    try {
        console.log(`🧹 Limpiando datos del usuario: ${phoneNumber}`);
        
        // Buscar el cliente
        const customer = await Customer.findOne({ phone: phoneNumber });
        if (!customer) {
            console.log(`⚠️ Usuario ${phoneNumber} no encontrado en la base de datos.`);
            return { success: true, message: 'Usuario no encontrado (ya limpio)' };
        }

        // Eliminar sesiones de chat
        const sessions = await ChatSession.find({ customer: customer._id });
        const sessionIds = sessions.map(s => s._id);
        
        // Eliminar logs de mensajes
        await MessageLog.deleteMany({ session: { $in: sessionIds } });
        console.log(`🗑️ Eliminados logs de mensajes para ${phoneNumber}`);
        
        // Eliminar sesiones
        await ChatSession.deleteMany({ customer: customer._id });
        console.log(`🗑️ Eliminadas sesiones de chat para ${phoneNumber}`);
        
        // Eliminar cliente
        await Customer.deleteOne({ _id: customer._id });
        console.log(`🗑️ Eliminado cliente ${phoneNumber}`);
        
        console.log(`✅ Datos limpiados correctamente para ${phoneNumber}`);
        return { success: true, message: 'Datos limpiados correctamente' };
        
    } catch (error) {
        console.error(`❌ Error limpiando datos de ${phoneNumber}:`, error);
        return { success: false, error: error.message };
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
/**
 * Maneja la selección de categorías desde botones interactivos.
 */
async function handleCategorySelection(to, categoryButtonId) {
    try {
        console.log(`🏷️ Procesando selección de categoría: ${categoryButtonId}`);
        
        const categoryMap = {
            'cat_anillos': 'anillos',
            'cat_cadenas': 'cadenas',
            'cat_aretes': 'aretes'
        };
        
        const category = categoryMap[categoryButtonId];
        if (category) {
            await whatsapp.sendCategoryProducts(to, category);
        } else {
            await whatsapp.sendTextMessage(to, "🤔 No pude procesar esa categoría. ¿Puedes intentar de nuevo?");
        }
        
    } catch (error) {
        console.error("❌ Error manejando selección de categoría:", error);
        await whatsapp.sendTextMessage(to, "Hubo un problema procesando tu selección. ¿Puedes intentar nuevamente?");
    }
}

/**
 * Maneja la solicitud de detalles de un producto específico.
 */
async function handleProductDetailRequest(to, productButtonId) {
    try {
        console.log(`📦 Mostrando detalles del producto: ${productButtonId}`);
        
        await whatsapp.sendProductDetail(to, productButtonId);
        
    } catch (error) {
        console.error("❌ Error mostrando detalles del producto:", error);
        await whatsapp.sendTextMessage(to, "Hubo un problema mostrando los detalles. ¿Puedes intentar nuevamente?");
    }
}

/**
 * Maneja las acciones finales de productos (Cotizar, Agendar, Ver Más).
 */
async function handleProductAction(to, actionId) {
    try {
        console.log(`⚡ Procesando acción: ${actionId}`);
        
        switch(actionId) {
            case 'cotizar_producto':
                await whatsapp.sendTextMessage(to, 
                    "💰 ¡Perfecto! Para enviarte una cotización personalizada necesito algunos datos:\n\n" +
                    "📱 Nombre completo\n📍 Ciudad\n💍 Producto de interés\n💎 Preferencias especiales\n\n" +
                    "¿Te parece si agendamos una cita para darte atención personalizada?"
                );
                break;
                
            case 'agendar_cita':
                await whatsapp.sendTextMessage(to,
                    "📅 ¡Excelente! Para agendar tu cita necesito:\n\n" +
                    "🗓️ Fecha preferida\n⏰ Hora conveniente\n📍 Sucursal (Centro o Norte)\n💍 Productos a ver\n\n" +
                    "Responde con tu disponibilidad y coordinaremos todo 😊"
                );
                break;
                
            case 'ver_mas_productos':
                await whatsapp.sendCategoriesMessage(to);
                break;
                
            default:
                await whatsapp.sendTextMessage(to, "🤔 No reconozco esa opción. ¿Puedes elegir una de las opciones disponibles?");
        }
        
    } catch (error) {
        console.error("❌ Error procesando acción del producto:", error);
        await whatsapp.sendTextMessage(to, "Hubo un problema procesando tu solicitud. ¿Puedes intentar nuevamente?");
    }
}

module.exports = {
    handleSmartReply,
    handleProductSelection,
    handleTermsAcceptance,
    handleCategorySelection,
    handleProductDetailRequest,
    handleProductAction,
    cleanUserData,
    getModel,
    Customer,
    ChatSession,
    MessageLog
};